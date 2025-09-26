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

    // Create system settings
    await prisma.systemSettings.createMany({
      data: [
        {
          key: 'SYSTEM_NAME',
          value: 'Asset Management System',
          description: 'Name of the asset management system'
        },
        {
          key: 'DEFAULT_CURRENCY',
          value: 'IDR',
          description: 'Default currency for asset values'
        },
        {
          key: 'ASSET_TAG_PREFIX',
          value: 'AST',
          description: 'Prefix for auto-generated asset tags'
        },
        {
          key: 'MAINTENANCE_REMINDER_DAYS',
          value: '7',
          description: 'Days before maintenance due to send reminder'
        },
        {
          key: 'AUDIT_REMINDER_DAYS',
          value: '3',
          description: 'Days before audit due to send reminder'
        }
      ],
      skipDuplicates: true
    });

    // Create departments
    const departments = await prisma.department.createMany({
      data: [
        {
          name: 'Information Technology',
          code: 'IT',
          description: 'IT Department managing technology infrastructure',
          budgetLimit: 500000000,
          companyId: defaultCompany.id
        },
        {
          name: 'Human Resources',
          code: 'HR',
          description: 'Human Resources Department',
          budgetLimit: 200000000,
          companyId: defaultCompany.id
        },
        {
          name: 'Finance',
          code: 'FIN',
          description: 'Finance and Accounting Department',
          budgetLimit: 300000000,
          companyId: defaultCompany.id
        },
        {
          name: 'Operations',
          code: 'OPS',
          description: 'Operations Department',
          budgetLimit: 800000000,
          companyId: defaultCompany.id
        },
        {
          name: 'Marketing',
          code: 'MKT',
          description: 'Marketing Department',
          budgetLimit: 400000000,
          companyId: defaultCompany.id
        }
      ],
      skipDuplicates: true
    });

    // Get created departments
    const itDept = await prisma.department.findFirst({ 
      where: { code: 'IT', companyId: defaultCompany.id } 
    });
    const hrDept = await prisma.department.findFirst({ 
      where: { code: 'HR', companyId: defaultCompany.id } 
    });
    const finDept = await prisma.department.findFirst({ 
      where: { code: 'FIN', companyId: defaultCompany.id } 
    });
    const opsDept = await prisma.department.findFirst({ 
      where: { code: 'OPS', companyId: defaultCompany.id } 
    });
    const mktDept = await prisma.department.findFirst({ 
      where: { code: 'MKT', companyId: defaultCompany.id } 
    });

    // Create users
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    const users = [
      // Admin
      {
        employeeNumber: 'EMP001',
        email: 'admin@company.com',
        username: 'admin',
        password: hashedPassword,
        firstName: 'System',
        lastName: 'Administrator',
        role: 'ADMIN',
        phone: '+62812345678901',
        companyId: defaultCompany.id
      },
      // Asset Admin
      {
        employeeNumber: 'EMP002',
        email: 'asset.admin@company.com',
        username: 'assetadmin',
        password: hashedPassword,
        firstName: 'Asset',
        lastName: 'Administrator',
        role: 'ASSET_ADMIN',
        phone: '+62812345678902',
        companyId: defaultCompany.id
      },
      // Top Management
      {
        employeeNumber: 'EMP003',
        email: 'ceo@company.com',
        username: 'ceo',
        password: hashedPassword,
        firstName: 'Chief',
        lastName: 'Executive',
        role: 'TOP_MANAGEMENT',
        phone: '+62812345678903',
        companyId: defaultCompany.id
      },
      // IT Manager
      {
        employeeNumber: 'EMP004',
        email: 'it.manager@company.com',
        username: 'itmanager',
        password: hashedPassword,
        firstName: 'IT',
        lastName: 'Manager',
        role: 'MANAGER',
        departmentId: itDept?.id,
        phone: '+62812345678904',
        companyId: defaultCompany.id
      },
      // HR Manager
      {
        employeeNumber: 'EMP005',
        email: 'hr.manager@company.com',
        username: 'hrmanager',
        password: hashedPassword,
        firstName: 'HR',
        lastName: 'Manager',
        role: 'MANAGER',
        departmentId: hrDept?.id,
        phone: '+62812345678905',
        companyId: defaultCompany.id
      },
      // Technicians
      {
        employeeNumber: 'EMP006',
        email: 'tech1@company.com',
        username: 'technician1',
        password: hashedPassword,
        firstName: 'John',
        lastName: 'Technician',
        role: 'TECHNICIAN',
        departmentId: itDept?.id,
        phone: '+62812345678906',
        companyId: defaultCompany.id
      },
      {
        employeeNumber: 'EMP007',
        email: 'tech2@company.com',
        username: 'technician2',
        password: hashedPassword,
        firstName: 'Jane',
        lastName: 'Technician',
        role: 'TECHNICIAN',
        departmentId: opsDept?.id,
        phone: '+62812345678907',
        companyId: defaultCompany.id
      },
      // Auditor
      {
        employeeNumber: 'EMP008',
        email: 'auditor@company.com',
        username: 'auditor',
        password: hashedPassword,
        firstName: 'Internal',
        lastName: 'Auditor',
        role: 'AUDITOR',
        phone: '+62812345678908',
        companyId: defaultCompany.id
      },
      // Department Users
      {
        employeeNumber: 'EMP009',
        email: 'it.user@company.com',
        username: 'ituser',
        password: hashedPassword,
        firstName: 'IT',
        lastName: 'User',
        role: 'DEPARTMENT_USER',
        departmentId: itDept?.id,
        phone: '+62812345678909',
        companyId: defaultCompany.id
      },
      {
        employeeNumber: 'EMP010',
        email: 'hr.user@company.com',
        username: 'hruser',
        password: hashedPassword,
        firstName: 'HR',
        lastName: 'User',
        role: 'DEPARTMENT_USER',
        departmentId: hrDept?.id,
        phone: '+62812345678910',
        companyId: defaultCompany.id
      },
      {
        employeeNumber: 'EMP011',
        email: 'finance.user@company.com',
        username: 'finuser',
        password: hashedPassword,
        firstName: 'Finance',
        lastName: 'User',
        role: 'DEPARTMENT_USER',
        departmentId: finDept?.id,
        phone: '+62812345678911',
        companyId: defaultCompany.id
      }
    ];

    for (const user of users) {
      await prisma.user.upsert({
        where: { email: user.email },
        update: {},
        create: user
      });
    }

    // Create locations
    await prisma.location.createMany({
      data: [
        {
          name: 'Server Room',
          building: 'Main Building',
          floor: '1st Floor',
          room: 'Server-01',
          description: 'Main server room with cooling system',
          companyId: defaultCompany.id
        },
        {
          name: 'IT Office',
          building: 'Main Building',
          floor: '2nd Floor',
          room: 'IT-201',
          description: 'IT Department office space',
          companyId: defaultCompany.id
        },
        {
          name: 'HR Office',
          building: 'Main Building',
          floor: '3rd Floor',
          room: 'HR-301',
          description: 'Human Resources office',
          companyId: defaultCompany.id
        },
        {
          name: 'Finance Office',
          building: 'Main Building',
          floor: '4th Floor',
          room: 'FIN-401',
          description: 'Finance department office',
          companyId: defaultCompany.id
        },
        {
          name: 'Meeting Room A',
          building: 'Main Building',
          floor: '5th Floor',
          room: 'MTG-A',
          description: 'Large meeting room with projector',
          companyId: defaultCompany.id
        },
        {
          name: 'Warehouse',
          building: 'Storage Building',
          floor: 'Ground Floor',
          room: 'WH-001',
          description: 'Main storage warehouse',
          companyId: defaultCompany.id
        }
      ],
      skipDuplicates: true
    });

    // Create vendors
    await prisma.vendor.createMany({
      data: [
        {
          name: 'PT. Teknologi Maju',
          code: 'TM001',
          email: 'sales@tekmaju.com',
          phone: '+62215551234',
          address: 'Jl. Sudirman No. 123, Jakarta',
          contactPerson: 'Budi Santoso',
          companyId: defaultCompany.id
        },
        {
          name: 'CV. Komputer Sejahtera',
          code: 'KS001',
          email: 'info@kompsejahtera.com',
          phone: '+62215551235',
          address: 'Jl. Gatot Subroto No. 456, Jakarta',
          contactPerson: 'Siti Rahayu',
          companyId: defaultCompany.id
        },
        {
          name: 'PT. Furniture Indonesia',
          code: 'FI001',
          email: 'sales@furnitureid.com',
          phone: '+62215551236',
          address: 'Jl. Asia Afrika No. 789, Bandung',
          contactPerson: 'Ahmad Wijaya',
          companyId: defaultCompany.id
        },
        {
          name: 'PT. Elektronik Prima',
          code: 'EP001',
          email: 'sales@elektronikprima.com',
          phone: '+62215551237',
          address: 'Jl. Diponegoro No. 321, Surabaya',
          contactPerson: 'Dewi Lestari',
          companyId: defaultCompany.id
        }
      ],
      skipDuplicates: true
    });

    // Create categories
    const categories = [
      {
        name: 'Information Technology',
        code: 'IT',
        description: 'IT equipment and devices',
        companyId: defaultCompany.id
      },
      {
        name: 'Furniture',
        code: 'FUR',
        description: 'Office furniture and fixtures',
        companyId: defaultCompany.id
      },
      {
        name: 'Vehicles',
        code: 'VEH',
        description: 'Company vehicles and transportation',
        companyId: defaultCompany.id
      },
      {
        name: 'Office Equipment',
        code: 'OFC',
        description: 'General office equipment',
        companyId: defaultCompany.id
      }
    ];

    for (const category of categories) {
      await prisma.category.upsert({
        where: { 
          companyId_code: {
            companyId: defaultCompany.id,
            code: category.code
          }
        },
        update: {},
        create: category
      });
    }

    // Create subcategories
    const itCategory = await prisma.category.findFirst({ 
      where: { code: 'IT', companyId: defaultCompany.id } 
    });
    const furCategory = await prisma.category.findFirst({ 
      where: { code: 'FUR', companyId: defaultCompany.id } 
    });
    const vehCategory = await prisma.category.findFirst({ 
      where: { code: 'VEH', companyId: defaultCompany.id } 
    });
    const ofcCategory = await prisma.category.findFirst({ 
      where: { code: 'OFC', companyId: defaultCompany.id } 
    });

    const subcategories = [
      // IT subcategories
      {
        name: 'Computers',
        code: 'IT-COMP',
        description: 'Desktop and laptop computers',
        parentId: itCategory?.id,
        companyId: defaultCompany.id
      },
      {
        name: 'Servers',
        code: 'IT-SERV',
        description: 'Server hardware',
        parentId: itCategory?.id,
        companyId: defaultCompany.id
      },
      {
        name: 'Network Equipment',
        code: 'IT-NET',
        description: 'Routers, switches, and network devices',
        parentId: itCategory?.id,
        companyId: defaultCompany.id
      },
      {
        name: 'Printers',
        code: 'IT-PRINT',
        description: 'Printing devices',
        parentId: itCategory?.id,
        companyId: defaultCompany.id
      },
      // Furniture subcategories
      {
        name: 'Office Chairs',
        code: 'FUR-CHAIR',
        description: 'Office seating furniture',
        parentId: furCategory?.id,
        companyId: defaultCompany.id
      },
      {
        name: 'Desks',
        code: 'FUR-DESK',
        description: 'Office desks and tables',
        parentId: furCategory?.id,
        companyId: defaultCompany.id
      },
      // Vehicle subcategories
      {
        name: 'Company Cars',
        code: 'VEH-CAR',
        description: 'Company owned vehicles',
        parentId: vehCategory?.id,
        companyId: defaultCompany.id
      }
    ];

    for (const subcategory of subcategories) {
      await prisma.category.upsert({
        where: { 
          companyId_code: {
            companyId: defaultCompany.id,
            code: subcategory.code
          }
        },
        update: {},
        create: subcategory
      });
    }

    // Get some references for sample assets
    const serverRoom = await prisma.location.findFirst({ 
      where: { name: 'Server Room', companyId: defaultCompany.id } 
    });
    const itOffice = await prisma.location.findFirst({ 
      where: { name: 'IT Office', companyId: defaultCompany.id } 
    });
    const vendor1 = await prisma.vendor.findFirst({ 
      where: { code: 'TM001', companyId: defaultCompany.id } 
    });
    const vendor2 = await prisma.vendor.findFirst({ 
      where: { code: 'KS001', companyId: defaultCompany.id } 
    });
    const compCategory = await prisma.category.findFirst({ 
      where: { code: 'IT-COMP', companyId: defaultCompany.id } 
    });
    const servCategory = await prisma.category.findFirst({ 
      where: { code: 'IT-SERV', companyId: defaultCompany.id } 
    });
    const chairCategory = await prisma.category.findFirst({ 
      where: { code: 'FUR-CHAIR', companyId: defaultCompany.id } 
    });

    // Create sample assets
    const sampleAssets = [
      {
        assetTag: 'AST-2024-001',
        name: 'Dell OptiPlex 7090',
        description: 'Desktop computer for IT department',
        serialNumber: 'DL7090001',
        model: 'OptiPlex 7090',
        brand: 'Dell',
        purchaseDate: new Date('2024-01-15'),
        purchasePrice: 12000000,
        currentValue: 10000000,
        warrantyExpiry: new Date('2027-01-15'),
        status: 'IN_USE',
        condition: 'Good',
        categoryId: compCategory?.id,
        vendorId: vendor1?.id,
        locationId: itOffice?.id,
        departmentId: itDept?.id,
        companyId: defaultCompany.id
      },
      {
        assetTag: 'AST-2024-002',
        name: 'HP ProLiant DL380',
        description: 'Web server for company applications',
        serialNumber: 'HP380001',
        model: 'ProLiant DL380 Gen10',
        brand: 'HP',
        purchaseDate: new Date('2024-02-01'),
        purchasePrice: 45000000,
        currentValue: 40000000,
        warrantyExpiry: new Date('2027-02-01'),
        status: 'IN_USE',
        condition: 'Excellent',
        categoryId: servCategory?.id,
        vendorId: vendor2?.id,
        locationId: serverRoom?.id,
        departmentId: itDept?.id,
        companyId: defaultCompany.id
      },
      {
        assetTag: 'AST-2024-003',
        name: 'Ergonomic Office Chair',
        description: 'Executive office chair with lumbar support',
        serialNumber: 'ERG001',
        model: 'Executive Pro',
        brand: 'Office Comfort',
        purchaseDate: new Date('2024-03-10'),
        purchasePrice: 2500000,
        currentValue: 2200000,
        warrantyExpiry: new Date('2026-03-10'),
        status: 'AVAILABLE',
        condition: 'Good',
        categoryId: chairCategory?.id,
        vendorId: vendor1?.id,
        locationId: itOffice?.id,
        departmentId: hrDept?.id,
        companyId: defaultCompany.id
      }
    ];

    for (const asset of sampleAssets) {
      if (asset.categoryId && asset.vendorId && asset.locationId && asset.departmentId) {
        await prisma.asset.upsert({
          where: { 
            assetTag: asset.assetTag
          },
          update: {},
          create: asset
        });
      }
    }

    console.log('Database seeding completed successfully!');
    console.log('\nDefault admin credentials:');
    console.log('Email: admin@company.com');
    console.log('Password: password123');
    console.log('\nOther test accounts:');
    console.log('Asset Admin: asset.admin@company.com / password123');
    console.log('IT Manager: it.manager@company.com / password123');
    console.log('Technician: tech1@company.com / password123');
    console.log('Auditor: auditor@company.com / password123');

  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
