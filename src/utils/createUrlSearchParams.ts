type NestedParams = {
  [key: string]: string | number
}

export type Params = {
  [key: string]: string | number | NestedParams
}

export const createUrlSearchParams = (obj: Params, prefix: string = ''): string => {
  const parts: string[] = []

  Object.entries(obj).forEach(([key, value]) => {
    const paramKey = prefix ? `${prefix}[${key}]` : key

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Recurse for nested objects
      const nestedParts = createUrlSearchParams(value, paramKey)
      parts.push(nestedParts)
    } else {
      // Encode key and value once
      const encodedKey = encodeURIComponent(paramKey)
      const encodedValue = encodeURIComponent(String(value))
      parts.push(`${encodedKey}=${encodedValue}`)
    }
  })

  return parts.join('&')
}
