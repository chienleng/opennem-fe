import _cloneDeep from 'lodash.clonedeep'

export const ENERGY_AU = 'au'
export const ENERGY_NEM = 'nem'
export const ENERGY_NSW = 'nsw1'
export const ENERGY_QLD = 'qld1'
export const ENERGY_SA = 'sa1'
export const ENERGY_TAS = 'tas1'
export const ENERGY_VIC = 'vic1'
export const ENERGY_WEM = 'wem'

const EnergyRegions = [
  {
    id: ENERGY_AU,
    abbr: 'All',
    label: 'All Regions',
    colour: '#e34a33',
    timezoneString: 'AEST',
    regions: [
      ENERGY_NSW,
      ENERGY_QLD,
      ENERGY_SA,
      ENERGY_TAS,
      ENERGY_VIC,
      ENERGY_WEM
    ]
  },
  {
    id: ENERGY_NEM,
    abbr: 'NEM',
    label: 'NEM',
    colour: '#e34a33',
    timezoneString: 'AEST',
    regions: [ENERGY_NSW, ENERGY_QLD, ENERGY_SA, ENERGY_TAS, ENERGY_VIC]
  },
  {
    id: ENERGY_NSW,
    abbr: 'NSW',
    label: 'New South Wales',
    colour: '#24CBF9',
    timezoneString: 'AEST',
    parentRegion: ENERGY_NEM,
    parentFirstChild: true
  },
  {
    id: ENERGY_QLD,
    abbr: 'Qld',
    label: 'Queensland',
    colour: '#E71D36',
    timezoneString: 'AEST',
    parentRegion: ENERGY_NEM
  },
  {
    id: ENERGY_SA,
    abbr: 'SA',
    label: 'South Australia',
    colour: '#FF9F1C',
    timezoneString: 'AEST',
    parentRegion: ENERGY_NEM
  },
  {
    id: ENERGY_TAS,
    abbr: 'Tas',
    label: 'Tasmania',
    colour: '#5F9E7D',
    timezoneString: 'AEST',
    parentRegion: ENERGY_NEM
  },
  {
    id: ENERGY_VIC,
    abbr: 'Vic',
    label: 'Victoria',
    colour: '#183170',
    timezoneString: 'AEST',
    parentRegion: ENERGY_NEM,
    parentLastChild: true
  },
  {
    id: ENERGY_WEM,
    abbr: 'WA',
    label: 'Western Australia (SWIS)',
    colour: '#000000',
    timezoneString: 'AWST'
  }
]

export function getEnergyRegions() {
  return _cloneDeep(EnergyRegions).map(d => {
    d.domain = d.id
    return d
  })
}

export function getEnergyRegionLabel(id) {
  const find = EnergyRegions.find(r => r.id === id)
  return find ? find.label : ''
}

export function isValidRegion(id) {
  // if (id === ENERGY_AU) return false
  const find = EnergyRegions.find(r => r.id === id)
  return find ? true : false
}
