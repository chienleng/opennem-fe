import _cloneDeep from 'lodash.clonedeep'
import PerfTime from '@/plugins/perfTime.js'
const perfTime = new PerfTime()

export default function({
  dataset,
  domainPowerEnergyGrouped,
  domainEmissionsGrouped,
  domainMarketValueGrouped
}) {
  perfTime.time()

  const groups = _cloneDeep(domainPowerEnergyGrouped)
  Object.keys(groups).forEach(key => {
    groups[key] = [
      ...groups[key],
      ...domainEmissionsGrouped[key],
      ...domainMarketValueGrouped[key]
    ]
  })

  dataset.forEach(d => {
    Object.keys(groups).forEach(key => {
      if (key !== 'Default') {
        const groupDomains = groups[key]
        groupDomains.forEach(g => {
          let groupValue = 0,
            allNulls = true
          g.domainIds.forEach(dId => {
            groupValue += d[dId]
            if (d[dId] || d[dId === 0]) {
              allNulls = false
            }
          })
          d[g.id] = allNulls ? null : groupValue
        })
      }
    })

    return d
  })
  perfTime.timeEnd('--- data.group (calculated all grouped values)')
}
