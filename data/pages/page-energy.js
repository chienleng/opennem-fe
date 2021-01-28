import _includes from 'lodash.includes'
import { getEnergyRegions } from '@/constants/energy-regions.js'

export function getRegionDomains(datasets) {
  if (datasets && datasets.length > 0) {
    const regions = datasets.map(d => d.region)
    return getEnergyRegions().filter(d => _includes(regions, d.id))
  }

  return null
}

export function getRegionsNetTotalDataset(domains, datasets) {
  let dataset = []

  if (datasets && datasets.length > 0) {
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

    dataset.forEach(d => {
      let lowest = 0,
        highest = 0

      domains.forEach(domain => {
        if (d[domain.id] > highest) {
          highest = d[domain.id]
        }
        if (d[domain.id] < lowest) {
          lowest = d[domain.id]
        }
      })

      d._highest = highest
      d._lowest = lowest
    })
  }

  return dataset
}
