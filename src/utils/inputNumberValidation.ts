import { ChangeEvent } from 'react'

/**
 * Format an input into number format
 * @param e - The input event
 * @returns Formatted number (e.g., "1234567890.1234567890")
 */
export const inputNumberValidation = (e: ChangeEvent<HTMLInputElement>) => {
  // Sanitize input
  const sanitized = e.target.value
    .replace(/[^0-9.]/g, '') // Remove non-numeric characters
    .replace(/(\..*)\./g, '$1') // Remove multiple decimals
  return sanitized
}
