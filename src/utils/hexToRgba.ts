export const hexToRgba = (hex: string, alpha: number = 1): string => {
  // Remove # if present and trim whitespace
  hex = hex.replace('#', '').trim()

  // Validate hex code length
  if (hex.length !== 3 && hex.length !== 6) {
    throw new Error('Invalid HEX color code. Use 3 or 6 characters (e.g., #FFF or #FFFFFF)')
  }

  // Convert 3-digit hex to 6-digit
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((char) => char + char)
      .join('')
  }

  // Validate hex characters
  if (!/^[0-9A-Fa-f]{6}$/.test(hex)) {
    throw new Error('Invalid HEX color code. Use valid hexadecimal characters')
  }

  // Parse RGB values
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)

  // Validate alpha
  if (alpha < 0 || alpha > 1) {
    throw new Error('Alpha value must be between 0 and 1')
  }

  // Return RGBA string
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
