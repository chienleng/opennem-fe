import * as DT from '@/constants/data-types.js'
import {
  checkHistoryObject,
  checkPowerEnergyExists
} from '@/services/DataCheck.js'

export default function(response) {
  const data = response.data || response
  const dataAll = [],
    dataPower = [],
    dataEnergy = [],
    dataPowerEnergy = [],
    dataEmissions = [],
    dataPriceMarketValue = [],
    dataTemperature = [],
    dataInflation = []
  // filter out each type to its own array
  data.forEach(d => {
    checkHistoryObject(d)

    const typeProp = typeof d.data_type === 'undefined' ? 'type' : 'data_type'
    if (DT.isValidDataType(d[typeProp])) {
      dataAll.push(d)
    }

    switch (d.type) {
      case DT.POWER:
        dataPower.push(d)
        dataPowerEnergy.push(d)
        break
      case DT.ENERGY:
        dataEnergy.push(d)
        dataPowerEnergy.push(d)
        break
      case DT.DEMAND:
        break
      case DT.EMISSIONS:
        dataEmissions.push(d)
        break
      case DT.MARKET_VALUE:
      case DT.PRICE:
        dataPriceMarketValue.push(d)
        break
      case DT.TEMPERATURE:
      case DT.TEMPERATURE_MIN:
      case DT.TEMPERATURE_MAX:
      case DT.TEMPERATURE_MEAN:
        dataTemperature.push(d)
        break
      case DT.CPI:
        dataInflation.push(d)
        break
      default:
        console.warn(`Unknown type in JSON response - ${d.type}`, d)
    }
  })

  checkPowerEnergyExists({ dataPower, dataEnergy })

  return {
    dataAll,
    dataPowerEnergy,
    dataEmissions,
    dataPriceMarketValue,
    dataTemperature,
    dataInflation,
    isPowerData: dataPower.length > 0,
    hasPowerEnergyData: dataPowerEnergy.length > 0,
    fuelTechDataType: dataPower.length > 0 ? DT.POWER : DT.ENERGY,
    units: dataPowerEnergy.length > 0 ? dataPowerEnergy[0].units : ''
  }
}
