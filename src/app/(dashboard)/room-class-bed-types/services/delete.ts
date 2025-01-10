import { axiosInstance } from '@/services/axiosInstance'

export type DeleteItemParams = {
  roomClassId: string
  bedTypeId: string
}

export const deleteItem = async ({ roomClassId, bedTypeId }: DeleteItemParams) => {
  const { data } = await axiosInstance.delete(`/room-class-bed-types/${roomClassId}/${bedTypeId}`)
  return data
}
