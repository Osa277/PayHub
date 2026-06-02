import useSWR, { SWRConfiguration } from 'swr'

const fetcher = async (url: string) => {
  const res = await fetch(url)
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Request failed')
  return data.data
}

export function useApi<T>(key: string | null, options?: SWRConfiguration) {
  return useSWR<T>(key, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 10000,
    keepPreviousData: true,
    ...options,
  })
}
