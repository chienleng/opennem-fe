import { sum, rollups } from 'd3-array'

function reducer(a, domains) {
  let obj = {}
  let allNulls = true
  domains.forEach(domain => {
    const id = domain.id
    const total = sum(a, d => {
      const value = d[id]
      if (value || value === 0) {
        allNulls = false
      }
      return value
    })
    obj[id] = allNulls ? null : total
  })

  return obj
}

export default function(
  domains,
  data,
  isIncompleteStart,
  isIncompleteEnd,
  incompleteStartDate,
  incompleteEndDate
) {
  const entries = rollups(data, v => reducer(v, domains), d => d._rollUpDate)
  return entries.map((e, i) => {
    const object = {
      time: e[0],
      date: new Date(e[0]),
      _isIncompleteBucket: false
    }

    Object.keys(e[1]).forEach(k => {
      object[k] = e[1][k]
    })

    if (i === 0 && isIncompleteStart) {
      object._isIncompleteBucket = isIncompleteStart
      object._incompleteDate = incompleteStartDate
    }
    if (i === entries.length - 1 && isIncompleteEnd) {
      object._isIncompleteBucket = isIncompleteEnd
      object._incompleteDate = incompleteEndDate
    }

    return object
  })
}
