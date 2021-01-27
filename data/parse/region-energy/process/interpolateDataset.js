import * as FT from '@/constants/energy-fuel-techs/group-default.js'
import * as DT from '@/constants/data-types.js'

function findInterpolateSeriesTypes(data) {
  const rooftopSolarItem = data.find(
    d =>
      d['fuel_tech'] === FT.ROOFTOP_SOLAR || d['fuel_tech'] === FT.SOLAR_ROOFTOP
  )
  const temperatureItem = data.find(d => DT.isTemperature(d.type))
  const priceItem = data.find(d => d.type === DT.PRICE)
  const interpolateSeriesTypes = []
  if (rooftopSolarItem) {
    interpolateSeriesTypes.push({
      key: rooftopSolarItem.id,
      interpolation: 'linear',
      startIndex: -1,
      currentValue: null
    })
  }
  if (temperatureItem) {
    interpolateSeriesTypes.push({
      key: temperatureItem.id,
      interpolation: 'linear',
      startIndex: -1,
      currentValue: null
    })
  }
  if (priceItem) {
    interpolateSeriesTypes.push({
      key: priceItem.id,
      interpolation: 'step',
      startIndex: -1,
      currentValue: null
    })
    interpolateSeriesTypes.push({
      key: DT.PRICE_ABOVE_300,
      interpolation: 'step',
      startIndex: -1,
      currentValue: null
    })
    interpolateSeriesTypes.push({
      key: DT.PRICE_BELOW_0,
      interpolation: 'step',
      startIndex: -1,
      currentValue: null
    })
  }

  return interpolateSeriesTypes
}

export default function(dataAll, datasetAll) {
  const forInterpolate = findInterpolateSeriesTypes(dataAll)
  if (forInterpolate.length > 0) {
    datasetAll.forEach((d, i) => {
      forInterpolate.forEach(type => {
        if (d[type.key] !== null) {
          if (type.interpolation === 'linear') {
            if (type.startIndex === -1) {
              type.startIndex = i
            } else {
              const count = i - type.startIndex
              const addValue = (d[type.key] - type.currentValue) / count
              for (let x = type.startIndex + 1; x <= i; x += 1) {
                datasetAll[x][type.key] = type.currentValue + addValue
                type.currentValue = datasetAll[x][type.key]
              }
              type.startIndex = i
            }
          }
          type.currentValue = d[type.key]
        } else if (d[type.key] === null) {
          if (type.interpolation === 'step') {
            d[type.key] = type.currentValue
          }
        }
      })
    })
  }
}
