import _cloneDeep from 'lodash.clonedeep'
import axios from 'axios'

import PerfTime from '@/plugins/perfTime.js'
import { FACILITY_OPERATING } from '@/constants/facility-status.js'
import { isPowerRange, RANGE_7D, RANGE_30D } from '@/constants/ranges.js'
import {
  INTERVAL_5MIN,
  INTERVAL_30MIN,
  INTERVAL_DAY
} from '@/constants/interval-filters.js'
import { dataProcess, dataRollUp } from '@/data/parse/facility-energy'

let request = null

const getApiBaseUrl = () => {
  let apiBaseUrl = `https://api.opennem.org.au`
  let host = undefined
  if (typeof window !== 'undefined') {
    host = window.location.host
  }

  if (
    host &&
    (host === 'localhost:3000' ||
      host.startsWith('127') ||
      host.startsWith('192'))
  ) {
    apiBaseUrl = `/api`
  }

  if (host && host.startsWith('dev')) {
    apiBaseUrl = `https://api.dev.opennem.org.au`
  }

  if (process.env.API_BASE_URL !== undefined) {
    apiBaseUrl = process.env.API_BASE_URL
  }

  console.info('apiBaseUrl', apiBaseUrl)

  return apiBaseUrl
}

const http = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
})

const stationPath = code => `/station/${code}`
const statsPath = (type, networkRegion, code, query) =>
  `/stats/${type}/station/${networkRegion}/${code}${query}`

export const state = () => ({
  dataset: [],
  sortBy: 'displayName',
  orderBy: 'asc',
  selectedStatuses: [FACILITY_OPERATING],
  selectedTechGroups: [],
  selectedTechs: [],
  selectedView: 'list',
  filteredFacilities: [],

  previousPath: '',
  fetchingFacility: false,
  fetchingStats: false,
  selectedFacility: null,
  selectedFacilityNetworkRegion: '',
  selectedFacilityUnits: [],
  selectedFacilityUnitsDataset: [],
  selectedFacilityUnitsDatasetFlat: [], // as returned transform

  dataType: 'power', // power, energy
  range: RANGE_7D,
  interval: INTERVAL_30MIN
})

export const mutations = {
  dataset(state, data) {
    state.dataset = data
  },
  sortBy(state, data) {
    state.sortBy = data
  },
  orderBy(state, data) {
    state.orderBy = data
  },
  selectedStatuses(state, data) {
    state.selectedStatuses = data
  },
  selectedTechGroups(state, data) {
    state.selectedTechGroups = data
  },
  selectedTechs(state, data) {
    state.selectedTechs = data
  },
  filteredFacilities(state, data) {
    state.filteredFacilities = data
  },

  previousPath(state, data) {
    state.previousPath = data
  },
  fetchingFacility(state, data) {
    state.fetchingFacility = data
  },
  fetchingStats(state, data) {
    state.fetchingStats = data
  },
  selectedView(state, data) {
    state.selectedView = data
  },
  selectedFacility(state, data) {
    state.selectedFacility = data
  },
  selectedFacilityNetworkRegion(state, data) {
    state.selectedFacilityNetworkRegion = data
  },
  selectedFacilityUnits(state, data) {
    state.selectedFacilityUnits = data
  },
  selectedFacilityUnitsDataset(state, data) {
    state.selectedFacilityUnitsDataset = data
  },
  selectedFacilityUnitsDatasetFlat(state, data) {
    state.selectedFacilityUnitsDatasetFlat = data
  },
  dataType(state, data) {
    state.dataType = data
  },
  range(state, data) {
    state.range = data
  },
  interval(state, data) {
    state.interval = data
  }
}

export const getters = {
  dataset: state => _cloneDeep(state.dataset),
  sortBy: state => state.sortBy,
  orderBy: state => state.orderBy,
  selectedStatuses: state => _cloneDeep(state.selectedStatuses),
  selectedTechGroups: state => _cloneDeep(state.selectedTechGroups),
  selectedTechs: state => _cloneDeep(state.selectedTechs),
  selectedView: state => state.selectedView,
  filteredFacilities: state => state.filteredFacilities,

  previousPath: state => state.previousPath,
  fetchingFacility: state => state.fetchingFacility,
  fetchingStats: state => state.fetchingStats,
  selectedFacility: state => _cloneDeep(state.selectedFacility),
  selectedFacilityNetworkRegion: state =>
    _cloneDeep(state.selectedFacilityNetworkRegion),
  selectedFacilityUnits: state => _cloneDeep(state.selectedFacilityUnits),
  selectedFacilityUnitsDataset: state =>
    _cloneDeep(state.selectedFacilityUnitsDataset),
  selectedFacilityUnitsDatasetFlat: state =>
    _cloneDeep(state.selectedFacilityUnitsDatasetFlat),
  dataType: state => state.dataType,
  range: state => state.range,
  interval: state => state.interval
}

export const actions = {
  dataset({ commit }, data) {
    commit('dataset', data)
  },
  sortBy({ commit }, data) {
    commit('sortBy', data)
  },
  orderBy({ commit }, data) {
    commit('orderBy', data)
  },
  selectedStatuses({ commit }, data) {
    commit('selectedStatuses', data)
  },
  selectedTechs({ commit }, data) {
    commit('selectedTechs', data)
  },
  selectedView({ commit }, data) {
    commit('selectedView', data)
  },

  doGetFacilityById({ commit }, { facilityId }) {
    console.log('fetching', facilityId)
    const encode = encodeURIComponent(facilityId)
    const ref = stationPath(encode)

    commit('fetchingFacility', true)
    commit('selectedFacility', null)
    commit('selectedFacilityNetworkRegion', '')

    http
      .get(ref)
      .then(response => {
        console.log('fetched', response.data)
        const networkCode = response.data.network
          ? response.data.network.code
          : ''
        commit('selectedFacility', response.data)
        commit('selectedFacilityNetworkRegion', networkCode)
      })
      .catch(e => {
        const error = e.toJSON()
        const message = `fetch ${error.config.url} error: ${error.message}`
        console.error(message, e.toJSON())
      })
      .then(() => {
        commit('fetchingFacility', false)
      })
  },

  doGetStationStats({ commit, getters }, { networkRegion, facilityId }) {
    const encode = encodeURIComponent(facilityId)
    const range = getters.range
    const interval = getters.interval

    let period = range
    if (range === '30D') {
      if (interval === '30m') {
        period = '1M&interval=30m'
      } else {
        period = '1M&interval=1d'
      }
    }
    if (range === '1Y') {
      period = '1Y&interval=1d'
    }
    if (range === 'ALL') {
      period = 'all&interval=1M'
    }

    const type = isPowerRange(range) ? 'power' : 'energy'
    const query = isPowerRange(range) ? '?period=7d' : `?period=${period}`
    const ref = statsPath(type, networkRegion, encode, query)

    if (request) {
      request.cancel('Operation cancelled by the user.')
    }

    request = axios.CancelToken.source()

    commit('fetchingStats', true)
    commit('selectedFacilityUnitsDataset', [])
    commit('selectedFacilityUnitsDatasetFlat', [])
    commit('selectedFacilityUnits', [])
    commit('dataType', type)

    http
      .get(ref, {
        cancelToken: request.token
      })
      .then(response => {
        console.log('fetched stats', response.data)

        const perf = new PerfTime()
        perf.time()
        console.info(`------ facility data process (start)`)
        const { dataset, datasetFlat, units } = dataProcess(
          response.data.data,
          range,
          interval
        )

        commit('selectedFacilityUnitsDataset', dataset)
        commit('selectedFacilityUnitsDatasetFlat', datasetFlat)
        commit('selectedFacilityUnits', units)
        perf.timeEnd(`------ facility data process (end)`)
        request = null

        const version = response.data.version
        commit('app/apiVersion', version && version !== '' ? version : null, {
          root: true
        })
        commit('fetchingStats', false)
      })
      .catch(e => {
        if (axios.isCancel(e)) {
          console.log('Request canceled', e.message)
        } else {
          const error = e
          // const message = `fetch ${error.config.url} error: ${error.message}`
          console.error(e)
          request = null
          commit('fetchingStats', false)
        }
      })
  },

  doUpdateDatasetByInterval({ commit, getters }) {
    const type = getters.dataType
    const interval = getters.interval
    const units = getters.selectedFacilityUnits
    const datasetFlat = getters.selectedFacilityUnitsDatasetFlat
    const dataset = dataRollUp(datasetFlat, units, interval, type === 'energy')
    commit('selectedFacilityUnitsDataset', dataset)
  }
}
