import _cloneDeep from 'lodash.clonedeep'
import { getAllGroups } from '@/constants/energy-fuel-techs'
import { EMISSIONS, MARKET_VALUE } from '@/constants/data-types'
import process from './process'
import rollUp from './rollUp'
import summariseDataset from './summarise'
import groupDataset from './group'
import {
  filterDatasetByRange,
  filterDatasetByPeriod
} from '@/data/helpers/filter'
import combineMultipleResponses from '@/data/helpers/combineMultipleResponses.js'

export function simpleDataProcess(res) {
  const responses = combineMultipleResponses(res)

  const {
    datasetFlat,
    datasetInflation,
    domainMarketValue,
    domainPrice,
    domainPowerEnergy,
    domainEmissions,
    domainTemperature,
    domainInflation,
    type
  } = process(responses)

  const isEnergyType = type === 'energy'

  summariseDataset({
    isEnergyType,
    currentDataset: datasetFlat,
    datasetInflation,
    domainPowerEnergy,
    domainEmissions,
    domainPrice: isEnergyType ? domainMarketValue : domainPrice,
    domainInflation
  })

  return {
    dataset: datasetFlat,
    domainPowerEnergy,
    domainEmissions,
    domainTemperature,
    domainPrice,
    domainMarketValue,
    inflation: {
      data: datasetInflation,
      domain: domainInflation
    }
  }
}

export function dataProcess(res, range, interval, period) {
  const responses = combineMultipleResponses(res)

  const {
    datasetFlat,
    domainMarketValue,
    domainPrice,
    domainPowerEnergy,
    domainTemperature,
    domainEmissions,
    dataPowerEnergyInterval,
    type,
    units
  } = process(responses)

  const isEnergyType = type === 'energy'
  const datasetFull = _cloneDeep(datasetFlat)
  const dataset = filterDatasetByRange(datasetFlat, range)

  const currentDataset =
    dataPowerEnergyInterval === interval
      ? dataset
      : rollUp({
          domains: [
            ...domainPowerEnergy,
            ...domainEmissions,
            ...domainMarketValue,
            ...domainPrice,
            ...domainTemperature
          ],
          datasetFlat: dataset,
          interval
        })
  const domainPowerEnergyGrouped = getAllGroups(domainPowerEnergy, type)
  const domainEmissionsGrouped = getAllGroups(domainEmissions, EMISSIONS)
  const domainMarketValueGrouped = getAllGroups(domainMarketValue, MARKET_VALUE)

  summariseDataset({
    isEnergyType,
    currentDataset,
    domainPowerEnergy,
    domainEmissions,
    domainPrice: isEnergyType ? domainMarketValue : domainPrice
  })
  groupDataset({
    dataset: currentDataset,
    domainPowerEnergyGrouped,
    domainEmissionsGrouped,
    domainMarketValueGrouped
  })

  // summarise and group original dataset
  if (!isEnergyType && dataPowerEnergyInterval !== interval) {
    summariseDataset({
      isEnergyType,
      currentDataset: dataset,
      domainPowerEnergy,
      domainEmissions,
      domainPrice: domainPrice
    })
    groupDataset({
      dataset: dataset,
      domainPowerEnergyGrouped,
      domainEmissionsGrouped,
      domainMarketValueGrouped
    })
  }

  return {
    dataType: type,
    datasetFull,
    datasetFlat: dataset,
    dataPowerEnergyInterval,
    domainPowerEnergy,
    domainPowerEnergyGrouped,
    domainEmissions,
    domainEmissionsGrouped,
    domainMarketValue,
    domainMarketValueGrouped,
    domainPrice,
    domainTemperature,
    currentDataset: filterDatasetByPeriod(currentDataset, interval, period),
    units
  }
}

export function dataRollUp({
  datasetFlat,
  domainPowerEnergy,
  domainPowerEnergyGrouped,
  domainEmissions,
  domainEmissionsGrouped,
  domainMarketValue,
  domainMarketValueGrouped,
  domainPrice,
  domainTemperature,
  range,
  interval,
  isEnergyType
}) {
  const currentDataset = rollUp({
    domains: [
      ...domainPowerEnergy,
      ...domainEmissions,
      ...domainMarketValue,
      ...domainPrice,
      ...domainTemperature
    ],
    datasetFlat: filterDatasetByRange(datasetFlat, range),
    interval
  })

  summariseDataset({
    isEnergyType,
    currentDataset,
    domainPowerEnergy,
    domainEmissions,
    domainPrice: isEnergyType ? domainMarketValue : domainPrice
  })
  groupDataset({
    dataset: currentDataset,
    domainPowerEnergyGrouped,
    domainEmissionsGrouped,
    domainMarketValueGrouped
  })

  return {
    currentDataset
  }
}

export function dataFilterByPeriod({ currentDataset, interval, period }) {
  return {
    filteredDatasetFlat: filterDatasetByPeriod(currentDataset, interval, period)
  }
}
