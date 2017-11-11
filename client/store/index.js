import Vue from 'vue'
import Vuex from 'vuex'
import axios from "axios"
import * as moment from 'moment'

import { calculateHorizonValues } from '../utils/AmchartsDataTransform'

Vue.use(Vuex)

const state = {
  weekStarting: '',
  generationData: null,
  priceData: null,
  demandData: null,
}

const mutations = {
  updateGenerationData(state, data) {
    state.generationData = data
  },
  updatePriceData(state, data) {
    state.priceData = data
  },
  updateDemandData(state, data) {
    state.demandData = data
  }
}

const getters = {
  getGenerationData: state => {
    return state.generationData
  },
  getPriceData: state => {
    return state.priceData
  },
  getDemand: state => {
    return state.demandData
  }
}

const actions = {
  fetchData({commit}, data) {
    const fetchGen = axios.get(`/data/${data.week}/gen_5m_${data.region}.json`)
    const fetchDispatch = axios.get(`/data/${data.week}/dispatch_5m_${data.region}.json`)
    const fetchPrice = axios.get(`/data/${data.week}/price_30m_${data.region}.json`)
    // const fetchGen = axios.get(`/samples/combined_sample.json`)
    // const fetchPrice = axios.get(`/samples/combined_sample.json`)
    
    axios.all([fetchGen, fetchDispatch, fetchPrice])
      .then(axios.spread(function (gen, dispatch, price) {
        commit('updateGenerationData', Object.assign(gen.data, dispatch.data))
        commit('updatePriceData', price.data)
      }));
  },
  fetchDemand({commit}, data) {
    const week = '2017-10-14'
    const fetchDispatch1 = axios.get(`/data/${week}/dispatch_5m_nsw1.json`)
    const fetchDispatch2 = axios.get(`/data/${week}/dispatch_5m_qld1.json`)
    const fetchDispatch3 = axios.get(`/data/${week}/dispatch_5m_sa1.json`)
    const fetchDispatch4 = axios.get(`/data/${week}/dispatch_5m_tas1.json`)
    const fetchDispatch5 = axios.get(`/data/${week}/dispatch_5m_vic1.json`)
    
    axios.all([fetchDispatch1, fetchDispatch2, fetchDispatch3, fetchDispatch4, fetchDispatch5])
      .then(axios.spread(function (dispatch1, dispatch2, dispatch3, dispatch4, dispatch5) {
        const key = 'DEMAND_AND_NONSCHEDGEN'
        const demand = []
        const nswDemand = dispatch1.data[key]
        const nswDemandData = nswDemand.data
        const qldDemandData = dispatch2.data[key].data
        const saDemandData = dispatch3.data[key].data
        const tasDemandData = dispatch4.data[key].data
        const vicDemandData = dispatch5.data[key].data
        const interval = '5'
        const start = moment(nswDemand.start, moment.ISO_8601)
  
        for (let i=0; i<nswDemandData.length; i++) {
          const now = moment(start).add(interval*i, 'm')

          const nsw = calculateHorizonValues(nswDemandData[i])
          const qld = calculateHorizonValues(qldDemandData[i])
          const sa = calculateHorizonValues(saDemandData[i])
          const tas = calculateHorizonValues(tasDemandData[i])
          const vic = calculateHorizonValues(vicDemandData[i])
          
          demand[i] = {
            date: now.toDate(),
            nsw: nswDemandData[i],
            nsw1: nsw[0],
            nsw2: nsw[1],
            nsw3: nsw[2],            
            qld: qldDemandData[i],
            qld1: qld[0],
            qld2: qld[1],
            qld3: qld[2], 
            sa: saDemandData[i],
            sa1: sa[0],
            sa2: sa[1],
            sa3: sa[2], 
            tas: tasDemandData[i],
            tas1: tas[0],
            tas2: tas[1],
            tas3: tas[2], 
            vic: vicDemandData[i],
            vic1: vic[0],
            vic2: vic[1],
            vic3: vic[2]
          }
        }
        commit('updateDemandData', demand)
      })
    )
  }
}

const store = new Vuex.Store({
  state,
  mutations,
  actions,
  getters
})

export default store
