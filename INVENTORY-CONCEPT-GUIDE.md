# Inventory Module - Concept & Usage Guide

## 📋 Konsep Inventory

### Inventory BUKAN Stok Gudang
Inventory di sistem ini adalah **alokasi asset ke department**, bukan stok barang di gudang.

### Alur Kerja Inventory:

```
1. ASSETS (Master Data)
   └─> Semua asset perusahaan disimpan di tabel Assets
   └─> Status: AVAILABLE, IN_USE, MAINTENANCE, RETIRED, DISPOSED

2. INVENTORY (Alokasi ke Department)
   └─> Mengalokasikan asset dari Assets ke Department tertentu
   └─> Qty = jumlah unit asset yang sama dialokasikan ke dept
   └─> availableQty = qty yang bisa dipinjam (belum di-loan)

3. LOAN (Peminjaman)
   └─> User meminjam asset dari inventory department
   └─> availableQty berkurang saat loan
   └─> availableQty bertambah saat return
```

## 🎯 Use Case Examples

### Contoh 1: IT Department - Laptop Pool
**Scenario:** IT Department punya 10 laptop untuk dipinjam karyawan

**Setup:**
1. **Assets Table:**
   - 10 laptop dengan nama "Dell Latitude 5420"
   - Status: AVAILABLE
   - Asset Tags: LAP-001 sampai LAP-010

2. **Inventory Table:**
   ```
   Department: IT Department
   Asset: Dell Latitude 5420 (salah satu dari LAP-001)
   Quantity: 10 (total unit dialokasi ke IT dept)
   Available Qty: 10 (semua available untuk dipinjam)
   Custodian: IT Manager (PIC yang manage inventory)
   ```

3. **Loan Process:**
   - User A pinjam 2 laptop → availableQty = 8
   - User B pinjam 1 laptop → availableQty = 7
   - User A return 2 laptop → availableQty = 9
   - User B return 1 laptop → availableQty = 10

### Contoh 2: HR Department - Meeting Room Equipment
**Scenario:** HR punya 5 projector untuk meeting rooms

**Setup:**
1. **Assets:**
   - 5 projector "Epson EB-X05"
   - PRJ-001 sampai PRJ-005

2. **Inventory:**
   ```
   Department: HR Department
   Asset: Epson EB-X05
   Quantity: 5
   Available Qty: 5
   Custodian: HR Admin
   Location: Meeting Room Storage
   Min Stock Level: 2 (alert jika < 2)
   ```

## 🔑 Field Explanations

### **Custodian (PIC)**
**Apa itu?** Person In Charge yang bertanggung jawab manage inventory di department

**Tugas Custodian:**
- ✅ Approve/reject loan requests
- ✅ Monitor available quantity
- ✅ Handle return process
- ✅ Receive notifications untuk:
  - Low stock alerts
  - Overdue loans
  - Damage reports

**Kapan isi Custodian?**
- **Optional** - tidak wajib diisi
- Biasanya: Manager, Admin, atau Staff yang ditunjuk
- Jika kosong: loan notifications ke semua Manager di company

**Contoh:**
```
IT Department → Custodian: IT Manager
HR Department → Custodian: HR Admin
Finance Dept → Custodian: Finance Staff
```

### **Quantity vs Available Qty**

**Quantity** = Total unit dialokasi ke department
- Tidak berubah saat loan/return
- Hanya berubah saat tambah/kurang alokasi

**Available Qty** = Qty yang bisa dipinjam saat ini
- Berkurang saat loan dibuat
- Bertambah saat loan di-return
- Formula: `availableQty = quantity - (total qty di-loan)`

**Contoh:**
```
Initial:
  Quantity: 10
  Available Qty: 10
  
After Loan (3 units):
  Quantity: 10 (tidak berubah)
  Available Qty: 7 (10 - 3)
  
After Return (3 units):
  Quantity: 10
  Available Qty: 10 (7 + 3)
```

### **Min Stock Level**
Alert threshold ketika availableQty turun di bawah level ini

**Contoh:**
- Min Stock Level: 3
- Available Qty: 5 → Normal (hijau)
- Available Qty: 2 → Alert (kuning) ⚠️
- Available Qty: 0 → Critical (merah) 🚨

**Use Case:**
- Pastikan selalu ada minimum stock untuk emergency
- Custodian dapat notifikasi saat stock rendah
- System bisa auto-create purchase request

## 📊 Validation Rules

### 1. Max Quantity Validation
Quantity yang dialokasi tidak boleh melebihi total asset di company

**Example:**
```
Company punya 15 laptop "Dell Latitude"
IT Dept sudah alokasi: 10 laptop
HR Dept mau alokasi: 8 laptop

❌ REJECTED: 10 + 8 = 18 > 15 (total available)
✅ ALLOWED: Max bisa alokasi ke HR: 5 laptop
```

### 2. Duplicate Prevention
1 Asset tidak bisa dialokasi 2x ke department yang sama

**Example:**
```
Asset: Laptop LAP-001
Department: IT Department

First allocation:
  ✅ Create inventory → Success

Second allocation (same asset, same dept):
  ❌ REJECTED: "Inventory already exists for this asset in this department"
  
💡 Solution: Edit existing inventory, jangan create baru
```

### 3. Loan Quantity Validation
Loan quantity tidak boleh melebihi availableQty

**Example:**
```
Available Qty: 3

User request loan: 2 units → ✅ Allowed
User request loan: 5 units → ❌ Rejected: "Insufficient inventory"
```

## 🔄 Workflow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    ASSET MANAGEMENT                      │
│                                                          │
│  1. CREATE ASSETS                                        │
│     └─> Input: Laptop Dell, Projector, etc              │
│     └─> Status: AVAILABLE                                │
│                                                          │
│  2. ALLOCATE TO DEPARTMENT (Create Inventory)            │
│     └─> Select Department                                │
│     └─> Select Asset (show available count)             │
│     └─> Input Quantity (max = available in company)     │
│     └─> Assign Custodian (optional)                     │
│                                                          │
│  3. LOAN PROCESS                                         │
│     ┌────────────────────────────────────────┐          │
│     │ User Request → Manager Approve → Active│          │
│     │ Active → User Return → Completed       │          │
│     └────────────────────────────────────────┘          │
│     └─> availableQty decremented on loan                │
│     └─> availableQty incremented on return              │
│                                                          │
│  4. NOTIFICATIONS                                        │
│     └─> Due today: Borrower + Custodian                 │
│     └─> Overdue: Borrower + Custodian + Manager         │
│     └─> Low stock: Custodian                            │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## 🎨 UI Improvements in Create Form

### Old UI:
```
Asset: [Dropdown - all assets]
Quantity: [Number input]
```

### New UI:
```
Department: [Dropdown]
  └─> Triggers: Load available assets for this dept

Asset: [Dropdown]
  └─> Shows:
      - Asset name + tag
      - Total in company: X units
      - Already allocated to this dept: Y units
      - Available to allocate: Z units
      - [Already Allocated] tag if exists
  
Quantity: [Number input]
  └─> Max = available to allocate
  └─> Helper text: "How many units to allocate"

Custodian: [Dropdown - users in selected department]
  └─> Helper: "Person responsible for managing inventory"
  └─> Optional

Min Stock Level: [Number input]
  └─> Helper: "Alert when available qty drops below"
```

## 🚀 Best Practices

### For Admin/Asset Manager:
1. ✅ Allocate assets based on department needs
2. ✅ Set appropriate min stock levels
3. ✅ Assign custodian untuk monitoring
4. ✅ Review loan reports regularly

### For Custodian:
1. ✅ Approve loan requests promptly
2. ✅ Follow up overdue loans
3. ✅ Monitor stock levels
4. ✅ Report damaged items

### For Users:
1. ✅ Request loan dengan purpose yang jelas
2. ✅ Return on time
3. ✅ Report kondisi saat return
4. ✅ Notify custodian jika ada masalah

## 📝 Summary

**Inventory** = Alokasi asset ke department untuk dikelola dan dipinjamkan
**Custodian** = PIC yang manage inventory di department (optional)
**Quantity** = Total unit dialokasi (fixed)
**Available Qty** = Unit yang bisa dipinjam (dynamic)
**Loan** = Peminjaman asset dari inventory department
**Min Stock** = Alert threshold untuk low stock

Dengan konsep ini, setiap department bisa manage asset mereka sendiri dan users bisa meminjam sesuai kebutuhan dengan approval workflow yang jelas.
