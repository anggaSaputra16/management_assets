const { prisma, connectDB } = require('../src/config/database');

async function main() {
  await connectDB();

  // Try to find a company to associate employees with
  let company = await prisma.company.findFirst();
  if (!company) {
    console.error('No company found in database. Create a company first.');
    process.exit(1);
  }

  const companyId = company.id;

  // Sample employees to insert (idempotent by npk)
  const employees = [
    { npk: 'EMP001', firstName: 'Agus', lastName: 'Saputra', email: 'agus.saputra@example.com', phone: '+628111000001', hireDate: new Date('2020-01-15'), position: 'IT Support' },
    { npk: 'EMP002', firstName: 'Siti', lastName: 'Nur', email: 'siti.nur@example.com', phone: '+628111000002', hireDate: new Date('2021-03-01'), position: 'Technician' },
    { npk: 'EMP003', firstName: 'Budi', lastName: 'Santoso', email: 'budi.santoso@example.com', phone: '+628111000003', hireDate: new Date('2019-07-22'), position: 'Asset Manager' },
    { npk: 'EMP004', firstName: 'Dewi', lastName: 'Lestari', email: 'dewi.lestari@example.com', phone: '+628111000004', hireDate: new Date('2022-09-10'), position: 'Accountant' },
    { npk: 'EMP005', firstName: 'Tono', lastName: 'Wijaya', email: 'tono.wijaya@example.com', phone: '+628111000005', hireDate: new Date('2023-06-05'), position: 'Warehouse' }
  ];

  let created = 0;
  let updated = 0;

  for (const e of employees) {
    try {
      const exists = await prisma.employee.findUnique({ where: { npk: e.npk } });
      if (exists) {
        // Update some fields to keep record fresh
        await prisma.employee.update({ where: { npk: e.npk }, data: { ...e, companyId } });
        updated++;
        console.log(`Updated employee ${e.npk}`);
      } else {
        await prisma.employee.create({ data: { ...e, companyId } });
        created++;
        console.log(`Created employee ${e.npk}`);
      }
    } catch (err) {
      console.error(`Failed to process employee ${e.npk}:`, err.message);
    }
  }

  console.log(`Finished. Created: ${created}, Updated: ${updated}`);

  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
});
