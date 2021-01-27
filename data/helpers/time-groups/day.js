import startOfDay from 'date-fns/startOfDay'

export default function(domains, data, rollUp) {
  data.forEach((d, i) => {
    data[i]._rollUpDate = startOfDay(d.date).getTime()
  })
  return rollUp(domains, data)
}
