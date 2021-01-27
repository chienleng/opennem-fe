import _cloneDeep from 'lodash.clonedeep'

export default function(responses) {
  // combine multiple periods
  const firstResponse = responses[0]
  const data = _cloneDeep(firstResponse)

  responses.forEach((res, i) => {
    if (i > 0) {
      res.forEach(r => {
        const find = data.find(d => d.id === r.id)
        if (find) {
          find.history.last = r.history.last
          find.history.data = [...find.history.data, ...r.history.data]
        } else {
          // console.warn(`${r.id} is missing from other responses`)
          // create missing obj
          const missing = _cloneDeep(r)
          const newStart = firstResponse[0].history.start
          const newData = Array.from(
            Array(firstResponse[0].history.data.length),
            () => null
          )
          missing.history.start = newStart
          missing.history.data = [...newData, ...r.history.data]
          data.push(missing)
        }
      })
    }
  })

  return data
}
