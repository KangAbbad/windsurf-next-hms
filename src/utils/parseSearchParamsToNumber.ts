export const parseSearchParamsToNumber = (value: string | null, defaultValue?: number): number | undefined => {
  if (!value && defaultValue !== undefined) return defaultValue
  if (!value) return undefined

  const parsed = parseInt(value, 10)
  if (isNaN(parsed)) return undefined

  return parsed
}
