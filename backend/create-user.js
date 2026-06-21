const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const email = 'test@test.com';
  const password = 'password123';

  // Verificar si ya existe
  const existing = await prisma.credenciales_web.findUnique({
    where: { email }
  });

  if (existing) {
    console.log('El usuario ya existe.');
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const persona = await prisma.personas.create({
    data: {
      documento: '12345678',
      nombre: 'Usuario Prueba',
      direccion: 'Calle Falsa 123',
      estado: 'activo',
      credenciales: {
        create: {
          email: email,
          passwordHash: passwordHash,
          mustChangePassword: false
        }
      }
    }
  });

  console.log(`Usuario creado exitosamente:`);
  console.log(`Email: ${email}`);
  console.log(`Contraseña: ${password}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
