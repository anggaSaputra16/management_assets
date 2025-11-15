# 🌱 Database Seeding Guide

## Overview
File `backend/prisma/seed-complete.js` adalah seed script yang robust dan lengkap untuk menginisialisasi database dengan data testing yang komprehensif.

## 📋 Seed Flow (Urutan Eksekusi)

Seed script mengikuti dependency hierarchy yang benar:

```
1. GlobalTypeMaster (Master data untuk semua enum types)
   ↓
2. SystemSettings (Konfigurasi sistem)
   ↓
3. Companies (4 perusahaan: MJT, SSJ, GRI, NLS)
   ↓
4. Departments (5 departemen per company)
   ↓
5. Locations (2-4 lokasi per company berdasarkan tipe bisnis)
   ↓
6. Categories (5 kategori per company)
   ↓
7. Vendors (2 vendor per company)
   ↓
8. Employees (5 employees per company)
   ↓
9. Users (5 users dengan roles berbeda per company)
   ↓
10. Assets (10 assets per company)
    ↓
11. Spare Parts (5 spare parts per company)
    ↓
12. Software Assets + Licenses (3 software per company)
    ↓
13. Maintenance Records (maintenance schedule)
    ↓
14. Asset Requests (sample requests)
```

## 🏢 Companies Created

1. **PT Maju Jaya Technology (MJT)** - IT Services
   - Locations: Head Office, Data Center, Warehouse
   
2. **PT Sentosa Sejahtera (SSJ)** - Manufacturing
   - Locations: Factory, Main Office, Distribution Center
   
3. **PT Global Retail Indonesia (GRI)** - Retail
   - Locations: 2 Stores, Head Office, Warehouse
   
4. **PT Nusantara Logistics (NLS)** - Logistics
   - Locations: Jakarta Hub, Surabaya Hub, Office

## 👥 User Roles per Company

Setiap company memiliki 5 users dengan roles:
- **ADMIN** - Full system access
- **ASSET_ADMIN** - Asset management access
- **MANAGER** - Department manager with approval rights
- **DEPARTMENT_USER** - Basic user access
- **TECHNICIAN** - Maintenance operations

## 🔐 Test Credentials

### Format Login:
```
Email: [role]@[company_code].com
Password: password123
```

### Contoh:
- `admin@mjt.com` / `password123`
- `asset.admin@ssj.com` / `password123`
- `manager@gri.com` / `password123`
- `user@nls.com` / `password123`
- `tech@mjt.com` / `password123`

## 📊 Data Summary

Per company akan dibuat:
- 5 Departments (IT, HR, Finance, Operations, Marketing)
- 2-4 Locations (tergantung tipe bisnis)
- 5 Categories (Computer, Furniture, Network, Vehicle, Building)
- 2 Vendors
- 5 Employees
- 5 Users (1 per role)
- 10 Assets (mixed available & in-use)
- 5 Spare Parts (RAM modules)
- 3 Software Assets with Licenses (Office 365, Windows 11, Photoshop)
- Maintenance Records (for in-use assets)
- Asset Requests (sample pending request)

**Total across 4 companies:**
- 4 Companies
- 20 Departments
- ~12 Locations
- 20 Categories
- 8 Vendors
- 20 Employees
- 20 Users
- 40 Assets
- 20 Spare Parts
- 12 Software Assets with Licenses

## 🚀 How to Run Seed

### Prerequisites
1. PostgreSQL database harus berjalan
2. Connection string sudah dikonfigurasi di `.env`

### Commands

```bash
# Dari root project
cd backend

# Generate Prisma Client (jika belum)
npm run db:generate

# Run migrations (jika ada perubahan schema)
npm run db:migrate

# Run seed
npm run db:seed

# atau langsung
node prisma/seed-complete.js
```

### Reset & Reseed (Full Clean)
```bash
# Reset database dan run seed ulang
npm run db:reset

# Akan otomatis:
# 1. Drop all tables
# 2. Run migrations
# 3. Run seed script
```

## 🔧 Customization

Edit `backend/prisma/seed-complete.js` untuk:
- Tambah/kurangi jumlah companies
- Ubah company data (nama, alamat, dll)
- Ubah jumlah assets/users/departments
- Tambah data custom

## ⚠️ Important Notes

1. **Idempotent**: Seed menggunakan `upsert` sehingga aman dijalankan multiple times tanpa duplikasi data
2. **Order Matters**: Urutan seeding sangat penting karena foreign key dependencies
3. **GlobalTypeMaster**: Seed semua enum labels untuk dropdown UI
4. **Test Data**: Data ini untuk development/testing, JANGAN digunakan di production
5. **Passwords**: Semua user menggunakan password `password123` (hashed dengan bcrypt)

## 📝 Related Files

- `backend/prisma/schema.prisma` - Database schema
- `backend/prisma/seed-complete.js` - Seed script (THIS IS THE ONLY SEED FILE)
- `backend/prisma/enum-backup.json` - Backup of all enum values
- `backend/package.json` - Contains seed script configuration

## 🎯 Next Steps After Seeding

1. Verify data di Prisma Studio:
   ```bash
   npm run db:studio
   ```

2. Login ke aplikasi dengan test credentials

3. Test semua fitur dengan data yang sudah di-seed

4. Mulai development dengan data yang siap pakai!
