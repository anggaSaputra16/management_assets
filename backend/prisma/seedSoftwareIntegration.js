const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createSoftwareAssetIntegrationData() {
  try {
    console.log('Creating software asset integration test data...');

    // Get a company (assuming first company exists)
    const company = await prisma.company.findFirst();
    if (!company) {
      console.log('No company found. Run seed first.');
      return;
    }

    // Get first 3 assets for testing
    const assets = await prisma.asset.findMany({
      where: { companyId: company.id },
      take: 3
    });

    if (assets.length === 0) {
      console.log('No assets found. Run seed first.');
      return;
    }

    // Create software assets
    const softwareAssets = [
      {
        name: 'Microsoft Office 365',
        version: '2024',
        softwareType: 'PRODUCTIVITY',
        publisher: 'Microsoft Corporation',
        description: 'Office productivity suite',
        isActive: true,
        companyId: company.id
      },
      {
        name: 'Adobe Photoshop',
        version: '2024',
        softwareType: 'DESIGN',
        publisher: 'Adobe Inc.',
        description: 'Image editing software',
        isActive: true,
        companyId: company.id
      },
      {
        name: 'Visual Studio Code',
        version: '1.85.0',
        softwareType: 'DEVELOPMENT',
        publisher: 'Microsoft Corporation',
        description: 'Code editor',
        isActive: true,
        companyId: company.id
      },
      {
        name: 'Windows 11 Pro',
        version: '22H2',
        softwareType: 'OPERATING_SYSTEM',
        publisher: 'Microsoft Corporation',
        description: 'Operating system',
        isActive: true,
        companyId: company.id
      }
    ];

    const createdSoftwareAssets = [];
    for (const softwareData of softwareAssets) {
      const software = await prisma.softwareAsset.create({
        data: softwareData
      });
      createdSoftwareAssets.push(software);
      console.log(`Created software: ${software.name}`);
    }

    // Create licenses for each software asset
    const createdLicenses = [];
    for (const software of createdSoftwareAssets) {
      const license = await prisma.softwareLicense.create({
        data: {
          softwareAssetId: software.id,
          licenseKey: `${software.name.replace(/\s+/g, '-').toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          licenseType: 'VOLUME',
          totalSeats: 10,
          isActive: true,
          companyId: company.id,
          purchaseDate: new Date('2024-01-01'),
          expiryDate: new Date('2025-12-31')
        }
      });
      createdLicenses.push(license);
      console.log(`Created license for ${software.name}: ${license.licenseKey}`);
    }

    // Get admin user for installations
    const adminUser = await prisma.user.findFirst({
      where: {
        companyId: company.id,
        role: 'ADMIN'
      }
    });

    // Install software on assets
    const installations = [
      // Install Office on all 3 assets
      ...assets.map(asset => ({
        assetId: asset.id,
        softwareAssetId: createdSoftwareAssets[0].id, // Office 365
        licenseId: createdLicenses[0].id,
        userId: adminUser.id,
        companyId: company.id,
        version: createdSoftwareAssets[0].version,
        status: 'INSTALLED',
        installationDate: new Date('2024-01-15')
      })),
      
      // Install Photoshop on 2 assets
      ...assets.slice(0, 2).map(asset => ({
        assetId: asset.id,
        softwareAssetId: createdSoftwareAssets[1].id, // Photoshop
        licenseId: createdLicenses[1].id,
        userId: adminUser.id,
        companyId: company.id,
        version: createdSoftwareAssets[1].version,
        status: 'INSTALLED',
        installationDate: new Date('2024-02-01'),
        installationPath: 'C:\\Program Files\\Adobe\\Adobe Photoshop 2024'
      })),
      
      // Install VS Code on 3 assets
      ...assets.map(asset => ({
        assetId: asset.id,
        softwareAssetId: createdSoftwareAssets[2].id, // VS Code
        licenseId: createdLicenses[2].id,
        userId: adminUser.id,
        companyId: company.id,
        version: createdSoftwareAssets[2].version,
        status: 'INSTALLED',
        installationDate: new Date('2024-01-20'),
        installationPath: 'C:\\Users\\AppData\\Local\\Programs\\Microsoft VS Code'
      })),
      
      // Install Windows 11 on first asset only
      {
        assetId: assets[0].id,
        softwareAssetId: createdSoftwareAssets[3].id, // Windows 11
        licenseId: createdLicenses[3].id,
        userId: adminUser.id,
        companyId: company.id,
        version: createdSoftwareAssets[3].version,
        status: 'INSTALLED',
        installationDate: new Date('2024-01-01'),
        notes: 'Pre-installed operating system'
      }
    ];

    // Create all installations
    for (const installationData of installations) {
      const installation = await prisma.softwareInstallation.create({
        data: installationData
      });
      console.log(`Installed ${createdSoftwareAssets.find(s => s.id === installation.softwareAssetId).name} on asset ${installation.assetId}`);
    }

    console.log('\\nSoftware integration test data created successfully!');
    console.log(`Created ${createdSoftwareAssets.length} software assets`);
    console.log(`Created ${createdLicenses.length} licenses`);
    console.log(`Created ${installations.length} software installations`);
    
  } catch (error) {
    console.error('Error creating software integration data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createSoftwareAssetIntegrationData();