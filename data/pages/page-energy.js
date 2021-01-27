import _includes from 'lodash.includes'
import { getEnergyRegions } from '@/constants/energy-regions.js'

export function getRegionsNetTotalDataset({ datasets }) {
  let domains = [],
    dataset = []

  if (datasets && datasets.length > 0) {
    const regions = datasets.map(d => d.region)
    domains = getEnergyRegions().filter(d => _includes(regions, d.id))
    dataset = datasets[0].dataset.map(d => {
      return {
        date: d.date,
        time: d.time
      }
    })

    datasets.forEach(regionData => {
      dataset.forEach((d, i) => {
        d[regionData.region] = regionData.dataset[i]._total
      })
    })
  }

  return {
    dataset,
    domains
  }
}
