const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'prisma/schema.prisma');
let schemaContent = fs.readFileSync(schemaPath, 'utf8');

// Replace datasource
schemaContent = schemaContent.replace(
  /datasource db \{\n  provider = "sqlserver"\n  url      = env\("DATABASE_URL"\)\n\}/g,
  `// datasource db {
//   provider = "sqlserver"
//   url      = env("DATABASE_URL")
// }

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}`
);

// Comment out SQL Server specific DB types
// Let's copy everything from model User onwards
const splitPoint = schemaContent.indexOf('model User {');
const beforeSplit = schemaContent.substring(0, splitPoint);
const afterSplit = schemaContent.substring(splitPoint);

// Comment out all lines in afterSplit
const commentedAfterSplit = afterSplit.split('\n').map(line => '// ' + line).join('\n');

// Create Postgres compatible versions (remove @db.* and @map)
// We'll also change NoAction to SetNull or default, but NoAction is ok in Postgres usually, wait Postgres supports NoAction.
// Let's just remove all @db.xxx
let postgresModels = afterSplit.replace(/@db\.\w+(\(\d+(,\d+)?\))?/g, '');
// @map is ok but let's keep it clean
postgresModels = postgresModels.replace(/@map\("[^"]+"\)/g, '');

const finalContent = beforeSplit + '\n// --- SQL SERVER ORIGINAL MODELS ---\n' + commentedAfterSplit + '\n\n// --- POSTGRESQL MODELS ---\n' + postgresModels;

fs.writeFileSync(schemaPath, finalContent, 'utf8');
console.log('Schema updated successfully');
