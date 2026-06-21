import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed extendido de usuarios de prueba...');

  const hashDemo = await bcrypt.hash('Demo1234!', 10);
  const primerPais = await prisma.paises.findFirst({ orderBy: { numero: 'asc' } });
  const empleadoAdmin = await prisma.empleados.findFirst({ where: { cargo: 'Administrador' } });

  if (!empleadoAdmin) {
    throw new Error('No se encontro al administrador (debes correr el seed original primero).');
  }

  const usuarios = [
    { email: 'comun@hammer.com', cat: 'comun', name: 'Usuario Comun' },
    { email: 'especial@hammer.com', cat: 'especial', name: 'Usuario Especial' },
    { email: 'plata@hammer.com', cat: 'plata', name: 'Usuario Plata' },
    { email: 'platino@hammer.com', cat: 'platino', name: 'Usuario Platino' },
  ];

  for (const u of usuarios) {
    // Si ya existe, no lo volvemos a crear
    const existing = await prisma.extra_credencialesCliente.findUnique({
      where: { email: u.email }
    });
    
    if (existing) {
      console.log(`${u.email} ya existe, omitiendo...`);
      continue;
    }

    const p = await prisma.personas.create({
      data: {
        documento: Math.floor(Math.random() * 100000000).toString(),
        nombre: u.name,
        direccion: 'Calle Falsa 123',
        estado: 'activo',
      },
    });

    await prisma.clientes.create({
      data: {
        identificador: p.identificador,
        numeroPais: primerPais?.numero ?? null,
        admitido: 'si',
        categoria: u.cat,
        verificador: empleadoAdmin.identificador,
        extra_credencialesCliente: {
          create: {
            email: u.email,
            passwordHash: hashDemo,
            debeCambiarClave: 'no',
            estadoCredencial: 'activo',
          },
        },
        extra_metodosPago: {
          create: {
            tipo: 'tarjeta_credito',
            numero: '4000123456789010',
            vencimiento: '12/28',
            cvv: '123',
            estado: 'verificado'
          }
        }
      },
    });

    await prisma.duenios.create({
      data: {
        identificador: p.identificador,
        numeroPais: primerPais?.numero ?? null,
        verificacionFinanciera: 'si',
        verificacionJudicial: 'si',
        calificacionRiesgo: 1,
        verificador: empleadoAdmin.identificador,
      },
    });

    console.log(`Creado ${u.email} (Categoria: ${u.cat})`);
  }

  console.log('Nuevos usuarios creados exitosamente!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
