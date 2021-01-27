import { mean, rollups } from 'd3-array'
import * as DT from '@/constants/data-types.js'

function reducer(a, domains) {
  let obj = {}
  let priceId = null

  domains.forEach(domain => {
    const id = domain.id
    const type = domain.type
    const isPowerOrEnergy = DT.isPowerOrEnergy(type)
    const isTemperature = DT.isTemperature(type)
    const isPrice = DT.isPrice(type)
    const isOriginalPrice =
      isPrice &&
      id !== DT.PRICE_ABOVE_300 &&
      id !== DT.PRICE_BELOW_0 &&
      id !== '_volWeightedPriceAbove300' &&
      id !== '_volWeightedPriceBelow0'

    if (isPowerOrEnergy || isPrice) {
      obj[id] = mean(a, d => d[id] || 0)

      if (type === DT.PRICE) {
        // use the first 30min data for period
        obj[id] = a[0][id]
      }

      if (isOriginalPrice) {
        priceId = id
      }
    } else if (isTemperature) {
      obj[id] = mean(a, d => d[id])
    }
  })

  if (priceId) {
    const newPrice = obj[priceId]

    obj[DT.PRICE_ABOVE_300] = newPrice > 300 ? newPrice : 0.001
    obj[DT.PRICE_BELOW_0] = newPrice < 0 ? newPrice : -0.001
  }

  return obj
}

export default function(domains, data) {
  const entries = rollups(data, v => reducer(v, domains), d => d._rollUpDate)

  return entries.map(e => {
    const object = {
      time: e[0],
      date: new Date(e[0])
    }

    Object.keys(e[1]).forEach(k => {
      object[k] = e[1][k]
    })
    return object
  })
}
