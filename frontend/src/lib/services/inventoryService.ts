// Frontend service for inventory management
import { api } from '@/lib/api';

export interface InventoryItem {
  id: string;
  inventoryTag: string;
  assetId: string;
  departmentId: string;
  custodianId?: string;
  quantity: number;
  availableQty: number;
  condition: 'GOOD' | 'FAIR' | 'POOR' | 'DAMAGED';
  status: 'AVAILABLE' | 'LOANED' | 'MAINTENANCE' | 'RETIRED';
  location?: string;
  notes?: string;
  minStockLevel: number;
  createdAt: string;
  updatedAt: string;
  asset: {
    id: string;
    name: string;
    assetTag: string;
    description?: string;
    category: {
      name: string;
    };
  };
  department: {
    id: string;
    name: string;
    code: string;
  };
  custodian?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface InventoryLoan {
  id: string;
  loanNumber: string;
  inventoryId: string;
  borrowerId: string;
  responsibleId: string;
  purpose: string;
  quantity: number;
  expectedReturnDate: string;
  actualReturnDate?: string;
  status: 'ACTIVE' | 'RETURNED' | 'OVERDUE';
  condition?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  inventory: {
    inventoryTag: string;
    asset: {
      name: string;
      assetTag: string;
    };
  };
  borrower: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  responsible: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface CreateInventoryData {
  assetId: string;
  departmentId: string;
  custodianId?: string;
  quantity: number;
  condition?: 'GOOD' | 'FAIR' | 'POOR' | 'DAMAGED';
  location?: string;
  notes?: string;
  minStockLevel?: number;
}

export interface UpdateInventoryData {
  custodianId?: string;
  quantity?: number;
  availableQty?: number;
  condition?: 'GOOD' | 'FAIR' | 'POOR' | 'DAMAGED';
  status?: 'AVAILABLE' | 'LOANED' | 'MAINTENANCE' | 'RETIRED';
  location?: string;
  notes?: string;
  minStockLevel?: number;
}

export interface CreateLoanData {
  inventoryId: string;
  borrowerId: string;
  responsibleId: string;
  purpose: string;
  quantity?: number;
  expectedReturnDate: string;
  notes?: string;
}

export interface ReturnLoanData {
  condition?: string;
  notes?: string;
}

export interface InventoryResponse {
  inventories: InventoryItem[];
  pagination: {
    total: number;
    pages: number;
    current: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface LoanResponse {
  loans: InventoryLoan[];
  pagination: {
    total: number;
    pages: number;
    current: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface InventoryStats {
  totalInventory: number;
  availableInventory: number;
  loanedInventory: number;
  activeLoans: number;
}

class InventoryService {
  private basePath = '/inventory';

  async getInventories(params?: {
    page?: number;
    limit?: number;
    search?: string;
    departmentId?: string;
    status?: string;
    condition?: string;
  }): Promise<InventoryResponse> {
    const response = await api.get(this.basePath, { params });
    return response.data.data as InventoryResponse;
  }

  async createInventory(inventoryData: CreateInventoryData): Promise<InventoryItem> {
    const response = await api.post(this.basePath, inventoryData);
    return response.data.data as InventoryItem;
  }

  async updateInventory(id: string, inventoryData: UpdateInventoryData): Promise<InventoryItem> {
    const response = await api.put(`${this.basePath}/${id}`, inventoryData);
    return response.data.data as InventoryItem;
  }

  async deleteInventory(id: string): Promise<void> {
    await api.delete(`${this.basePath}/${id}`);
  }

  // Loan management
  async getLoans(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    borrowerId?: string;
  }): Promise<LoanResponse> {
    const response = await api.get(`${this.basePath}/loans`, { params });
    return response.data.data as LoanResponse;
  }

  async createLoan(loanData: CreateLoanData): Promise<InventoryLoan> {
    const response = await api.post(`${this.basePath}/loans`, loanData);
    return response.data.data as InventoryLoan;
  }

  async returnLoan(id: string, returnData: ReturnLoanData): Promise<InventoryLoan> {
    const response = await api.post(`${this.basePath}/loans/${id}/return`, returnData);
    return response.data.data as InventoryLoan;
  }

  async approveLoan(id: string, approvalData?: { approvalNotes?: string }): Promise<InventoryLoan> {
    const response = await api.post(`${this.basePath}/loans/${id}/approve`, approvalData || {});
    return response.data.data as InventoryLoan;
  }

  async getStats(): Promise<InventoryStats> {
    const response = await api.get(`${this.basePath}/stats`);
    return response.data.data as InventoryStats;
  }

  // Generate loan label for printing
  generateLoanLabel(loan: InventoryLoan): string {
    const formatDate = (date: string) => {
      return new Date(date).toLocaleDateString('id-ID');
    };

    return `
      LOAN LABEL
      ================================
      Loan Number: ${loan.loanNumber}
      Asset: ${loan.inventory.asset.name}
      Asset Tag: ${loan.inventory.asset.assetTag}
      Inventory Tag: ${loan.inventory.inventoryTag}
      
      Borrower: ${loan.borrower.firstName} ${loan.borrower.lastName}
      Email: ${loan.borrower.email}
      
      Responsible: ${loan.responsible.firstName} ${loan.responsible.lastName}
      
      Purpose: ${loan.purpose}
      Quantity: ${loan.quantity}
      Expected Return: ${formatDate(loan.expectedReturnDate)}
      
      Loan Date: ${formatDate(loan.createdAt)}
      Status: ${loan.status}
      ================================
    `;
  }

  // Print loan label
  printLoanLabel(loan: InventoryLoan): void {
    const labelContent = this.generateLoanLabel(loan);
    const printWindow = window.open('', '_blank');
    
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Loan Label - ${loan.loanNumber}</title>
            <style>
              body {
                font-family: 'Courier New', monospace;
                font-size: 12px;
                line-height: 1.4;
                margin: 20px;
                white-space: pre-line;
              }
              @media print {
                body { margin: 0; }
              }
            </style>
          </head>
          <body>
            ${labelContent}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  }
}

export const inventoryService = new InventoryService();