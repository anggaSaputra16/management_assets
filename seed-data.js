const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// Default admin credentials
const adminCredentials = {
  email: 'admin@company.com',
  password: 'password123'
};

let authToken = '';

// Helper function to make API calls
async function apiCall(method, endpoint, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${API_BASE}${endpoint}`,
      headers: {}
    };
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`Error ${method} ${endpoint}:`, error.response?.data || error.message);
    throw error;
  }
}

async function seedData() {
  console.log('🌱 Starting data seeding...');

  try {
    // 1. Login as admin
    console.log('🔐 Logging in as admin...');
    const loginResponse = await apiCall('POST', '/auth/login', adminCredentials);
    authToken = loginResponse.token;
    console.log('✅ Admin login successful');

    // 2. Create Company
    console.log('🏢 Creating default company...');
    const companyData = {
      name: 'PT Maju Bersama',
      code: 'PTM001',
      address: 'Jl. Sudirman No. 123, Jakarta',
      phone: '+62-21-1234567',
      email: 'info@majubersama.com',
      status: 'ACTIVE'
    };
    
    const company = await apiCall('POST', '/companies', companyData, authToken);
    console.log('✅ Company created:', company.data.name);

    // 3. Create Departments
    console.log('🏢 Creating departments...');
    const departments = [
      { name: 'IT Department', code: 'IT001', description: 'Information Technology Department' },
      { name: 'Finance Department', code: 'FIN001', description: 'Finance and Accounting Department' },
      { name: 'HR Department', code: 'HR001', description: 'Human Resources Department' },
      { name: 'Operations', code: 'OPS001', description: 'Operations Department' }
    ];

    const createdDepartments = [];
    for (const dept of departments) {
      const department = await apiCall('POST', '/departments', dept, authToken);
      createdDepartments.push(department.data);
      console.log('✅ Department created:', dept.name);
    }

    // 4. Create Positions
    console.log('👨‍💼 Creating positions...');
    const positions = [
      { name: 'IT Manager', code: 'ITM001', description: 'IT Department Manager', level: 'MANAGER' },
      { name: 'Software Developer', code: 'DEV001', description: 'Software Developer', level: 'STAFF' },
      { name: 'System Admin', code: 'SYS001', description: 'System Administrator', level: 'STAFF' },
      { name: 'Finance Manager', code: 'FIM001', description: 'Finance Manager', level: 'MANAGER' },
      { name: 'Accountant', code: 'ACC001', description: 'Accountant', level: 'STAFF' }
    ];

    const createdPositions = [];
    for (const pos of positions) {
      const position = await apiCall('POST', '/positions', pos, authToken);
      createdPositions.push(position.data);
      console.log('✅ Position created:', pos.name);
    }

    // 5. Create Categories
    console.log('📂 Creating asset categories...');
    const categories = [
      { name: 'Computer Hardware', code: 'COMP001', description: 'Computers, laptops, servers' },
      { name: 'Network Equipment', code: 'NET001', description: 'Routers, switches, access points' },
      { name: 'Office Furniture', code: 'FURN001', description: 'Desks, chairs, cabinets' },
      { name: 'Vehicles', code: 'VEH001', description: 'Company cars, motorcycles' },
      { name: 'Software License', code: 'SOFT001', description: 'Software licenses and subscriptions' }
    ];

    const createdCategories = [];
    for (const cat of categories) {
      const category = await apiCall('POST', '/categories', cat, authToken);
      createdCategories.push(category.data);
      console.log('✅ Category created:', cat.name);
    }

    // 6. Create Locations
    console.log('📍 Creating locations...');
    const locations = [
      { name: 'Head Office - Floor 1', description: 'Main office first floor' },
      { name: 'Head Office - Floor 2', description: 'Main office second floor' },
      { name: 'IT Server Room', description: 'Data center and server room' },
      { name: 'Warehouse', description: 'Storage and warehouse area' },
      { name: 'Parking Area', description: 'Company parking area' }
    ];

    const createdLocations = [];
    for (const loc of locations) {
      const location = await apiCall('POST', '/locations', loc, authToken);
      createdLocations.push(location.data);
      console.log('✅ Location created:', loc.name);
    }

    // 7. Create Vendors
    console.log('🏪 Creating vendors...');
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

    const createdVendors = [];
    for (const vendor of vendors) {
      const createdVendor = await apiCall('POST', '/vendors', vendor, authToken);
      createdVendors.push(createdVendor.data);
      console.log('✅ Vendor created:', vendor.name);
    }

    // 8. Create Spare Parts
    console.log('🔧 Creating spare parts...');
    const spareParts = [
      {
        partNumber: 'RAM-DDR4-16GB',
        name: 'DDR4 RAM 16GB',
        description: '16GB DDR4 Memory Module',
        category: 'Computer Components',
        unitPrice: 800000,
        stockQuantity: 50,
        minimumStock: 10,
        unit: 'PIECE'
      },
      {
        partNumber: 'SSD-500GB',
        name: 'SSD 500GB',
        description: '500GB Solid State Drive',
        category: 'Storage',
        unitPrice: 1200000,
        stockQuantity: 30,
        minimumStock: 5,
        unit: 'PIECE'
      }
    ];

    const createdSpareParts = [];
    for (const part of spareParts) {
      const createdPart = await apiCall('POST', '/spare-parts', part, authToken);
      createdSpareParts.push(createdPart.data);
      console.log('✅ Spare part created:', part.name);
    }

    // 9. Create Software Assets
    console.log('💻 Creating software assets...');
    const softwareAssets = [
      {
        name: 'Microsoft Office 365',
        version: '2024',
        licenseType: 'SUBSCRIPTION',
        licenseKey: 'MSOF-2024-XXXX-YYYY',
        purchaseDate: '2024-01-15',
        expiryDate: '2025-01-15',
        totalLicenses: 100,
        usedLicenses: 45,
        vendor: 'Microsoft Corporation',
        purchasePrice: 150000000,
        description: 'Office productivity suite'
      },
      {
        name: 'Adobe Creative Suite',
        version: '2024',
        licenseType: 'PERPETUAL',
        licenseKey: 'ADBE-2024-XXXX-YYYY',
        purchaseDate: '2024-02-01',
        totalLicenses: 10,
        usedLicenses: 8,
        vendor: 'Adobe Systems',
        purchasePrice: 50000000,
        description: 'Creative design software suite'
      }
    ];

    const createdSoftwareAssets = [];
    for (const software of softwareAssets) {
      const createdSoftware = await apiCall('POST', '/software-assets', software, authToken);
      createdSoftwareAssets.push(createdSoftware.data);
      console.log('✅ Software asset created:', software.name);
    }

    // 10. Create Sample Assets
    console.log('💼 Creating sample assets...');
    const assets = [
      {
        name: 'Dell Latitude 5520 - IT001',
        assetTag: 'LAPTOP-001',
        serialNumber: 'DLL5520001',
        categoryId: createdCategories.find(c => c.code === 'COMP001').id,
        locationId: createdLocations[0].id,
        vendorId: createdVendors[0].id,
        purchaseDate: '2024-01-15',
        purchasePrice: 15000000,
        warrantyExpiry: '2027-01-15',
        status: 'AVAILABLE',
        condition: 'GOOD',
        description: 'Dell Latitude laptop for office use',
        specifications: {
          processor: 'Intel i7-1165G7',
          ram: '16GB DDR4',
          storage: '512GB SSD',
          display: '15.6 inch Full HD'
        }
      },
      {
        name: 'HP ProDesk 600 G6 - Finance',
        assetTag: 'DESKTOP-001',
        serialNumber: 'HPP600001',
        categoryId: createdCategories.find(c => c.code === 'COMP001').id,
        locationId: createdLocations[1].id,
        vendorId: createdVendors[0].id,
        purchaseDate: '2024-02-01',
        purchasePrice: 12000000,
        warrantyExpiry: '2027-02-01',
        status: 'AVAILABLE',
        condition: 'EXCELLENT',
        description: 'HP desktop computer for finance department'
      }
    ];

    const createdAssets = [];
    for (const asset of assets) {
      const createdAsset = await apiCall('POST', '/assets', asset, authToken);
      createdAssets.push(createdAsset.data);
      console.log('✅ Asset created:', asset.name);
    }

    console.log('\n🎉 Data seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`✅ Company: 1`);
    console.log(`✅ Departments: ${createdDepartments.length}`);
    console.log(`✅ Positions: ${createdPositions.length}`);
    console.log(`✅ Categories: ${createdCategories.length}`);
    console.log(`✅ Locations: ${createdLocations.length}`);
    console.log(`✅ Vendors: ${createdVendors.length}`);
    console.log(`✅ Spare Parts: ${createdSpareParts.length}`);
    console.log(`✅ Software Assets: ${createdSoftwareAssets.length}`);
    console.log(`✅ Assets: ${createdAssets.length}`);

    console.log('\n🔐 Test Credentials:');
    console.log('Email: admin@company.com');
    console.log('Password: password123');
    
    console.log('\n🌐 Access URLs:');
    console.log('Frontend: http://localhost:3001');
    console.log('Backend API: http://localhost:5000/api');

  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

// Run the seeding
seedData();