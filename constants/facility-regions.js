export const FacilityRegions = [
  {
    id: 'all',
    abbr: 'All',
    label: 'All Regions',
    colour: '#e34a33'
  },
  {
    id: 'nem1',
    abbr: 'NEM',
    label: 'NEM',
    colour: '#e34a33'
  },
  {
    id: 'nsw1',
    abbr: 'NSW',
    label: 'New South Wales',
    colour: '#24CBF9'
  },
  {
    id: 'qld1',
    abbr: 'Qld',
    label: 'Queensland',
    colour: '#E71D36'
  },
  {
    id: 'sa1',
    abbr: 'SA',
    label: 'South Australia',
    colour: '#FF9F1C'
  },
  {
    id: 'tas1',
    abbr: 'Tas',
    label: 'Tasmania',
    colour: '#5F9E7D'
  },
  {
    id: 'vic1',
    abbr: 'Vic',
    label: 'Victoria',
    colour: '#183170'
  },
  {
    id: 'wem',
    abbr: 'WA',
    label: 'Western Australia',
    colour: '#000000'
  }
]

export function getNEMRegionArray() {
  return FacilityRegions.filter(r => r.id !== 'all' && r.id !== 'wem').map(
    r => r.id
  )
}

export function getRegionArray() {
  return FacilityRegions.filter(r => r.id !== 'all').map(r => r.id)
}
