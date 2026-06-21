const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Generando hash de bcrypt para "1234"...');
  const passwordHash = await bcrypt.hash('1234', 10);
  
  console.log('Actualizando contraseñas en credenciales_web...');
  const resultCreds = await prisma.credenciales_web.updateMany({
    data: {
      passwordHash: passwordHash
    }
  });
  console.log(`Actualizadas ${resultCreds.count} credenciales en credenciales_web.`);

  // También actualizamos la tabla User por si alguno ya intentó loguearse
  console.log('Actualizando contraseñas en la tabla User (si existen)...');
  const resultUsers = await prisma.user.updateMany({
    data: {
      passwordHash: passwordHash
    }
  });
  console.log(`Actualizados ${resultUsers.count} usuarios en la tabla User.`);

  console.log('¡Listo! Ahora puedes iniciar sesión con cualquier usuario usando la clave: 1234');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
