const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  try {
    // Create default company first
    const defaultCompany = await prisma.company.upsert({
      where: { code: 'MAIN' },
      update: {},
      create: {
        name: 'PT. Asset Management Indonesia',
        code: 'MAIN',
        email: 'info@assetmanagement.co.id',
        phone: '+62215551000',
        address: 'Jl. Sudirman Kav 1, Jakarta Pusat, Indonesia 10110',
        website: 'www.assetmanagement.co.id',
        taxNumber: '01.234.567.8-901.000',
        registrationNumber: 'REG-2024-001',
        description: 'Main company for asset management system',
        isActive: true
      }
    });

    console.log(`Created company: ${defaultCompany.name} (${defaultCompany.code})`);

    // Create departments
    const itDept = await prisma.department.upsert({
      where: { companyId_code: { companyId: defaultCompany.id, code: 'IT' } },
      update: {},
      create: {
        name: 'Information Technology',
        code: 'IT',
        description: 'IT Department',
        budgetLimit: 1000000000,
        companyId: defaultCompany.id
      }
    });

    const hrDept = await prisma.department.upsert({
      where: { companyId_code: { companyId: defaultCompany.id, code: 'HR' } },
      update: {},
      create: {
        name: 'Human Resources',
        code: 'HR', 
        description: 'HR Department',
        budgetLimit: 500000000,
        companyId: defaultCompany.id
      }
    });

    const finDept = await prisma.department.upsert({
      where: { companyId_code: { companyId: defaultCompany.id, code: 'FIN' } },
      update: {},
      create: {
        name: 'Finance',
        code: 'FIN',
        description: 'Finance Department',
        budgetLimit: 2000000000,
        companyId: defaultCompany.id
      }
    });

    console.log('Created departments');

    // Create users with employeeNumber
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    const users = [
      // System Administrator
      {
        email: 'admin@company.com',
        username: 'admin',
        password: hashedPassword,
        firstName: 'System',
        lastName: 'Administrator',
        role: 'ADMIN',
        phone: '+62812345678901',
        employeeNumber: 'EMP001',
        companyId: defaultCompany.id
      },
      // Asset Admin
      {
        email: 'asset.admin@company.com',
        username: 'assetadmin',
        password: hashedPassword,
        firstName: 'Asset',
        lastName: 'Administrator',
        role: 'ASSET_ADMIN',
        departmentId: itDept.id,
        phone: '+62812345678902',
        employeeNumber: 'EMP002',
        companyId: defaultCompany.id
      },
      // IT Manager
      {
        email: 'it.manager@company.com',
        username: 'itmanager',
        password: hashedPassword,
        firstName: 'IT',
        lastName: 'Manager',
        role: 'MANAGER',
        departmentId: itDept.id,
        phone: '+62812345678903',
        employeeNumber: 'EMP003',
        companyId: defaultCompany.id
      },
      // Finance Manager
      {
        email: 'finance.manager@company.com',
        username: 'finmanager',
        password: hashedPassword,
        firstName: 'Finance',
        lastName: 'Manager',
        role: 'MANAGER',
        departmentId: finDept.id,
        phone: '+62812345678904',
        employeeNumber: 'EMP004',
        companyId: defaultCompany.id
      }
    ];

    for (const user of users) {
      await prisma.user.upsert({
        where: { employeeNumber: user.employeeNumber },
        update: {},
        create: user
      });
    }

    console.log('Created users');

    // Create categories
    const categories = [
      { name: 'Computer Hardware', code: 'COMP', description: 'Computers, laptops, servers' },
      { name: 'Network Equipment', code: 'NET', description: 'Routers, switches, access points' },
      { name: 'Office Furniture', code: 'FURN', description: 'Desks, chairs, cabinets' },
      { name: 'Vehicles', code: 'VEH', description: 'Company cars, motorcycles' }
    ];

    for (const cat of categories) {
      await prisma.category.upsert({
        where: { companyId_code: { companyId: defaultCompany.id, code: cat.code } },
        update: {},
        create: {
          ...cat,
          companyId: defaultCompany.id
        }
      });
    }

    console.log('Created categories');

    // Create locations
    const locations = [
      { name: 'Head Office - Floor 1', description: 'Main office first floor' },
      { name: 'Head Office - Floor 2', description: 'Main office second floor' },
      { name: 'IT Server Room', description: 'Data center and server room' },
      { name: 'Warehouse', description: 'Storage and warehouse area' }
    ];

    for (const loc of locations) {
      await prisma.location.upsert({
        where: { companyId_name: { companyId: defaultCompany.id, name: loc.name } },
        update: {},
        create: {
          ...loc,
          companyId: defaultCompany.id
        }
      });
    }

    console.log('Created locations');

    // Create vendors
    const vendors = [
      { 
        name: 'PT Tech Solutions', 
        code: 'VEN001',
        email: 'sales@techsolutions.com',
        phone: '+62-21-9876543',
        address: 'Jl. Gatot Subroto No. 45, Jakarta',
        contactPerson: 'John Doe'
      },
      { 
        name: 'CV Digital Store', 
        code: 'VEN002',
        email: 'info@digitalstore.com',
        phone: '+62-21-5551234',
        address: 'Jl. Thamrin No. 78, Jakarta',
        contactPerson: 'Jane Smith'
      }
    ];

    for (const vendor of vendors) {
      await prisma.vendor.upsert({
        where: { companyId_code: { companyId: defaultCompany.id, code: vendor.code } },
        update: {},
        create: {
          ...vendor,
          companyId: defaultCompany.id
        }
      });
    }

    console.log('Created vendors');

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n🔐 Test Credentials:');
    console.log('Admin: admin@company.com / password123');
    console.log('Asset Admin: asset.admin@company.com / password123');
    console.log('IT Manager: it.manager@company.com / password123');
    console.log('Finance Manager: finance.manager@company.com / password123');

  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });