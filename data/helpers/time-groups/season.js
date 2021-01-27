import getMonth from 'date-fns/getMonth'
import getYear from 'date-fns/getYear'
import set from 'date-fns/set'
import addMonths from 'date-fns/addMonths'
import subMonths from 'date-fns/subMonths'
import isAfter from 'date-fns/isAfter'
import isBefore from 'date-fns/isBefore'

function getAUSeasonStartMonth(month) {
  switch (month) {
    case 11:
    case 0:
    case 1:
      return 11

    case 2:
    case 3:
    case 4:
      return 2

    case 5:
    case 6:
    case 7:
      return 5

    case 8:
    case 9:
    case 10:
      return 8

    default:
  }
  return null
}

function startOfSeason(date, currentMonth, seasonStartMonth) {
  if (currentMonth === 0 || currentMonth === 1) {
    return set(date, {
      month: seasonStartMonth,
      date: 1,
      year: getYear(date) - 1
    })
  }
  return set(date, { month: seasonStartMonth, date: 1 })
}

export default function(domains, data, rollUp) {
  let isIncompleteEnd = false,
    isIncompleteStart = false,
    incompleteStartDate = null,
    incompleteEndDate = null
  data.forEach((d, i) => {
    const currentMonth = getMonth(d.date)
    const seasonStartMonth = getAUSeasonStartMonth(currentMonth)
    const start = startOfSeason(d.date, currentMonth, seasonStartMonth)

    data[i]._rollUpDate = start.getTime()

    if (i == 0) {
      isIncompleteStart = isAfter(d.date, start)
      if (isIncompleteStart) {
        incompleteStartDate = d.date
      }
    }
    if (i === data.length - 1) {
      const end = subMonths(addMonths(start, 3), 1)
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
