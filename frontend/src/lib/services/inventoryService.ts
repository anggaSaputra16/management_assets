// Frontend service for inventory management
import { API_BASE_URL } from '../api';

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
  private baseURL = `${API_BASE_URL}/inventory`;

  private async getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async getInventories(params?: {
    page?: number;
    limit?: number;
    search?: string;
    departmentId?: string;
    status?: string;
    condition?: string;
  }): Promise<InventoryResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.departmentId) queryParams.append('departmentId', params.departmentId);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.condition) queryParams.append('condition', params.condition);

    const response = await fetch(`${this.baseURL}?${queryParams}`, {
      headers: await this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  }

  async createInventory(inventoryData: CreateInventoryData): Promise<InventoryItem> {
    const response = await fetch(this.baseURL, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(inventoryData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  }

  async updateInventory(id: string, inventoryData: UpdateInventoryData): Promise<InventoryItem> {
    const response = await fetch(`${this.baseURL}/${id}`, {
      method: 'PUT',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(inventoryData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  }

  async deleteInventory(id: string): Promise<void> {
    const response = await fetch(`${this.baseURL}/${id}`, {
      method: 'DELETE',
      headers: await this.getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }
  }

  // Loan management
  async getLoans(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    borrowerId?: string;
  }): Promise<LoanResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.borrowerId) queryParams.append('borrowerId', params.borrowerId);

    const response = await fetch(`${this.baseURL}/loans?${queryParams}`, {
      headers: await this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  }

  async createLoan(loanData: CreateLoanData): Promise<InventoryLoan> {
    const response = await fetch(`${this.baseURL}/loans`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(loanData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  }

  async returnLoan(id: string, returnData: ReturnLoanData): Promise<InventoryLoan> {
    const response = await fetch(`${this.baseURL}/loans/${id}/return`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(returnData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  }

  async getStats(): Promise<InventoryStats> {
    const response = await fetch(`${this.baseURL}/stats`, {
      headers: await this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
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