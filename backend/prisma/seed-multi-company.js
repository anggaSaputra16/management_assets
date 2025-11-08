const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting multi-company database seeding...');

  try {
    // ==================== CREATE 4 COMPANIES ====================
    console.log('\n📊 Creating Companies...');
    
    const companies = [];
    const companyData = [
      {
        name: 'PT Maju Jaya Technology',
        code: 'MJT',
        email: 'info@majujaya.co.id',
        phone: '+62215551001',
        address: 'Jl. Sudirman No. 100, Jakarta Pusat 10110',
        website: 'www.majujaya.co.id',
        taxNumber: '01.234.567.8-100.000',
        registrationNumber: 'MJT-2024-001',
        description: 'Technology solutions and IT services company'
      },
      {
        name: 'PT Sentosa Sejahtera',
        code: 'SSJ',
        email: 'contact@sentosa.co.id',
        phone: '+62215552002',
        address: 'Jl. Thamrin No. 50, Jakarta Pusat 10350',
        website: 'www.sentosa.co.id',
        taxNumber: '02.345.678.9-200.000',
        registrationNumber: 'SSJ-2024-002',
        description: 'Manufacturing and distribution company'
      },
      {
        name: 'PT Global Retail Indonesia',
        code: 'GRI',
        email: 'hello@globalretail.co.id',
        phone: '+62215553003',
        address: 'Jl. Gatot Subroto No. 75, Jakarta Selatan 12930',
        website: 'www.globalretail.co.id',
        taxNumber: '03.456.789.0-300.000',
        registrationNumber: 'GRI-2024-003',
        description: 'Retail chain with multiple store locations'
      },
      {
        name: 'PT Nusantara Logistics',
        code: 'NLS',
        email: 'support@nusantara.co.id',
        phone: '+62215554004',
        address: 'Jl. MT Haryono No. 25, Jakarta Timur 13630',
        website: 'www.nusantaralogistics.co.id',
        taxNumber: '04.567.890.1-400.000',
        registrationNumber: 'NLS-2024-004',
        description: 'Logistics and transportation services'
      }
    ];

    for (const data of companyData) {
      const company = await prisma.company.upsert({
        where: { code: data.code },
        update: {},
        create: data
      });
      companies.push(company);
      console.log(`  ✅ ${company.name} (${company.code})`);
    }

    // ==================== CREATE DEPARTMENTS PER COMPANY ====================
    console.log('\n🏢 Creating Departments for each company...');
    
    const departmentsByCompany = {};
    
    for (const company of companies) {
      const deptData = [
        { name: 'IT Department', code: 'IT', description: 'Information Technology' },
        { name: 'Finance', code: 'FIN', description: 'Finance & Accounting' },
        { name: 'Operations', code: 'OPS', description: 'Operations & Production' },
        { name: 'Human Resources', code: 'HR', description: 'HR & Admin' }
      ];

      departmentsByCompany[company.id] = [];

      for (const dept of deptData) {
        const department = await prisma.department.create({
          data: {
            name: dept.name,
            code: `${company.code}-${dept.code}`,
            description: dept.description,
            companyId: company.id
          }
        });
        departmentsByCompany[company.id].push(department);
      }
      console.log(`  ✅ ${company.name}: ${deptData.length} departments`);
    }

    // ==================== CREATE LOCATIONS PER COMPANY ====================
    console.log('\n📍 Creating Locations for each company...');
    
    const locationsByCompany = {};
    
    const locationTemplates = {
      'MJT': [
        { name: 'Head Office', building: 'Tower A', floor: '10', city: 'Jakarta', type: 'OFFICE' },
        { name: 'Data Center', building: 'Tower B', floor: '5', city: 'Jakarta', type: 'DATA_CENTER' },
        { name: 'Warehouse', building: 'Warehouse 1', floor: '1', city: 'Bekasi', type: 'WAREHOUSE' }
      ],
      'SSJ': [
        { name: 'Factory Karawang', building: 'Plant 1', floor: '1', city: 'Karawang', type: 'FACTORY' },
        { name: 'Main Office', building: 'Office Tower', floor: '8', city: 'Jakarta', type: 'OFFICE' },
        { name: 'Distribution Center', building: 'DC Building', floor: '1', city: 'Tangerang', type: 'WAREHOUSE' }
      ],
      'GRI': [
        { name: 'Store Senayan City', building: 'Mall Senayan', floor: '2', city: 'Jakarta', type: 'RETAIL' },
        { name: 'Store Plaza Indonesia', building: 'PI Building', floor: '3', city: 'Jakarta', type: 'RETAIL' },
        { name: 'Head Office', building: 'Office Tower', floor: '12', city: 'Jakarta', type: 'OFFICE' },
        { name: 'Warehouse Cibitung', building: 'WH Main', floor: '1', city: 'Bekasi', type: 'WAREHOUSE' }
      ],
      'NLS': [
        { name: 'Main Hub Jakarta', building: 'Hub A', floor: '1', city: 'Jakarta', type: 'WAREHOUSE' },
        { name: 'Hub Surabaya', building: 'Hub B', floor: '1', city: 'Surabaya', type: 'WAREHOUSE' },
        { name: 'Office Pusat', building: 'HQ Building', floor: '7', city: 'Jakarta', type: 'OFFICE' }
      ]
    };

    for (const company of companies) {
      const locations = locationTemplates[company.code] || [];
      locationsByCompany[company.id] = [];

      for (const loc of locations) {
        const location = await prisma.location.create({
          data: {
            name: loc.name,
            code: `${company.code}-LOC-${locationsByCompany[company.id].length + 1}`,
            building: loc.building,
            floor: loc.floor,
            city: loc.city,
            type: loc.type,
            companyId: company.id
          }
        });
        locationsByCompany[company.id].push(location);
      }
      console.log(`  ✅ ${company.name}: ${locations.length} locations`);
    }



    // ==================== CREATE USERS PER COMPANY ====================
    console.log('\n👥 Creating Users for each company...');
    
    const hashedPassword = await bcrypt.hash('password123', 12);
    const usersByCompany = {};

    for (let i = 0; i < companies.length; i++) {
      const company = companies[i];
      const departments = departmentsByCompany[company.id];
      const locations = locationsByCompany[company.id];
      const headOfficeLocation = locations.find(l => l.type === 'OFFICE') || locations[0];
      usersByCompany[company.id] = [];

      const userTemplates = [
        { 
          email: `admin@${company.code.toLowerCase()}.com`, 
          username: `admin_${company.code.toLowerCase()}`,
          firstName: 'Admin',
          lastName: company.name.split(' ')[1],
          role: 'ADMIN',
          departmentId: null,
          locationId: headOfficeLocation?.id
        },
        { 
          email: `manager.it@${company.code.toLowerCase()}.com`, 
          username: `manager_it_${company.code.toLowerCase()}`,
          firstName: 'IT',
          lastName: 'Manager',
          role: 'MANAGER',
          departmentId: departments[0].id,
          locationId: headOfficeLocation?.id
        },
        { 
          email: `staff.it@${company.code.toLowerCase()}.com`, 
          username: `staff_it_${company.code.toLowerCase()}`,
          firstName: 'IT',
          lastName: 'Staff',
          role: 'DEPARTMENT_USER',
          departmentId: departments[0].id,
          locationId: locations[1]?.id || headOfficeLocation?.id
        },
        { 
          email: `technician@${company.code.toLowerCase()}.com`, 
          username: `tech_${company.code.toLowerCase()}`,
          firstName: 'Tech',
          lastName: 'Support',
          role: 'TECHNICIAN',
          departmentId: departments[0].id,
          locationId: locations[0]?.id
        }
      ];

      for (const userData of userTemplates) {
        const user = await prisma.user.create({
          data: {
            ...userData,
            employeeNumber: `EMP-${company.code}-${String(usersByCompany[company.id].length + 1).padStart(3, '0')}`,
            password: hashedPassword,
            companyId: company.id
          }
        });
        usersByCompany[company.id].push(user);
      }
      console.log(`  ✅ ${company.name}: ${userTemplates.length} users`);
    }

    // ==================== CREATE CATEGORIES PER COMPANY ====================
    console.log('\n📁 Creating Categories for each company...');
    
    const categoriesByCompany = {};
    
    const categoryTemplates = [
      { name: 'Computer & Laptop', code: 'COMP' },
      { name: 'Office Furniture', code: 'FURN' },
      { name: 'Network Equipment', code: 'NET' },
      { name: 'Vehicle', code: 'VEH' },
      { name: 'Building', code: 'BLDG' }
    ];

    for (const company of companies) {
      categoriesByCompany[company.id] = [];

      for (const cat of categoryTemplates) {
        const category = await prisma.category.create({
          data: {
            name: cat.name,
            code: `${company.code}-${cat.code}`,
            companyId: company.id
          }
        });
        categoriesByCompany[company.id].push(category);
      }
      console.log(`  ✅ ${company.name}: ${categoryTemplates.length} categories`);
    }

    // ==================== CREATE VENDORS PER COMPANY ====================
    console.log('\n🏪 Creating Vendors for each company...');
    
    const vendorsByCompany = {};
    
    for (let i = 0; i < companies.length; i++) {
      const company = companies[i];
      vendorsByCompany[company.id] = [];

      const vendorData = [
        {
          name: `Tech Solutions ${company.code}`,
          code: `${company.code}-VND001`,
          email: `sales@techsolutions${i + 1}.com`,
          phone: `+6221555${1000 + i}`,
          contactPerson: 'Sales Manager'
        },
        {
          name: `Office Supplies ${company.code}`,
          code: `${company.code}-VND002`,
          email: `info@officesupplies${i + 1}.com`,
          phone: `+6221555${2000 + i}`,
          contactPerson: 'Account Manager'
        }
      ];

      for (const vend of vendorData) {
        const vendor = await prisma.vendor.create({
          data: {
            ...vend,
            companyId: company.id
          }
        });
        vendorsByCompany[company.id].push(vendor);
      }
      console.log(`  ✅ ${company.name}: ${vendorData.length} vendors`);
    }

    // ==================== CREATE EMPLOYEES PER COMPANY ====================
    console.log('\n👤 Creating Employees for each company...');
    
    const employeesByCompany = {};
    
    for (const company of companies) {
      const departments = departmentsByCompany[company.id];
      const locations = locationsByCompany[company.id];
      employeesByCompany[company.id] = [];

      const employeeCount = 5;
      for (let j = 0; j < employeeCount; j++) {
        const department = departments[j % departments.length];
        const location = locations[j % locations.length];
        
        const employee = await prisma.employee.create({
          data: {
            npk: `NPK-${company.code}-${String(j + 1).padStart(4, '0')}`,
            firstName: `Employee${j + 1}`,
            lastName: company.code,
            email: `employee${j + 1}@${company.code.toLowerCase()}.com`,
            phone: `+628123456${String(j).padStart(3, '0')}`,
            position: j % 2 === 0 ? 'Staff' : 'Senior Staff',
            hireDate: new Date(2023, j % 12, 1),
            companyId: company.id,
            departmentId: department.id,
            locationId: location.id
          }
        });
        employeesByCompany[company.id].push(employee);
      }
      console.log(`  ✅ ${company.name}: ${employeeCount} employees`);
    }

    // ==================== CREATE ASSETS PER COMPANY ====================
    console.log('\n💼 Creating Assets for each company...');
    
    for (const company of companies) {
      const categories = categoriesByCompany[company.id];
      const locations = locationsByCompany[company.id];
      const vendors = vendorsByCompany[company.id];
      const departments = departmentsByCompany[company.id];
      const employees = employeesByCompany[company.id];

      const assetCount = 10; // 10 assets per company

      for (let j = 0; j < assetCount; j++) {
        const category = categories[j % categories.length];
        const location = locations[j % locations.length];
        const vendor = vendors[j % vendors.length];
        const department = departments[j % departments.length];
        const assignedEmployee = j < 5 ? employees[j % employees.length] : null;

        await prisma.asset.create({
          data: {
            assetTag: `${company.code}-AST-${String(j + 1).padStart(4, '0')}`,
            name: `${category.name} #${j + 1}`,
            description: `${category.name} for ${department.name}`,
            serialNumber: `SN-${company.code}-${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`,
            model: `Model-${String.fromCharCode(65 + (j % 5))}${j + 1}`,
            brand: j % 2 === 0 ? 'Dell' : 'HP',
            purchaseDate: new Date(2024, j % 12, 1),
            purchasePrice: 5000000 + (j * 500000),
            currentValue: 4000000 + (j * 400000),
            warrantyExpiry: new Date(2026, j % 12, 1),
            status: j < 5 ? 'IN_USE' : 'AVAILABLE',
            condition: 'GOOD',
            companyId: company.id,
            categoryId: category.id,
            locationId: location.id,
            vendorId: vendor.id,
            departmentId: department.id,
            assignedEmployeeId: assignedEmployee?.id
          }
        });
      }
      console.log(`  ✅ ${company.name}: ${assetCount} assets`);
    }

    // ==================== CREATE SPARE PARTS PER COMPANY ====================
    console.log('\n🔧 Creating Spare Parts for each company...');
    
    for (const company of companies) {
      const vendors = vendorsByCompany[company.id];
      
      const sparePartData = [
        { name: 'RAM DDR4 16GB', partNumber: `RAM-${company.code}-001`, unitPrice: 1500000 },
        { name: 'SSD 512GB', partNumber: `SSD-${company.code}-002`, unitPrice: 1200000 },
        { name: 'Power Supply 500W', partNumber: `PSU-${company.code}-003`, unitPrice: 800000 },
        { name: 'Monitor Cable HDMI', partNumber: `CBL-${company.code}-004`, unitPrice: 150000 },
        { name: 'Keyboard Wireless', partNumber: `KBD-${company.code}-005`, unitPrice: 350000 }
      ];

      for (const part of sparePartData) {
        await prisma.sparePart.create({
          data: {
            ...part,
            category: 'HARDWARE',
            partType: 'COMPONENT',
            status: 'ACTIVE',
            stockLevel: 10 + Math.floor(Math.random() * 20),
            minStockLevel: 5,
            maxStockLevel: 50,
            companyId: company.id,
            vendorId: vendors[0].id
          }
        });
      }
      console.log(`  ✅ ${company.name}: ${sparePartData.length} spare parts`);
    }

    // ==================== CREATE MAINTENANCE RECORDS ====================
    console.log('\n🔨 Creating Maintenance Records...');
    
    for (const company of companies) {
      const assets = await prisma.asset.findMany({
        where: { companyId: company.id },
        take: 3
      });

      const technician = usersByCompany[company.id].find(u => u.role === 'TECHNICIAN');
      const vendor = vendorsByCompany[company.id][0];

      for (let i = 0; i < assets.length; i++) {
        await prisma.maintenanceRecord.create({
          data: {
            maintenanceNumber: `MNT-${company.code}-${String(i + 1).padStart(4, '0')}`,
            maintenanceType: i % 2 === 0 ? 'PREVENTIVE' : 'CORRECTIVE',
            title: `${i % 2 === 0 ? 'Regular' : 'Emergency'} Maintenance`,
            description: `Maintenance work for ${assets[i].name}`,
            scheduledDate: new Date(2024, 10, i + 1),
            status: 'SCHEDULED',
            priority: 'MEDIUM',
            estimatedCost: 500000 + (i * 100000),
            assetId: assets[i].id,
            companyId: company.id,
            technicianId: technician?.id,
            vendorId: vendor.id
          }
        });
      }
      console.log(`  ✅ ${company.name}: ${assets.length} maintenance records`);
    }

    // ==================== CREATE ASSET REQUESTS ====================
    console.log('\n📝 Creating Asset Requests...');
    
    for (const company of companies) {
      const users = usersByCompany[company.id];
      const departments = departmentsByCompany[company.id];
      const requester = users.find(u => u.role === 'DEPARTMENT_USER');

      await prisma.assetRequest.create({
        data: {
          requestNumber: `REQ-${company.code}-0001`,
          requestType: 'ASSET_REQUEST',
          title: 'New Laptop Request',
          description: 'Need new laptop for development work',
          justification: 'Current laptop is outdated and slow',
          status: 'PENDING',
          priority: 'HIGH',
          requestedDate: new Date(),
          requiredDate: new Date(2024, 11, 15),
          estimatedCost: 15000000,
          requesterId: requester.id,
          departmentId: departments[0].id,
          companyId: company.id
        }
      });
      console.log(`  ✅ ${company.name}: 1 asset request`);
    }

    console.log('\n✨ Multi-company seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Companies: ${companies.length}`);
    console.log(`   Locations: ${Object.values(locationsByCompany).flat().length}`);
    console.log(`   Departments: ${companies.length * 4}`);
    console.log(`   Users: ${companies.length * 4}`);
    console.log(`   Employees: ${companies.length * 5}`);
    console.log(`   Categories: ${companies.length * 5}`);
    console.log(`   Vendors: ${companies.length * 2}`);
    console.log(`   Assets: ${companies.length * 10}`);
    console.log(`   Spare Parts: ${companies.length * 5}`);
    console.log('\n🔑 Login credentials (password: password123):');
    for (const company of companies) {
      console.log(`\n   ${company.name}:`);
      console.log(`     Admin: admin@${company.code.toLowerCase()}.com`);
      console.log(`     Manager: manager.it@${company.code.toLowerCase()}.com`);
      console.log(`     Staff: staff.it@${company.code.toLowerCase()}.com`);
      console.log(`     Tech: technician@${company.code.toLowerCase()}.com`);
    }

  } catch (error) {
    console.error('❌ Error seeding database:', error);
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
