export const POWER = 'power'
export const ENERGY = 'energy'
export const DEMAND = 'demand'
export const EMISSIONS = 'emissions'
export const MARKET_VALUE = 'market_value'
export const PRICE = 'price'
export const PRICE_ABOVE_300 = 'price.above300'
export const PRICE_BELOW_0 = 'price.below0'
export const TEMPERATURE = 'temperature'
export const TEMPERATURE_MIN = 'temperature_min'
export const TEMPERATURE_MEAN = 'temperature_mean'
export const TEMPERATURE_MAX = 'temperature_max'
export const CPI = 'cpi'

export function isTemperature(name) {
  return (
    name === TEMPERATURE ||
    name === TEMPERATURE_MIN ||
    name === TEMPERATURE_MEAN ||
    name === TEMPERATURE_MAX
  )
}

export function isPowerOrEnergy(name) {
  return name === POWER || name === ENERGY
}

export function isPrice(name) {
  return name === PRICE
}

export function isMarketValue(name) {
  return name === MARKET_VALUE
}

export function isEmissions(name) {
  return name === EMISSIONS
}

export function isValidDataType(name) {
  return (
    name === POWER ||
    name === ENERGY ||
    name === DEMAND ||
    name === EMISSIONS ||
    name === MARKET_VALUE ||
    name === PRICE ||
    name === TEMPERATURE ||
    name === TEMPERATURE_MIN ||
    name === TEMPERATURE_MEAN ||
    name === TEMPERATURE_MAX
  )
}
