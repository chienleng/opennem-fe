import _includes from 'lodash.includes'

/**
 * Parse interval:
 * - years = y
 * - quarters = Q
 * - months = M
 * - weeks = w
 * - days = d
 * - hours = h
 * - minutes = m
 * - seconds = s
 */
const durationKeys = ['s', 'm', 'h', 'd', 'w', 'M', 'Q', 'y']

/**
 * returns {key, value}
 * if string contains only key, value is 1
 */
function parse(string) {
  const length = string.length
  const key = string.charAt(length - 1)
  const value = length === 1 ? 1 : parseInt(string.substring(0, length - 1), 10)

  if (!_includes(durationKeys, key)) {
    throw new Error(`Invalid duration key: ${key}`)
  }

  return {
    key,
    value
  }
}

export default parse
