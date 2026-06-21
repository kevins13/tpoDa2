const fs = require('fs');
let c = fs.readFileSync('prisma/schema.prisma', 'utf8');

c = c.replace(/provider = "sqlserver"/, 'provider = "postgresql"');
c = c.replace(/@db\.DateTime2/g, '@db.Timestamp(3)');
c = c.replace(/@db\.Date/g, '@db.Date');
c = c.replace(/@db\.Time/g, '@db.Time');
c = c.replace(/Bytes\s*\/\/\s*varbinary\(max\)/g, 'Bytes');

fs.writeFileSync('prisma/schema.prisma', c);
