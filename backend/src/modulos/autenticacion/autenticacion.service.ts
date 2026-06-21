import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../configuracion/baseDatos';
import { sendTemporaryPasswordEmail, sendRejectionEmail } from '../../utilidades/correo';

export class AuthService {
  private readonly jwtSecret = process.env.JWT_SECRET || 'super_secret_jwt_key_12345';

  private async getEmpleadoVerificador(): Promise<number> {
    const empleado = await prisma.empleados.findFirst();
    if (empleado) return empleado.identificador;
    const nuevo = await prisma.empleados.create({
      data: { identificador: 1, cargo: 'Sistema' },
    });
    return nuevo.identificador;
  }

  async register(data: any, files?: { fotoFrente?: Buffer; fotoDorso?: Buffer }) {
    const existingCreds = await prisma.extra_credencialesCliente.findUnique({
      where: { email: data.email },
    });

    if (existingCreds) {
      throw new Error('El email ya está registrado');
    }

    const verificador = await this.getEmpleadoVerificador();
    const nombre = `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Usuario';
    // La contraseña temporal se genera pero se almacena hasheada;
    // el envío del mail ocurre cuando el admin valida → estadoCredencial = 'validado'
    const tempCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const passwordHash = await bcrypt.hash(tempCode, 10);

    const persona = await prisma.personas.create({
      data: {
        documento: data.documento || (Math.floor(Math.random() * 100000000)).toString(),
        nombre,
        direccion: data.address || '',
        estado: 'activo',
        clientes: {
          create: {
            verificador,
            admitido: 'no',
            numeroPais: data.numeroPais ? parseInt(data.numeroPais) : null,
            extra_credencialesCliente: {
              create: {
                email: data.email,
                passwordHash,
                debeCambiarClave: 'si',
                estadoCredencial: 'pendiente',
              },
            },
          },
        },
      },
      include: {
        clientes: {
          include: { extra_credencialesCliente: true },
        },
      },
    });

    if (files?.fotoFrente && files?.fotoDorso) {
      await prisma.extra_documentosCliente.create({
        data: {
          cliente: persona.identificador,
          fotoFrente: files.fotoFrente,
          fotoDorso: files.fotoDorso,
        },
      });
    }

    return {
      message: 'Solicitud enviada. Tu cuenta será verificada y recibirás una contraseña temporal por email.',
      user: { id: persona.identificador, email: data.email, name: persona.nombre },
    };
  }

  // Llamado por el admin al validar un cliente
  async validarCliente(clienteId: number) {
    const creds = await prisma.extra_credencialesCliente.findFirst({
      where: { cliente: clienteId },
      include: { clientes: { include: { personas: true } } },
    });

    if (!creds) throw new Error('Credenciales no encontradas');
    if (creds.estadoCredencial !== 'pendiente') {
      throw new Error('El cliente no está en estado pendiente');
    }

    const tempCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const passwordHash = await bcrypt.hash(tempCode, 10);

    await prisma.extra_credencialesCliente.update({
      where: { identificador: creds.identificador },
      data: {
        passwordHash,
        debeCambiarClave: 'si',
        estadoCredencial: 'validado',
        mailEnviado: true,
      },
    });

    await prisma.clientes.update({
      where: { identificador: clienteId },
      data: { admitido: 'si', categoria: 'comun' },
    });

    const nombre = creds.clientes.personas?.nombre ?? '';
    await sendTemporaryPasswordEmail(creds.email, tempCode, nombre);
    console.log(`\n🔑 [CLAVE TEMPORAL GENERADA] Email: ${creds.email} | Clave: ${tempCode}\n`);

    return { message: `Cliente validado y contraseña temporal enviada por email. Clave temporal: ${tempCode}` };
  }

  // Llamado por el admin al rechazar un cliente
  async rechazarCliente(clienteId: number) {
    const creds = await prisma.extra_credencialesCliente.findFirst({
      where: { cliente: clienteId },
      include: { clientes: { include: { personas: true } } },
    });

    if (!creds) throw new Error('Credenciales no encontradas');

    await prisma.extra_credencialesCliente.update({
      where: { identificador: creds.identificador },
      data: { estadoCredencial: 'rechazado' },
    });

    await prisma.personas.update({
      where: { identificador: creds.clientes.identificador },
      data: { estado: 'inactivo' },
    });

    const nombre = creds.clientes.personas?.nombre ?? 'Usuario';
    try {
      await sendRejectionEmail(creds.email, nombre);
      await prisma.extra_credencialesCliente.update({
        where: { identificador: creds.identificador },
        data: { mailEnviado: true },
      });
    } catch (e) {
      console.error(`⚠️  [MAIL RECHAZO FALLIDO] a ${creds.email}:`, e);
    }

    return { message: 'Cliente rechazado y notificado por email.' };
  }

  async login(data: any) {
    const creds = await prisma.extra_credencialesCliente.findUnique({
      where: { email: data.email },
      include: {
        clientes: {
          include: {
            personas: true,
            extra_metodosPago: { where: { estado: 'verificado' } },
          },
        },
      },
    });

    if (!creds) {
      throw new Error('Credenciales inválidas');
    }

    switch (creds.estadoCredencial) {
      case 'pendiente':
        throw new Error('Tu cuenta está pendiente de verificación por parte de la empresa.');
      case 'rechazado':
        throw new Error('Tu solicitud fue rechazada por la empresa. Contactate con soporte.');
      case 'inactivo':
        throw new Error('Tu cuenta fue desactivada. Contactate con soporte en subastas.hammer@gmail.com');
    }

    const isPasswordValid = await bcrypt.compare(data.password, creds.passwordHash);

    if (creds.estadoCredencial === 'validado') {
      if (!creds.mailEnviado) {
        throw new Error('Tu cuenta fue aprobada pero aún estamos procesando tu acceso. En breve recibirás un email con los pasos a seguir.');
      }
      if (creds.debeCambiarClave === 'si') {
        if (!isPasswordValid) {
          throw new Error('Contraseña temporal incorrecta. Revisá el email que recibiste.');
        }
        throw new Error('Debe completar el registro con su contraseña temporal antes de iniciar sesión.');
      }
    }

    if (!isPasswordValid) {
      throw new Error('Credenciales inválidas');
    }

    const token = this.generateToken(creds.clientes, creds.email);

    const nombreCompleto = creds.clientes.personas?.nombre ?? '';
    const partes = nombreCompleto.split(' ');
    const firstName = partes[0] ?? '';
    const lastName = partes.slice(1).join(' ');

    const catMap: Record<string, string> = {
      comun: 'Común', común: 'Común',
      especial: 'Especial',
      plata: 'Plata',
      oro: 'Oro',
      platino: 'Platino',
    };
    const category = catMap[(creds.clientes.categoria ?? '').toLowerCase()] ?? 'Común';

    return {
      user: {
        id: creds.clientes.identificador,
        firstName,
        lastName,
        email: creds.email,
        category,
        verified: creds.clientes.admitido === 'si',
        hasPaymentMethods: creds.clientes.extra_metodosPago.length > 0,
      },
      token,
    };
  }

  async completeRegistration(data: any) {
    const creds = await prisma.extra_credencialesCliente.findUnique({
      where: { email: data.email },
    });

    if (!creds) {
      throw new Error('Usuario no encontrado');
    }

    if (creds.estadoCredencial !== 'validado') {
      throw new Error('Solo se puede completar el registro cuando la cuenta fue validada por la empresa.');
    }

    const newPasswordHash = await bcrypt.hash(data.newPassword, 10);

    await prisma.extra_credencialesCliente.update({
      where: { identificador: creds.identificador },
      data: {
        passwordHash: newPasswordHash,
        debeCambiarClave: 'no',
        estadoCredencial: 'activo',
      },
    });

    return { message: 'Registro completado y contraseña actualizada exitosamente.' };
  }

  async forgotPassword(email: string) {
    const creds = await prisma.extra_credencialesCliente.findUnique({
      where: { email },
      include: { clientes: { include: { personas: true } } },
    });

    if (!creds) {
      throw new Error('Usuario no encontrado');
    }

    const tempCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const passwordHash = await bcrypt.hash(tempCode, 10);

    await prisma.extra_credencialesCliente.update({
      where: { identificador: creds.identificador },
      data: {
        passwordHash,
        debeCambiarClave: 'si',
        estadoCredencial: 'validado',
        mailEnviado: true,
      },
    });

    console.log(`\n🔑 [RECUPERACIÓN DE CONTRASEÑA] Email: ${email} | Código temporal: ${tempCode}\n`);

    return { message: 'Código de recuperación generado. Revisa la terminal.' };
  }


  private generateToken(cliente: any, email: string) {
    return jwt.sign(
      {
        id: cliente.identificador.toString(),
        email,
        category: cliente.categoria || 'comun',
      },
      this.jwtSecret,
      { expiresIn: '7d' }
    );
  }
}

export const authService = new AuthService();
