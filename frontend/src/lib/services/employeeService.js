import { api } from '../api';

const EMPLOYEES_URL = '/employees';

export const employeeService = {
  // Get all employees with filters and pagination
  getAllEmployees: async (params = {}) => {
    const response = await api.get(EMPLOYEES_URL, { params });
    return response.data;
  },

  // Get employee by ID
  getEmployeeById: async (id) => {
    const response = await api.get(`${EMPLOYEES_URL}/${id}`);
    return response.data;
  },

  // Create new employee
  createEmployee: async (employeeData) => {
    const response = await api.post(EMPLOYEES_URL, employeeData);
    return response.data;
  },

  // Update employee
  updateEmployee: async (id, employeeData) => {
    const response = await api.put(`${EMPLOYEES_URL}/${id}`, employeeData);
    return response.data;
  },

  // Delete employee
  deleteEmployee: async (id) => {
    const response = await api.delete(`${EMPLOYEES_URL}/${id}`);
    return response.data;
  },

  // Get employee statistics
  getEmployeeStats: async () => {
    const response = await api.get(`${EMPLOYEES_URL}/stats`);
    return response.data;
  },
};
