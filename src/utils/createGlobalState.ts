import { QueryKey, useQuery, useQueryClient } from '@tanstack/react-query'

type Props<T> = { queryKey: QueryKey; initialData: T | null }

export const createGlobalState = <T>(props: Props<T>) => {
  return () => {
    const { queryKey, initialData = null } = props
    const queryClient = useQueryClient()

    const { data } = useQuery({
      queryKey,
      queryFn: () => Promise.resolve(initialData),
      initialData,
      refetchInterval: false,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchIntervalInBackground: false,
    })

    const setData = (data: Partial<T>) => {
      queryClient.setQueryData(queryKey, data)
    }

    const resetData = () => {
      queryClient.invalidateQueries({ queryKey })
      queryClient.refetchQueries({ queryKey })
    }

    return { data, setData, resetData }
  }
}
