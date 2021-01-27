import { sum, rollups } from 'd3-array'
import * as DT from '@/constants/data-types.js'

function reducer(a, domains) {
  let obj = {},
    temperatureId = null,
    temperatureCount = 0

  a.forEach(point => {
    domains.forEach(domain => {
      const id = domain.id
      const type = domain.type
      let isNew = false
      if (!obj[id]) {
        obj[id] = null
        isNew = true
      }
      const isTemperature = DT.isTemperature(type)
      if (isTemperature) {
        if (type === DT.TEMPERATURE_MEAN && point[id]) {
          obj[id] += point[id]
          temperatureCount += 1
          temperatureId = id
        }
        if (type === DT.TEMPERATURE_MIN && point[id]) {
          if (isNew) {
            obj[id] = point[id]
          }
          if (obj[id] > point[id]) {
            obj[id] = point[id]
          }
        }
        if (type === DT.TEMPERATURE_MAX && point[id]) {
          if (isNew) {
            obj[id] = point[id]
          }
          if (obj[id] < point[id]) {
            obj[id] = point[id]
          }
        }
      }
    })
  })

  domains.forEach(domain => {
    let allNulls = true
    const id = domain.id
    const type = domain.type
    const isPowerOrEnergy = DT.isPowerOrEnergy(type)
    const isMarketValueType = DT.isMarketValue(type)
    const isEmissionsType = DT.isEmissions(type)

    if (isPowerOrEnergy || isMarketValueType || isEmissionsType) {
      const total = sum(a, d => {
        let value = d[id]
        // invert imports market value
        if (isMarketValueType && domain.fuelTech === 'imports') {
          value = -d[id]
        }

        if (value || value === 0) {
          allNulls = false
        }
        return value
      })

      obj[id] = allNulls ? null : total
    }
  })
  if (temperatureId) {
    obj[temperatureId] = obj[temperatureId] / temperatureCount
  }

  return obj
}

export default function(
  domains,
  data,
  isIncompleteStart,
  isIncompleteEnd,
  incompleteStartDate,
  incompleteEndDate
) {
  const entries = rollups(data, v => reducer(v, domains), d => d._rollUpDate)
  return entries.map((e, i) => {
    const object = {
      time: e[0],
      date: new Date(e[0]),
      _isIncompleteBucket: false
    }

    Object.keys(e[1]).forEach(k => {
      object[k] = e[1][k]
    })

    if (i === 0 && isIncompleteStart) {
      object._isIncompleteBucket = isIncompleteStart
      object._incompleteDate = incompleteStartDate
    }
    if (i === entries.length - 1 && isIncompleteEnd) {
      object._isIncompleteBucket = isIncompleteEnd
      object._incompleteDate = incompleteEndDate
    }
    return object
  })
}
