const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const auction = await prisma.auction.findUnique({
    where: { id: '0d49ff05-8263-4dca-b9e9-b36bcbb80523' }
  });
  console.log('Auction:', auction);
}
check().finally(() => prisma.$disconnect());
