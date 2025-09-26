# 🗂️ Database Schema Architecture - Visual Representation

## 🏗️ Entity Relationship Diagram (ERD) Overview

### Core Schema Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│                      MULTI-COMPANY ARCHITECTURE                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────┐
│   COMPANY   │ ──────────────┐
│  (Tenant)   │               │
└─────────────┘               │
                              ▼
         ┌──────────────────────────────────────────────────┐
         │                ORGANIZATION                      │
         └──────────────────────────────────────────────────┘
                              │
    ┌──────────────┬──────────────┬──────────────────────┐
    ▼              ▼              ▼                      ▼
┌─────────┐   ┌─────────┐   ┌──────────┐          ┌──────────┐
│LOCATION │   │POSITION │   │DEPARTMENT│          │   USER   │
│         │   │         │   │          │    ┌─────│ Employee │
└─────────┘   └─────────┘   └──────────┘    │     └──────────┘
                                            │           │
                                            │  Manager  │
                                            └──────┬────┘
                                                   │ Self-ref
                                                   └─────┐
                                                        ▼
                                              ┌──────────────┐
                                              │ SUBORDINATES │
                                              └──────────────┘
```

### Asset Management Core

```
┌────────────────────────────────────────────────────────────────────────┐
│                           ASSET ECOSYSTEM                              │
└────────────────────────────────────────────────────────────────────────┘

     ┌──────────┐       ┌──────────┐       ┌──────────┐
     │  VENDOR  │──────▶│  ASSET   │◀──────│ CATEGORY │
     │          │       │   Core   │       │(Hierarchy│
     └──────────┘       └──────────┘       └──────────┘
           │                  │                   │
           │            ┌─────┼─────┐             │
           │            ▼     ▼     ▼             │
           │    ┌──────────┐ │ ┌─────────────┐    │
           │    │DEPARTMENT│ │ │  LOCATION   │    │
           │    │ Assigned │ │ │   Physical  │    │
           │    └──────────┘ │ └─────────────┘    │
           │                 │                    │
           ▼                 ▼                    ▼
    ┌─────────────┐   ┌─────────────┐    ┌─────────────┐
    │ SPARE_PART  │   │    USER     │    │   QR_CODE   │
    │   Vendor    │   │  Assigned   │    │  Tracking   │
    │  Supplied   │   │   To User   │    │   System    │
    └─────────────┘   └─────────────┘    └─────────────┘
```

### Request Management Workflow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       REQUEST WORKFLOW SYSTEM                           │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────┐                    ┌──────────────────┐
│    USER     │───────────────────▶│  ASSET_REQUEST   │
│  Requester  │                    │   [7 Types]      │
└─────────────┘                    └──────────────────┘
                                           │
                     ┌─────────────────────┼─────────────────────┐
                     ▼                     ▼                     ▼
          ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
          │REQUEST_WORKFLOW │   │REQUEST_ATTACHMENT│   │  NOTIFICATION   │
          │   Approval      │   │   Supporting    │   │     System      │
          │   Process       │   │   Documents     │   │                 │
          └─────────────────┘   └─────────────────┘   └─────────────────┘
                   │
    ┌──────────────┼──────────────┐
    ▼              ▼              ▼
┌─────────┐   ┌─────────┐   ┌─────────────┐
│SUBMITTED│   │APPROVED │   │ MAINTENANCE │
│  State  │   │  State  │   │   RECORD    │
└─────────┘   └─────────┘   └─────────────┘
```

### Maintenance Management System

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      MAINTENANCE ECOSYSTEM                              │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐                    ┌─────────────────┐
│ ASSET_REQUEST   │───────────────────▶│MAINTENANCE_RECORD│
│  [Triggers]     │                    │   [6 Types]     │
└─────────────────┘                    └─────────────────┘
                                              │
                   ┌──────────────────────────┼──────────────────────────┐
                   ▼                          ▼                          ▼
      ┌─────────────────┐        ┌─────────────────┐        ┌─────────────────┐
      │   TECHNICIAN    │        │   SUPERVISOR    │        │   PART_USAGE    │
      │   Assignment    │        │   Oversight     │        │   Tracking      │
      └─────────────────┘        └─────────────────┘        └─────────────────┘
                                                                     │
                              ┌────────────────────────────────────────┘
                              ▼
                   ┌─────────────────┐        ┌─────────────────┐
                   │   SPARE_PART    │        │MAINTENANCE_ATTACH│
                   │   Inventory     │        │   Documentation │
                   └─────────────────┘        └─────────────────┘
```

### Asset Decomposition & Component Management

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ASSET DECOMPOSITION SYSTEM                           │
└─────────────────────────────────────────────────────────────────────────┘

      ┌─────────────────┐                    ┌─────────────────┐
      │     ASSET       │────────────────────│ ASSET_REQUEST   │
      │   [Parent]      │                    │ [BREAKDOWN]     │
      └─────────────────┘                    └─────────────────┘
             │                                        │
             ▼                                        ▼ (Approved)
      ┌─────────────────┐                    ┌─────────────────┐
      │ASSET_COMPONENT  │◀───────────────────│  BREAKDOWN      │
      │   [Children]    │                    │   PROCESS       │
      └─────────────────┘                    └─────────────────┘
             │
  ┌──────────┼──────────┬─────────────┐
  ▼          ▼          ▼             ▼
┌────────┐ ┌─────────┐ ┌──────────┐ ┌─────────────┐
│ QR_CODE│ │COMPONENT│ │COMPONENT │ │DEPARTMENT   │
│Tracking│ │TRANSFER │ │MAINTENANCE│ │ASSIGNMENT   │
└────────┘ └─────────┘ └──────────┘ └─────────────┘
```

### Software Asset Management

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     SOFTWARE ASSET MANAGEMENT                           │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐                    ┌─────────────────┐
│ SOFTWARE_ASSET  │────────────────────│SOFTWARE_LICENSE │
│   [Catalog]     │                    │  [6 Types]      │
└─────────────────┘                    └─────────────────┘
                                              │
                              ┌───────────────┼───────────────┐
                              ▼               ▼               ▼
                   ┌─────────────────┐ ┌─────────────────┐ ┌──────────────┐
                   │SOFTWARE_INSTALL │ │LICENSE_RENEWAL  │ │   COMPLIANCE │
                   │   Tracking      │ │   Management    │ │   Monitoring │
                   └─────────────────┘ └─────────────────┘ └──────────────┘
                           │
                    ┌──────┼──────┐
                    ▼      ▼      ▼
                ┌──────┐ ┌────┐ ┌──────────┐
                │ASSET │ │USER│ │SEAT_COUNT│
                │Install│ │Use │ │ Tracking │
                └──────┘ └────┘ └──────────┘
```

### Inventory & Transfer Management

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    INVENTORY & TRANSFER SYSTEM                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐                    ┌─────────────────┐
│   DEPARTMENT    │────────────────────│   INVENTORY     │
│   [Owners]      │                    │  [Holdings]     │
└─────────────────┘                    └─────────────────┘
                                              │
                                       ┌──────┼──────┐
                                       ▼      ▼      ▼
                                   ┌──────┐ ┌────────┐ ┌─────────────┐
                                   │ASSET │ │LOAN    │ │   TRANSFER  │
                                   │Items │ │Between │ │   Workflow  │
                                   └──────┘ │Depts   │ └─────────────┘
                                           └────────┘
                                              │
                                       ┌──────┼──────┐
                                       ▼      ▼      ▼
                                   ┌──────┐ ┌────────┐ ┌─────────────┐
                                   │BORROWER│ │CUSTODIAN│ │   AUDIT    │
                                   │  User  │ │  User   │ │   TRAIL    │
                                   └──────┘ └────────┘ └─────────────┘
```

### Audit & Compliance Framework

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      AUDIT & COMPLIANCE SYSTEM                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐                    ┌─────────────────┐
│  AUDIT_RECORD   │                    │  AUDIT_TRAIL    │
│ [Scheduled]     │                    │ [Activity Log]  │
└─────────────────┘                    └─────────────────┘
        │                                      │
   ┌────┼────┐                         ┌───────┼───────┐
   ▼    ▼    ▼                         ▼       ▼       ▼
┌──────┐ ┌──────┐ ┌──────────┐   ┌─────────┐ ┌─────┐ ┌──────────┐
│PHYSICAL │FINANCIAL│COMPLIANCE│   │ ASSET   │ │USER │ │COMPANY   │
│ Audit  │  Audit  │  Audit   │   │Activity │ │Act. │ │Activity  │
└──────┘ └──────┘ └──────────┘   └─────────┘ └─────┘ └──────────┘
```

### Notification & Alert System

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      NOTIFICATION ECOSYSTEM                             │
└─────────────────────────────────────────────────────────────────────────┘

                        ┌─────────────────┐
                        │  NOTIFICATION   │
                        │  [11 Types]     │
                        └─────────────────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          ▼                     ▼                     ▼
   ┌─────────────┐     ┌─────────────────┐    ┌─────────────┐
   │   REQUEST   │     │   MAINTENANCE   │    │  SOFTWARE   │
   │  APPROVALS  │     │  SCHEDULE/DUE   │    │  LICENSE    │
   └─────────────┘     └─────────────────┘    └─────────────┘
          │                     │                     │
          ▼                     ▼                     ▼
   ┌─────────────┐     ┌─────────────────┐    ┌─────────────┐
   │ WORKFLOW    │     │   SPARE_PART    │    │  WARRANTY   │
   │ NOTIFICATIONS│     │  LOW_STOCK      │    │  EXPIRING   │
   └─────────────┘     └─────────────────┘    └─────────────┘
```

## 🔗 Key Relationships Summary

### Primary Relationships:
1. **Company → All Entities** (Multi-tenant isolation)
2. **User → Asset** (Assignment & Ownership)
3. **Asset → Components** (Decomposition hierarchy)
4. **Request → Workflow → Maintenance** (Process flow)
5. **Asset → Maintenance → Parts** (Service chain)
6. **Department → Inventory → Loans** (Custody chain)

### Cross-Functional Relationships:
- **Audit Trail** connects to ALL entities for compliance
- **Notifications** trigger from multiple business events
- **Vendors** provide Assets, Parts, and Services
- **Locations** track physical presence across all assets

### Data Flow Patterns:
- **Request-Driven**: User Request → Approval → Action → Audit
- **Asset-Centric**: Purchase → Registration → Assignment → Maintenance → Disposal
- **Inventory-Based**: Stock → Usage → Replenishment → Audit
- **Compliance-Oriented**: Activity → Logging → Review → Reporting

This schema provides complete coverage for enterprise asset management with proper normalization, referential integrity, and business rule enforcement through database constraints and application logic.