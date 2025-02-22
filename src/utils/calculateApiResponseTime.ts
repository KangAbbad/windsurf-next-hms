/**
 * Calculates the response time in milliseconds.
 * @param {[number, number]} startTime - The start time from process.hrtime().
 * @returns {number} - The response time in milliseconds, rounded to the nearest integer.
 */
export function calculateApiResponseTime(startTime: [number, number]): string {
  const endTime = process.hrtime(startTime)
  const responseTime = Math.round((endTime[0] * 1e9 + endTime[1]) / 1e6)
  return `${responseTime}ms`
}
