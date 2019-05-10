/* eslint-disable */
import _ from 'lodash';
import getJSON from '@/lib/data-apis';
import * as MutationTypes from '@/constants/mutation-types';

function transformFacilityData(data) {
  const stationIds = Object.keys(data);
  const stations = stationIds.map(d => data[d]);

  return stations.map(d => {
    const stationId = d.station_id || '';
    const regionId = d.region_id || '';
    const location = d.location || null;
    const units = [];
    const duidKeys = Object.keys(d.duid_data);
    const unitNum = duidKeys.length;
    const fuelTechs = [];
    const fuelTechRegisteredCap = {};
    const displayName = d.display_name.split('/').join(' / ');
    let generatorCap = 0;

    duidKeys.forEach(unitName => {
      const unit = d.duid_data[unitName];
      const regCap = unit.registered_capacity;
      const fuelTech = unit.fuel_tech;

      const unitObj = {
        name: unitName,
        fuelTech,
        regCap,
      };

      generatorCap += regCap || 0;

      if (fuelTech) {
        if (!fuelTechRegisteredCap[fuelTech]) {
          fuelTechRegisteredCap[fuelTech] = 0;
        }
        fuelTechRegisteredCap[fuelTech] += regCap;
      }
      if (fuelTech !== 'battery_charging' && !_.isEmpty(unit)) {
        fuelTechs.push(fuelTech);
      }
      if (!_.isEmpty(unit)) {
        units.push(unitObj);
      }
    });

    return {
      stationId,
      displayName,
      status: d.status.state,
      statusDate: d.status.date,
      regionId,
      location,
      units,
      generatorCap,
      unitNum,
      fuelTechs: _.uniq(fuelTechs).sort(),
      fuelTechRegisteredCap,
    }
  })
}

const state = {
  facilityData: [],
  facilityResponseData: [],
  facilitySelectedTechs: [],
};

const mutations = {
  [MutationTypes.FACILITY_DATA](state, data) {
    state.facilityData = data;
  },
  [MutationTypes.FACILITY_RESPONSE_DATA](state, data) {
    state.facilityResponseData = data;
  },
  [MutationTypes.FACILITY_SELECTED_TECHS](state, data) {
    state.facilitySelectedTechs = data;
  },
};

const getters = {
  facilityData: state => {
    return state.facilityData;
  },
  facilityResponseData: state => {
    return state.facilityResponseData;
  },
  facilitySelectedTechs: state => {
    return state.facilitySelectedTechs;
  },
};

const actions = {
  fetchFacilityData({ commit, state }) {
    const urls = ['station/generator_registry.json'];
    // const urls = ['facility/facility_registry.json'];

    getJSON(urls, false)
      .then((responses) => {
        console.log(responses[0].data)
        const transformedData = transformFacilityData(responses[0].data);
        commit(MutationTypes.FACILITY_DATA, transformedData);
      })
      .catch((e) => {
        // handleFetchError(e, commit);
      });
  },
  facilityResponseData({ commit, state }, data) {
    commit(MutationTypes.FACILITY_RESPONSE_DATA, data);
  },
  facilitySelectedTechs({ commit, state }, data) {
    commit(MutationTypes.FACILITY_SELECTED_TECHS, data);
  },
};

export default {
  state,
  mutations,
  getters,
  actions,
};
