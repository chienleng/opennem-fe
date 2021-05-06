import * as OPTIONS from '@/constants/chart-options.js'
import * as SI from '@/constants/si'

export const state = () => ({
  chartDefaultType: OPTIONS.CHART_STACKED,
  chartType: OPTIONS.CHART_STACKED,

  chartEnergyYAxis: OPTIONS.CHART_YAXIS_ENERGY,
  chartEnergyCurve: OPTIONS.CHART_CURVE_STEP,
  chartEnergyUnit: 'Wh',
  chartEnergyUnitPrefix: SI.GIGA,
  chartEnergyDisplayPrefix: SI.GIGA,

  chartPowerYAxis: OPTIONS.CHART_YAXIS_ABSOLUTE,
  chartPowerCurve: OPTIONS.CHART_CURVE_SMOOTH,
  chartPowerUnit: 'W',
  chartPowerUnitPrefix: SI.BASE,
  chartPowerDisplayPrefix: SI.BASE,

  chartEnergyRenewablesLine: false
})

export const getters = {
  chartShown: state => state.chartType !== OPTIONS.CHART_HIDDEN,
  chartDefaultType: state => state.chartDefaultType,
  chartType: state => state.chartType,

  chartEnergyYAxis: state => state.chartEnergyYAxis,
  chartEnergyCurve: state => state.chartEnergyCurve,
  chartEnergyUnit: state => state.chartEnergyUnit,
  chartEnergyUnitPrefix: state => state.chartEnergyUnitPrefix,
  chartEnergyDisplayPrefix: state => state.chartEnergyDisplayPrefix,
  chartEnergyCurrentUnit: state =>
    `${state.chartEnergyDisplayPrefix}${state.chartEnergyUnit}`,

  chartPowerYAxis: state => state.chartPowerYAxis,
  chartPowerCurve: state => state.chartPowerCurve,
  chartPowerUnit: state => state.chartPowerUnit,
  chartPowerUnitPrefix: state => state.chartPowerUnitPrefix,
  chartPowerDisplayPrefix: state => state.chartPowerDisplayPrefix,
  chartPowerCurrentUnit: state =>
    `${state.chartPowerDisplayPrefix}${state.chartPowerUnit}`,

  chartEnergyRenewablesLine: state => state.chartEnergyRenewablesLine
}

export const mutations = {
  chartType(state, data) {
    state.chartType = data
  },

  chartEnergyYAxis(state, data) {
    state.chartEnergyYAxis = data
  },
  chartEnergyCurve(state, data) {
    state.chartEnergyCurve = data
  },
  chartEnergyUnit(state, data) {
    state.chartEnergyUnit = data
  },
  chartEnergyUnitPrefix(state, data) {
    state.chartEnergyUnitPrefix = data
  },
  chartEnergyDisplayPrefix(state, data) {
    state.chartEnergyDisplayPrefix = data
  },

  chartPowerYAxis(state, data) {
    state.chartPowerYAxis = data
  },
  chartPowerCurve(state, data) {
    state.chartPowerCurve = data
  },
  chartPowerUnit(state, data) {
    state.chartPowerUnit = data
  },
  chartPowerUnitPrefix(state, data) {
    state.chartPowerUnitPrefix = data
  },
  chartPowerDisplayPrefix(state, data) {
    state.chartPowerDisplayPrefix = data
  },

  chartEnergyRenewablesLine(state, data) {
    state.chartEnergyRenewablesLine = data
  }
}

export const actions = {
  doSetChartEnergyPrefixes({ commit }, prefix) {
    commit('chartEnergyUnitPrefix', prefix)
    commit('chartEnergyDisplayPrefix', prefix)
  },
  doSetChartEnergyUnitPrefix({ commit }, prefix) {
    // WORKAROUND: update this when units is returned correctly
    commit('chartEnergyUnitPrefix', prefix.toUpperCase())
  }
}
