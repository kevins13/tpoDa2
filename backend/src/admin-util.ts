import { prisma } from './configuracion/baseDatos';
import { authService } from './modulos/autenticacion/autenticacion.service';

import bcrypt from 'bcrypt';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'listar') {
    const pendientes = await prisma.extra_credencialesCliente.findMany({
      where: { estadoCredencial: 'pendiente' },
      include: { clientes: { include: { personas: true } } }
    });

    console.log(`\n📋 USUARIOS PENDIENTES DE VALIDACIÓN (${pendientes.length}):\n`);
    for (const cred of pendientes) {
      console.log(`- ID Cliente: ${cred.cliente} | Email: ${cred.email} | Nombre: ${cred.clientes.personas?.nombre}`);
    }
    console.log();
  } else if (command === 'activar') {
    const email = args[1];
    if (!email) {
      console.error('Por favor especifica el email del usuario. Ej: npm run admin activar usuario@email.com');
      process.exit(1);
    }

    const cred = await prisma.extra_credencialesCliente.findUnique({
      where: { email }
    });

    if (!cred) {
      console.error(`❌ No se encontró ningún usuario con el email: ${email}`);
      process.exit(1);
    }

    if (cred.estadoCredencial !== 'pendiente') {
      console.log(`⚠️ El usuario ya está validado (estado: ${cred.estadoCredencial}). Regenerando contraseña temporal...`);
      const tempCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const passwordHash = await bcrypt.hash(tempCode, 10);
      await prisma.extra_credencialesCliente.update({
        where: { identificador: cred.identificador },
        data: {
          passwordHash,
          debeCambiarClave: 'si',
          estadoCredencial: 'validado',
          mailEnviado: true,
        }
      });
      console.log(`\n🔑 [CLAVE TEMPORAL GENERADA] Email: ${email} | Clave: ${tempCode}\n`);
      console.log(`✅ ¡Contraseña restablecida con éxito!`);
      return;
    }

    console.log(`🔄 Activando cliente ID ${cred.cliente} (${email})...`);
    const res = await authService.validarCliente(cred.cliente);
    console.log(`✅ ¡Éxito! ${res.message}`);
  } else if (command === 'listar-articulos') {
    const pendientes = await prisma.productos.findMany({
      where: { disponible: 'no' },
    });

    console.log(`\n📋 ARTÍCULOS PENDIENTES DE VALIDACIÓN (${pendientes.length}):\n`);
    for (const p of pendientes) {
      console.log(`- ID Artículo: ${p.identificador} | Título: ${p.descripcionCatalogo} | Descripción: ${p.descripcionCompleta.replace(/\n/g, ' ').substring(0, 50)}...`);
    }
    console.log();
  } else if (command === 'validar-articulo') {
    const artIdStr = args[1];
    if (!artIdStr) {
      console.error('Por favor especifica el ID del artículo. Ej: npm run admin validar-articulo 1');
      process.exit(1);
    }
    const artId = parseInt(artIdStr, 10);
    if (isNaN(artId)) {
      console.error('El ID del artículo debe ser un número.');
      process.exit(1);
    }

    const producto = await prisma.productos.findUnique({
      where: { identificador: artId }
    });

    if (!producto) {
      console.error(`❌ No se encontró ningún artículo con el ID: ${artId}`);
      process.exit(1);
    }

    if (producto.disponible === 'si') {
      console.log(`⚠️ El artículo ya está validado y disponible.`);
      return;
    }

    console.log(`🔄 Validando artículo ID ${artId} (${producto.descripcionCatalogo})...`);
    
    await prisma.productos.update({
      where: { identificador: artId },
      data: { disponible: 'si' }
    });

    const revisor = await prisma.empleados.findFirst();
    if (!revisor) {
      console.error('❌ No se encontró ningún empleado en el sistema para asignar a la subasta.');
      process.exit(1);
    }

    const auctionTitle = `Subasta Especial: ${producto.descripcionCatalogo}`;
    await prisma.subastas.create({
      data: {
        fecha: new Date(),
        hora: new Date(),
        estado: 'ACTIVE',
        categoria: 'Común',
        extra_subastas: {
          create: {
            titulo: auctionTitle,
            descripcion: producto.descripcionCompleta,
          }
        },
        catalogos: {
          create: {
            descripcion: auctionTitle,
            responsable: revisor.identificador,
            itemsCatalogo: {
              create: {
                producto: producto.identificador,
                precioBase: 100,
                comision: 10,
                subastado: 'no'
              }
            }
          }
        }
      }
    });

    await prisma.notificaciones.create({
      data: {
        identificadorPersona: producto.duenio,
        mensaje: `Tu artículo "${producto.descripcionCatalogo}" ha sido validado y ya está en subasta.`
      }
    });

    console.log(`✅ ¡Artículo validado con éxito y subasta creada!`);
  } else {
    console.log(`
Uso de la herramienta de administración:
  - Listar usuarios pendientes:
    npm run admin listar
  - Activar un usuario por su email:
    npm run admin activar <email>
  - Listar artículos pendientes de validación:
    npm run admin listar-articulos
  - Validar un artículo por su ID:
    npm run admin validar-articulo <id_articulo>
`);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
