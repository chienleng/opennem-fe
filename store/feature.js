import { lsSet } from '~/services/LocalStorage'
import {
  FEATURE_TOGGLE_EMISSIONS,
  FEATURE_TOGGLE_REGION_COMPARE,
  FEATURE_TOGGLE_V3_PATHS,
  FEATURE_TOGGLE_AU_ENERGY
} from '@/constants/mutation-types/features.js'

export const state = () => ({
  emissions: false,
  regionCompare: false,
  v3Paths: false,
  auEnergy: false
})

export const getters = {
  emissions: state => state.emissions,
  regionCompare: state => state.regionCompare,
  v3Paths: state => state.v3Paths,
  auEnergy: state => state.auEnergy
}

export const mutations = {
  emissions(state, emissions) {
    lsSet(FEATURE_TOGGLE_EMISSIONS, emissions)
    state.emissions = emissions
  },
  regionCompare(state, regionCompare) {
    lsSet(FEATURE_TOGGLE_REGION_COMPARE, regionCompare)
    state.regionCompare = regionCompare
  },
  v3Paths(state, v3Paths) {
    lsSet(FEATURE_TOGGLE_V3_PATHS, v3Paths)
    state.v3Paths = v3Paths
  },
  auEnergy(state, auEnergy) {
    lsSet(FEATURE_TOGGLE_AU_ENERGY, auEnergy)
    state.auEnergy = auEnergy
  }
}

export const actions = {}
