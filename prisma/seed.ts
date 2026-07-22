import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const company = await prisma.company.upsert({
    where: { slug: "aquatec" },
    update: {},
    create: {
      name: "Aquatec",
      slug: "aquatec",
    },
  });

  await prisma.user.upsert({
    where: { companyId_email: { companyId: company.id, email: "master@aquatec.com" } },
    update: {},
    create: {
      companyId: company.id,
      email: "master@aquatec.com",
      name: "Rodrigo Prazeres",
      role: "MASTER",
      passwordHash: "aquatec123",
      phone: "11999990001",
    },
  });

  console.log("Seed OK — company:", company.slug);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
