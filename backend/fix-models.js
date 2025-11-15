const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

// Models to fix: table_name -> ModelName (singular, PascalCase)
const modelsMap = {
  'asset_requests': 'AssetRequest',
  'assets': 'Asset',
  'categories': 'Category',
  'companies': 'Company',
  'departments': 'Department',
  'employees': 'Employee',
  'global_type_master': 'GlobalTypeMaster',
  'inventory_loans': 'InventoryLoan',
  'locations': 'Location',
  'maintenance_records': 'MaintenanceRecord',
  'software_assets': 'SoftwareAsset',
  'software_licenses': 'SoftwareLicense',
  'spare_parts': 'SparePart',
  'system_settings': 'SystemSettings',
  'users': 'User',
  'vendors': 'Vendor'
};

Object.entries(modelsMap).forEach(([tableName, modelName]) => {
  // 1. Replace model declaration
  const modelRegex = new RegExp(`^model ${tableName} \\{`, 'gm');
  schema = schema.replace(modelRegex, `model ${modelName} {`);
  
  // 2. Replace relation types in all forms:
  //    - "tablename @relation" -> "ModelName @relation"
  //    - "tablename[]" -> "ModelName[]"
  //    - "tablename?" -> "ModelName?"
  //    - "tablename " (followed by newline or end) -> "ModelName "
  
  // Match tablename followed by @relation, [], ?, or whitespace
  const allFormsRegex = new RegExp(
    `(\\s+)(${tableName})(?=\\s+@relation|\\[\\]|\\?\\s|\\s*$)`,
    'g'
  );
  schema = schema.replace(allFormsRegex, `$1${modelName}`);
  
  // 3. Add @@map at the end of model if not exists
  const mapDirective = `@@map("${tableName}")`;
  const modelEndRegex = new RegExp(
    `(model ${modelName} \\{[\\s\\S]*?)(\\n\\})`,
    'g'
  );
  
  schema = schema.replace(modelEndRegex, (match, body, closing) => {
    if (body.includes(`@@map("${tableName}")`)) {
      return match;
    }
    return body + `\n\n  ${mapDirective}` + closing;
  });
  
  console.log(`✓ Fixed ${tableName} -> ${modelName}`);
});

fs.writeFileSync(schemaPath, schema, 'utf8');
console.log('\n✅ All models and relations fixed!');
