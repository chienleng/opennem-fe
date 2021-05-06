import cloneDeep from 'lodash.clonedeep'
import { lsSet } from '~/services/LocalStorage'
import * as FUEL_TECHS from '~/constants/energy-fuel-techs/group-default.js'
import { ENERGY_NEM } from '@/constants/energy-regions.js'
import regionDisplayTzs from '@/constants/region-display-timezones.js'

export const state = () => ({
  hostEnv: null, // local, prod, dev
  currentView: 'energy', // energy, facilities
  nem: [],
  fuelTechMeta: null,
  fuelTechNames: null,
  fuelTechGroupName: 'Default', // Default, Flexibility
  fuelTechOrder: cloneDeep(FUEL_TECHS.DEFAULT_FUEL_TECH_ORDER),
  hiddenFuelTechs: [],
  energyDomains: [],
  emissionDomains: [],
  priceDomains: [],
  temperatureDomains: [],
  marketValueDomains: [],
  range: '',
  interval: '',
  dateFilter: [],
  exportData: [],
  facilityExportData: [],
  responsiveBreakWidth: 769,
  exportAttribution: '@name',
  percentContributionTo: 'demand', // or generation
  showSummaryColumn: 'av-value', // or emissions-volume or emissions-intensity
  filterPeriod: 'All',
  compareDifference: false,
  focusOn: false,
  compareDates: [],
  drawer: false,

  displayTimeZone: regionDisplayTzs[ENERGY_NEM]
})

export const mutations = {
  hostEnv(state, data) {
    state.hostEnv = data
  },
  currentView(state, data) {
    state.currentView = data
  },
  nem(state, data) {
    state.nem = data
  },
  fuelTechMeta(state, data) {
    state.fuelTechMeta = cloneDeep(data)
  },
  fuelTechNames(state, data) {
    state.fuelTechNames = cloneDeep(data)
  },
  fuelTechGroupName(state, data) {
    state.fuelTechGroupName = data
  },
  fuelTechOrder(state, data) {
    state.fuelTechOrder = data
  },
  hiddenFuelTechs(state, data) {
    state.hiddenFuelTechs = data
  },
  energyDomains(state, data) {
    state.energyDomains = data
  },
  emissionDomains(state, data) {
    state.emissionDomains = data
  },
  priceDomains(state, data) {
    state.priceDomains = data
  },
  temperatureDomains(state, data) {
    state.temperatureDomains = data
  },
  marketValueDomains(state, data) {
    state.marketValueDomains = data
  },
  range(state, data) {
    state.range = data
  },
  interval(state, data) {
    state.interval = data
  },
  dateFilter(state, data) {
    state.dateFilter = data
  },
  exportData(state, data) {
    state.exportData = data
  },
  facilityExportData(state, data) {
    state.facilityExportData = data
  },
  responsiveBreakWidth(state, data) {
    state.responsiveBreakWidth = data
  },
  exportAttribution(state, data) {
    lsSet('exportAttribution', data)
    state.exportAttribution = data
  },
  percentContributionTo(state, data) {
    state.percentContributionTo = data
  },
  showSummaryColumn(state, data) {
    state.showSummaryColumn = data
  },
  filterPeriod(state, data) {
    state.filterPeriod = data
  },
  compareDifference(state, data) {
    state.compareDifference = data
  },
  focusOn(state, data) {
    state.focusOn = data
  },
  compareDates(state, data) {
    state.compareDates = data
  },
  drawer(state, data) {
    state.drawer = data
  },
  displayTimeZone(state, data) {
    state.displayTimeZone = data
  }
}

export const getters = {
  hostEnv: state => state.hostEnv,
  currentView: state => state.currentView,
  nemLength: state => state.nem.length,
  nemData: state => state.nem,
  fuelTechMeta: state => state.fuelTechMeta,
  fuelTechNames: state => state.fuelTechNames,
  fuelTechGroupName: state => state.fuelTechGroupName,
  fuelTechOrder: state => state.fuelTechOrder,
  hiddenFuelTechs: state => state.hiddenFuelTechs,
  energyDomains: state => state.energyDomains,
  emissionDomains: state => state.emissionDomains,
  priceDomains: state => state.priceDomains,
  temperatureDomains: state => state.temperatureDomains,
  marketValueDomains: state => state.marketValueDomains,
  range: state => state.range,
  energyCurveType: state => {
    switch (state.range) {
      case '1D':
      case '3D':
      case '7D':
        return 'smooth'
      default:
        return 'step'
    }
  },
  step: state => {
    switch (state.range) {
      case '1D':
      case '3D':
      case '7D':
        return false
      default:
        return true
    }
  },
  energyChartType: state => {
    switch (state.range) {
      case '1D':
      case '3D':
      case '7D':
        return 'power'
      default:
        return 'energy'
    }
  },
  chartUnit: state => {
    switch (state.range) {
      case '1D':
      case '3D':
      case '7D':
        return ' W'
      default:
        return ' GWh'
    }
  },
  interval: state => state.interval,
  dateFilter: state => state.dateFilter,
  exportData: state => state.exportData,
  facilityExportData: state => state.facilityExportData,
  responsiveBreakWidth: state => state.responsiveBreakWidth,
  exportAttribution: state => state.exportAttribution,

  showSummaryColumn: state => state.showSummaryColumn,
  filterPeriod: state => state.filterPeriod,
  compareDifference: state => state.compareDifference,
  focusOn: state => state.focusOn,
  compareDates: state => state.compareDates,
  drawer: state => state.drawer,

  percentContributionTo: state => state.percentContributionTo,
  isContributionDemand: state => state.percentContributionTo === 'demand',
  isContributionGeneration: state =>
    state.percentContributionTo === 'generation',

  displayTimeZone: state => state.displayTimeZone
}

export const actions = {
  hostEnv({ commit }, data) {
    commit('hostEnv', data)
  },
  currentView({ commit }, data) {
    commit('currentView', data)
  },
  fuelTechMeta({ commit }, data) {
    commit('fuelTechMeta', data)
  },
  fuelTechNames({ commit }, data) {
    commit('fuelTechNames', data)
  },
  fuelTechGroupName({ commit }, data) {
    commit('fuelTechGroupName', data)
  },
  fuelTechOrder({ commit }, data) {
    commit('fuelTechOrder', data)
  },
  hiddenFuelTechs({ commit }, data) {
    commit('hiddenFuelTechs', data)
  },
  energyDomains({ commit }, data) {
    commit('energyDomains', data)
  },
  emissionDomains({ commit }, data) {
    commit('emissionDomains', data)
  },
  priceDomains({ commit }, data) {
    commit('priceDomains', data)
  },
  temperatureDomains({ commit }, data) {
    commit('temperatureDomains', data)
  },
  marketValueDomains({ commit }, data) {
    commit('marketValueDomains', data)
  },
  range({ commit }, data) {
    commit('range', data)
  },
  interval({ commit }, data) {
    commit('interval', data)
  },
  dateFilter({ commit }, data) {
    commit('dateFilter', data)
  },
  exportData({ commit }, data) {
    commit('exportData', data)
  },
  facilityExportData({ commit }, data) {
    commit('facilityExportData', data)
  },
  responsiveBreakWidth({ commit }, data) {
    commit('responsiveBreakWidth', data)
  },
  exportAttribution({ commit }, data) {
    commit('exportAttribution', data)
  },
  percentContributionTo({ commit }, data) {
    commit('percentContributionTo', data)
  },
  showSummaryColumn({ commit }, data) {
    commit('showSummaryColumn', data)
  },
  filterPeriod({ commit }, data) {
    commit('filterPeriod', data)
  },
  compareDifference({ commit }, data) {
    commit('compareDifference', data)
  },
  focusOn({ commit }, data) {
    commit('focusOn', data)
  },
  compareDates({ commit }, data) {
    commit('compareDates', data)
  },
  drawer({ commit }, data) {
    commit('drawer', data)
  }
}
