# 🔧 Refactoring Checklist - Management Assets System

**Prinsip**: Fix CRUD & Business Logic tanpa mengubah flow yang sudah ada

## ✅ Status Modules

### 1. MASTER DATA MODULES

#### 1.1 Assets ✅ GOOD
- [x] Backend: Pagination working
- [x] Frontend: Pagination implemented
- [x] CRUD: Complete
- [ ] **TODO**: Multi-software installation feature
- [ ] **TODO**: File upload untuk attachments
- [ ] **TODO**: Auto-update software inventory on install

#### 1.2 Categories ⚠️ NEEDS FIX
- [x] Backend: Pagination working
- [ ] **TODO**: Frontend pagination not implemented
- [x] CRUD: Complete
- [ ] **TODO**: Parent-child hierarchy filtering di frontend
- [ ] **TODO**: Display category tree view

#### 1.3 Departments ⚠️ NEEDS FIX
- [x] Backend: Pagination working
- [ ] **TODO**: Frontend pagination not implemented
- [x] CRUD: Complete
- [ ] **TODO**: Remove budgetLimit field (if requested)

#### 1.4 Locations ⚠️ NEEDS FIX
- [x] Backend: Pagination working
- [ ] **TODO**: Frontend pagination not implemented
- [x] CRUD: Complete

#### 1.5 Vendors ⚠️ NEEDS CHECK
- [ ] **TODO**: Verify backend pagination
- [ ] **TODO**: Verify frontend pagination
- [ ] **TODO**: Verify CRUD complete

#### 1.6 Users ⚠️ NEEDS CHECK
- [ ] **TODO**: Verify backend pagination
- [ ] **TODO**: Verify frontend pagination
- [ ] **TODO**: Verify CRUD complete
- [ ] **TODO**: Optional employee.userId relation

#### 1.7 Software Assets ⚠️ NEEDS FIX
- [ ] **TODO**: Verify pagination
- [x] CRUD: Complete
- [ ] **TODO**: Fix stock update on installation
- [ ] **TODO**: Prevent install if stock = 0
- [ ] **TODO**: Auto-disable when no license available

---

### 2. OPERATIONAL MODULES

#### 2.1 Inventory 🔴 CRITICAL
- [ ] **TODO**: Add company/department selector before display
- [ ] **TODO**: Add "Generate" button to fetch data
- [ ] **TODO**: Remove "View Mode" - only Edit & Delete
- [ ] **TODO**: Backend pagination
- [ ] **TODO**: Frontend pagination
- [ ] **TODO**: Link to asset_id, employee_id, department_id, company_id

#### 2.2 Requests ⚠️ NEEDS FIX
- [ ] **TODO**: Verify pagination
- [ ] **TODO**: Fix approval workflow
- [ ] **TODO**: Create notifications on status change
- [ ] **TODO**: Verify transaction rollback on error

#### 2.3 Maintenance ⚠️ NEEDS FIX
- [ ] **TODO**: Verify pagination
- [ ] **TODO**: Integration dengan spare parts usage
- [ ] **TODO**: Auto-create from requests
- [ ] **TODO**: Notification when scheduled

#### 2.4 Audit ⚠️ NEEDS FIX
- [x] CRUD: Complete
- [ ] **TODO**: Verify pagination
- [ ] **TODO**: Asset verification workflow

---

### 3. ADVANCED FEATURES

#### 3.1 Transfer 🔴 CRITICAL
- [x] CRUD: Basic structure exists
- [ ] **TODO**: Implement price deduction logic
- [ ] **TODO**: Use Prisma transaction for atomic update
- [ ] **TODO**: Update both asset AND inventory tables
- [ ] **TODO**: Approval workflow
- [ ] **TODO**: Verify pagination

#### 3.2 Decomposition 🔴 CRITICAL
- [x] Basic structure exists
- [ ] **TODO**: Change asset status to INACTIVE/DECOMPOSED
- [ ] **TODO**: Create spare parts from decomposition
- [ ] **TODO**: Update spare part inventory stock
- [ ] **TODO**: Use Prisma transaction
- [ ] **TODO**: Verify pagination

#### 3.3 Depreciation ⚠️ NEEDS CHECK
- [x] CRUD: Complete
- [ ] **TODO**: Verify calculations
- [ ] **TODO**: Verify pagination

---

### 4. FRONTEND IMPROVEMENTS

#### 4.1 Pagination (All Tables)
- [x] Assets: Done ✅
- [ ] Categories: TODO
- [ ] Departments: TODO
- [ ] Locations: TODO
- [ ] Vendors: TODO
- [ ] Users: TODO
- [ ] Inventory: TODO
- [ ] Requests: TODO
- [ ] Maintenance: TODO
- [ ] Audit: TODO
- [ ] Software: TODO
- [ ] Transfer: TODO
- [ ] Decomposition: TODO

#### 4.2 UI/UX Fixes
- [ ] **TODO**: Fix modal layouts
- [ ] **TODO**: Improve form contrast & readability
- [ ] **TODO**: Fix table responsiveness
- [ ] **TODO**: Consistent error messages
- [ ] **TODO**: Loading states for all actions

---

### 5. BACKEND VALIDATIONS

#### 5.1 Add Missing Validations
- [ ] **TODO**: Audit all Joi schemas
- [ ] **TODO**: Add try-catch to all endpoints
- [ ] **TODO**: Consistent error response format
- [ ] **TODO**: Add input sanitization

#### 5.2 Database Transactions
- [ ] **TODO**: Transfer operations
- [ ] **TODO**: Decomposition operations
- [ ] **TODO**: Software installation/uninstallation
- [ ] **TODO**: Request approval cascade
- [ ] **TODO**: Maintenance with spare parts

---

## 🎯 PRIORITY ORDER

### Phase 1: Critical Fixes (Week 1)
1. Fix Inventory module dengan selector
2. Implement Transfer price deduction
3. Fix Decomposition spare parts creation
4. Add pagination to Categories, Departments, Locations

### Phase 2: Business Logic (Week 2)
5. Fix Software installation stock update
6. Fix Request approval workflow
7. Fix Maintenance integration
8. Add all missing validations

### Phase 3: UI/UX (Week 3)
9. Fix all forms & modals
10. Add pagination to remaining tables
11. Improve loading states
12. Fix responsive design

### Phase 4: Testing & Polish (Week 4)
13. End-to-end testing all modules
14. Fix bugs found during testing
15. Performance optimization
16. Documentation

---

## 📝 Notes
- **JANGAN UBAH FLOW YANG SUDAH ADA**
- Hanya fix bugs dan lengkapi fitur
- Semua data dari database, no hardcode
- Gunakan Prisma transactions untuk complex operations
- Backend sudah baik, fokus pada frontend pagination

---

**Last Updated**: 2025-11-05
**Status**: Phase 1 - In Progress
