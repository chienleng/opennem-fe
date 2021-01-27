export default function({ currentDataset, domains }) {
  currentDataset.forEach(d => {
    let total = 0
    let allNulls = true
    domains.forEach(domain => {
      const id = domain.id
      const value = d[id]
      if (value || value === 0) {
        allNulls = false
      }
      total += value || 0
    })

    d._total = allNulls ? null : total
  })
}
