import { create } from 'zustand'
import { categoryService } from '@/lib/services/categoryService'

interface Category {
  id: number
  name: string
  code: string
  description?: string
  parentId?: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  children?: Category[]
  parent?: Category
}

interface CategoryState {
  categories: Category[]
  loading: boolean
  error: string | null
  searchTerm: string
  showModal: boolean
  editingCategory: Category | null
  formData: {
    name: string
    code: string
    description: string
    parentId: string
    isActive: boolean
  }
}

interface CategoryActions {
  fetchCategories: () => Promise<void>
  createCategory: (data: Partial<Category>) => Promise<void>
  updateCategory: (id: number, data: Partial<Category>) => Promise<void>
  deleteCategory: (id: number) => Promise<void>
  setSearchTerm: (term: string) => void
  setShowModal: (show: boolean) => void
  setEditingCategory: (category: Category | null) => void
  setFormData: (data: Partial<CategoryState['formData']>) => void
  resetForm: () => void
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  getFilteredCategories: () => Category[]
  getCategoryStats: () => Array<{
    title: string
    value: number
    icon: string
    color: string
    textColor: string
    bgColor: string
  }>
}

const initialFormData = {
  name: '',
  code: '',
  description: '',
  parentId: '',
  isActive: true
}

export const useCategoryStore = create<CategoryState & CategoryActions>((set, get) => ({
  categories: [],
  loading: false,
  error: null,
  searchTerm: '',
  showModal: false,
  editingCategory: null,
  formData: initialFormData,

  fetchCategories: async () => {
    set({ loading: true, error: null })
    try {
      const response = await categoryService.getAllCategories()
      // Handle the nested response structure
      const categories = response.data?.categories || response.categories || response.data || []
      set({ categories: Array.isArray(categories) ? categories : [], loading: false })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch categories', loading: false })
    }
  },

  createCategory: async (data) => {
    try {
      const categoryData = {
        ...data,
        parentId: data.parentId ? parseInt(data.parentId.toString()) : null
      }
      await categoryService.createCategory(categoryData)
      get().fetchCategories()
      get().resetForm()
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to create category')
    }
  },

  updateCategory: async (id, data) => {
    try {
      const categoryData = {
        ...data,
        parentId: data.parentId ? parseInt(data.parentId.toString()) : null
      }
      await categoryService.updateCategory(id, categoryData)
      get().fetchCategories()
      get().resetForm()
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update category')
    }
  },

  deleteCategory: async (id) => {
    try {
      await categoryService.deleteCategory(id)
      get().fetchCategories()
    } catch {
      throw new Error('Failed to delete category')
    }
  },

  setSearchTerm: (term) => set({ searchTerm: term }),
  setShowModal: (show) => set({ showModal: show }),
  
  setEditingCategory: (category) => {
    set({ editingCategory: category })
    if (category) {
      set({
        formData: {
          name: category.name || '',
          code: category.code || '',
          description: category.description || '',
          parentId: category.parentId?.toString() || '',
          isActive: category.isActive !== false
        },
        showModal: true
      })
    }
  },

  setFormData: (data) => set(state => ({ 
    formData: { ...state.formData, ...data } 
  })),

  resetForm: () => set({
    formData: initialFormData,
    editingCategory: null,
    showModal: false
  }),

  handleInputChange: (e) => {
    const target = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    const { name, value, type } = target
    const checked = (target as HTMLInputElement).checked
    
    set(state => ({
      formData: {
        ...state.formData,
        [name]: type === 'checkbox' ? checked : value
      }
    }))
  },

  getFilteredCategories: () => {
    const { categories, searchTerm } = get()
    return categories.filter(category =>
      category.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  },

  getCategoryStats: () => {
    const { categories } = get()
    return [
      {
        title: 'Total Categories',
        value: categories.length,
        icon: 'Tag',
        color: 'bg-blue-500',
        textColor: 'text-blue-600',
        bgColor: 'bg-blue-50'
      },
      {
        title: 'Active Categories',
        value: categories.filter(c => c.isActive !== false).length,
        icon: 'CheckCircle',
        color: 'bg-green-500',
        textColor: 'text-green-600',
        bgColor: 'bg-green-50'
      },
      {
        title: 'Main Categories',
        value: categories.filter(c => !c.parentId).length,
        icon: 'FolderOpen',
        color: 'bg-purple-500',
        textColor: 'text-purple-600',
        bgColor: 'bg-purple-50'
      },
      {
        title: 'Sub Categories',
        value: categories.filter(c => c.parentId).length,
        icon: 'Folder',
        color: 'bg-orange-500',
        textColor: 'text-orange-600',
        bgColor: 'bg-orange-50'
      }
    ]
  }
}))
