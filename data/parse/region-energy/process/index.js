import parseISO from 'date-fns/parseISO'
import addDays from 'date-fns/addDays'
import addMonths from 'date-fns/addMonths'
import PerfTime from '@/plugins/perfTime.js'
import { EMISSIONS, MARKET_VALUE } from '@/constants/data-types'
import createEmptyDatasets from '@/data/helpers/createEmptyDatasets.js'
import parseAndCheckData from './parseAndCheckData.js'
import flattenAndInterpolate from './flattenAndInterpolate.js'
import flatten from './flatten.js'
import {
  getFuelTechWithTypeDomains,
  getFuelTechInOrder,
  getFuelTechDomains,
  getTemperatureDomains,
  getPriceDomains,
  getVolWeightedPriceDomains,
  getInflationDomain
} from './getDomains.js'

const perfTime = new PerfTime()

export default function(data) {
  perfTime.time()

  const {
    dataAll,
    dataPowerEnergy,
    dataEmissions,
    dataPriceMarketValue,
    dataTemperature,
    dataInflation,
    fuelTechDataType,
    isPowerData,
    hasPowerEnergyData,
    units
  } = parseAndCheckData(data)

  const dataPowerEnergyInterval =
    dataPowerEnergy.length > 0
      ? dataPowerEnergy[0].history
        ? dataPowerEnergy[0].history.interval
        : null
      : null

  const hasPriceMarketValue = dataPriceMarketValue.length > 0

  const fuelTechIdTypes = getFuelTechInOrder(dataPowerEnergy)

  const domainPowerEnergy = getFuelTechDomains(
    fuelTechIdTypes,
    fuelTechDataType
  )
  const domainEmissions = getFuelTechDomains(
    getFuelTechInOrder(dataEmissions),
    EMISSIONS
  )

  let domainMarketValue = [],
    domainPrice = []

  if (hasPriceMarketValue) {
    domainMarketValue = isPowerData
      ? getFuelTechWithTypeDomains(fuelTechIdTypes, MARKET_VALUE)
      : getFuelTechDomains(
          getFuelTechInOrder(dataPriceMarketValue),
          MARKET_VALUE
        )

    domainPrice = isPowerData
      ? getPriceDomains(dataPriceMarketValue)
      : getVolWeightedPriceDomains()
  } else {
    console.warn('There is no price or market value in this dataset')
  }

  const domainTemperature = getTemperatureDomains(dataTemperature)

  const dataInterval = hasPowerEnergyData
    ? dataPowerEnergy[0].history.interval
    : null

  const datasetFlat = createEmptyDatasets(dataPowerEnergy)

  flattenAndInterpolate(isPowerData, dataInterval, dataAll, datasetFlat)

  const hasInflation = dataInflation.length > 0
  if (hasInflation) {
    // adjust the start date to july 1922, instead of june 1922 to match the quarter
    dataInflation[0].history.start = addMonths(
      parseISO(dataInflation[0].history.start),
      1
    ).toISOString()

    dataInflation[0].history.last = addDays(
      parseISO(dataInflation[0].history.last),
      1
    ).toISOString()
  }
  const datasetInflation = hasInflation
    ? createEmptyDatasets(dataInflation)
    : []
  const domainInflation = hasInflation
    ? getInflationDomain(dataInflation[0].id)
    : null

  if (hasInflation) {
    flatten(dataInflation, datasetInflation)
  }

  perfTime.timeEnd('--- data.process')

  return {
    datasetFlat,
    datasetInflation,
    domainPowerEnergy,
    domainEmissions,
    domainMarketValue,
    domainPrice,
    domainTemperature,
    domainInflation,
    dataPowerEnergyInterval,
    type: isPowerData ? 'power' : 'energy',
    units
  }
}
