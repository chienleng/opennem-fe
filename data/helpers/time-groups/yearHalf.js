import getMonth from 'date-fns/getMonth'
import set from 'date-fns/set'
import addMonths from 'date-fns/addMonths'
import subMonths from 'date-fns/subMonths'
import isAfter from 'date-fns/isAfter'
import isBefore from 'date-fns/isBefore'

export function getHalfYearStartMonth(month) {
  switch (month) {
    case 0:
    case 1:
    case 2:
    case 3:
    case 4:
    case 5:
      return 0

    case 6:
    case 7:
    case 8:
    case 9:
    case 10:
    case 11:
      return 6

    default:
  }
  return null
}

function startOfHalfYear(date, halfYearStartMonth) {
  return set(date, { month: halfYearStartMonth, date: 1 })
}

export default function(domains, data, rollUp) {
  let isIncompleteEnd = false,
    isIncompleteStart = false,
    incompleteStartDate = null,
    incompleteEndDate = null
  data.forEach((d, i) => {
    const halfYearStartMonth = getHalfYearStartMonth(getMonth(d.date))
    const start = startOfHalfYear(d.date, halfYearStartMonth)

    data[i]._rollUpDate = start.getTime()

    if (i == 0) {
      isIncompleteStart = isAfter(d.date, start)
      if (isIncompleteStart) {
        incompleteStartDate = d.date
      }
    }
    if (i === data.length - 1) {
      const end = subMonths(addMonths(start, 6), 1)
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
