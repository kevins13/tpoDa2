import { prisma } from './configuracion/baseDatos';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('Cargando paises desde paises.sql...');
  const sqlPath = path.join(__dirname, '../../paises.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  
  // Eliminar comentarios o líneas vacías y ejecutar
  const cleanSql = sql
    .split('\n')
    .filter(line => line.trim() && !line.startsWith('--'))
    .join('\n');

  if (cleanSql.trim()) {
    await prisma.$executeRawUnsafe(cleanSql);
    console.log('✅ Paises cargados con éxito!');
  } else {
    console.log('⚠️ El archivo paises.sql está vacío.');
  }
}

main()
  .catch((e) => {
    console.error('❌ Error al cargar paises:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
