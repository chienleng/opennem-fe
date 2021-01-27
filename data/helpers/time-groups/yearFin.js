import getQuarter from 'date-fns/getQuarter'
import set from 'date-fns/set'
import addYears from 'date-fns/addYears'
import subYears from 'date-fns/subYears'
import subMonths from 'date-fns/subMonths'
import isAfter from 'date-fns/isAfter'
import isBefore from 'date-fns/isBefore'

function startOfFinYear(date, quarter) {
  // 1, 2 quarter should be -1 year in july
  // 3, 4 quarter should this year in july
  const start = set(date, { month: 6, date: 1 })
  return quarter === 1 || quarter === 2 ? subYears(start, 1) : start
}

export default function(domains, data, rollUp) {
  let isIncompleteEnd = false,
    isIncompleteStart = false,
    incompleteStartDate = null,
    incompleteEndDate = null
  data.forEach((d, i) => {
    const quarter = getQuarter(d.date)
    const start = startOfFinYear(d.date, quarter)

    data[i]._rollUpDate = start.getTime()

    if (i == 0) {
      isIncompleteStart = isAfter(d.date, start)
      if (isIncompleteStart) {
        incompleteStartDate = d.date
      }
    }
    if (i === data.length - 1) {
      const end = subMonths(addYears(start, 1), 1)
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
