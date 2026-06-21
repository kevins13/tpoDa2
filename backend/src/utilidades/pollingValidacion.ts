import bcrypt from 'bcrypt';
import { prisma } from '../configuracion/baseDatos';
import { sendTemporaryPasswordEmail, sendRejectionEmail, sendDeactivationEmail } from './correo';

async function procesarValidadosSinMail() {
  const pendientes = await prisma.extra_credencialesCliente.findMany({
    where: { estadoCredencial: 'validado', mailEnviado: false },
    include: { clientes: { include: { personas: true } } },
  });

  for (const cred of pendientes) {
    try {
      const tempCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const passwordHash = await bcrypt.hash(tempCode, 10);

      await prisma.clientes.update({
        where: { identificador: cred.cliente },
        data: { admitido: 'si', categoria: 'comun' },
      });

      const nombre = cred.clientes.personas?.nombre ?? '';
      await sendTemporaryPasswordEmail(cred.email, tempCode, nombre);

      await prisma.extra_credencialesCliente.update({
        where: { identificador: cred.identificador },
        data: { passwordHash, mailEnviado: true },
      });

      console.log(`Mail de validación enviado a ${cred.email}`);
    } catch (err) {
      console.error(`Error al procesar validación para ${cred.email}:`, err);
    }
  }
}

async function procesarRechazadosSinMail() {
  const rechazados = await prisma.extra_credencialesCliente.findMany({
    where: { estadoCredencial: 'rechazado', mailEnviado: false },
    include: { clientes: { include: { personas: true } } },
  });

  for (const cred of rechazados) {
    try {
      const nombre = cred.clientes.personas?.nombre ?? 'Usuario';
      await sendRejectionEmail(cred.email, nombre);

      await prisma.personas.update({
        where: { identificador: cred.clientes.identificador },
        data: { estado: 'inactivo' },
      });

      await prisma.extra_credencialesCliente.update({
        where: { identificador: cred.identificador },
        data: { mailEnviado: true },
      });

      console.log(`Mail de rechazo enviado a ${cred.email}`);
    } catch (err) {
      console.error(`Error al procesar rechazo para ${cred.email}:`, err);
    }
  }
}

async function procesarCuentasInactivadas() {
  const inactivados = await prisma.extra_credencialesCliente.findMany({
    where: {
      estadoCredencial: { notIn: ['inactivo', 'rechazado'] },
      clientes: { personas: { estado: 'inactivo' } },
    },
    include: { clientes: { include: { personas: true } } },
  });

  for (const cred of inactivados) {
    try {
      await prisma.extra_credencialesCliente.update({
        where: { identificador: cred.identificador },
        data: { estadoCredencial: 'inactivo' },
      });

      const nombre = cred.clientes.personas?.nombre ?? 'Usuario';
      await sendDeactivationEmail(cred.email, nombre);

      console.log(`Cuenta inactivada y notificada: ${cred.email}`);
    } catch (err) {
      console.error(`Error al procesar inactivación para ${cred.email}:`, err);
    }
  }
}

export function iniciarPollingValidacion(intervaloMs = 10000) {
  setInterval(async () => {
    await procesarValidadosSinMail();
    await procesarRechazadosSinMail();
    await procesarCuentasInactivadas();
  }, intervaloMs);
  console.log('Polling de validación iniciado');
}
