import startOfMonth from 'date-fns/startOfMonth'
import startOfYear from 'date-fns/startOfYear'
import endOfYear from 'date-fns/endOfYear'
import isAfter from 'date-fns/isAfter'
import isBefore from 'date-fns/isBefore'

export default function(domains, data, rollUp) {
  let isIncompleteEnd = false,
    isIncompleteStart = false,
    incompleteStartDate = null,
    incompleteEndDate = null
  data.forEach((d, i) => {
    const start = startOfYear(d.date)
    data[i]._rollUpDate = start.getTime()

    if (i == 0) {
      isIncompleteStart = isAfter(d.date, start)
      if (isIncompleteStart) {
        incompleteStartDate = d.date
      }
    }
    if (i === data.length - 1) {
      const end = startOfMonth(endOfYear(d.date))
      isIncompleteEnd = isBefore(d.date, end)
      if (isIncompleteEnd) {
        incompleteEndDate = d.date
      }
    }
  })
  return rollUp(
    domains,
    data,
    isIncompleteStart,
    isIncompleteEnd,
    incompleteStartDate,
    incompleteEndDate
  )
}
