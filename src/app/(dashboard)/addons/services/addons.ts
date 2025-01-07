import axios from 'axios'

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export interface Addon {
  id: string
  addon_name: string
  price: number
  created_at: string
  updated_at: string
}

export interface PageParams {
  page?: number
  limit?: number
  search?: string
}

export interface PaginatedResponse<T> {
  data: {
    addons: T[]
    pagination: {
      total: number
      page: number
      limit: number
      total_pages: number
    }
  }
}

export const addonsService = {
  async getAll({ page = 1, limit = 10, search = '' }: PageParams = {}) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
    })

    const { data } = await axiosInstance.get<PaginatedResponse<Addon>>(`/api/addons?${params}`)
    return data.data
  },

  async create(addon: Omit<Addon, 'id' | 'created_at' | 'updated_at'>) {
    const { data } = await axiosInstance.post<Addon>('/api/addons', addon)
    return data
  },

  async update(id: string, addon: Partial<Addon>) {
    const { data } = await axiosInstance.put<Addon>(`/api/addons/${id}`, addon)
    return data
  },

  async delete(id: string) {
    await axiosInstance.delete(`/api/addons/${id}`)
  },
}
