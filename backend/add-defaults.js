const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

// Add @default(cuid()) to all id fields that don't have it
// Pattern: "id          String   @id" -> "id          String   @id @default(cuid())"
schema = schema.replace(
  /^(\s+id\s+String\s+@id)(?!\s+@default)/gm,
  '$1 @default(cuid())'
);

// Add @updatedAt to all updatedAt DateTime fields
schema = schema.replace(
  /^(\s+updatedAt\s+DateTime)(?!\s+@updatedAt)/gm,
  '$1 @updatedAt'
);

fs.writeFileSync(schemaPath, schema, 'utf8');
console.log('✅ Added @default(cuid()) to all id fields');
console.log('✅ Added @updatedAt to all updatedAt fields');
