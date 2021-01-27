import parseISO from 'date-fns/parseISO'
import addDays from 'date-fns/addDays'
import subDays from 'date-fns/subDays'
import addMonths from 'date-fns/addMonths'
import endOfDay from 'date-fns/endOfDay'
import endOfMonth from 'date-fns/endOfMonth'
import differenceInSeconds from 'date-fns/differenceInSeconds'
import { timeFormat as d3TimeFormat } from 'd3-time-format'
import {
  timeMinute as d3TimeMinute,
  timeDay as d3TimeDay,
  timeMonday as d3TimeMonday,
  timeMonth as d3TimeMonth,
  timeYear as d3TimeYear
} from 'd3-time'

function getFormatStringDay(showYear) {
  return showYear ? '%a, %-d %b %Y' : '%a, %-d %b'
}

function getSeasonLabel(month) {
  switch (month) {
    case '3':
      return 'Autumn'
    case '6':
      return 'Winter'
    case '9':
      return 'Spring'
    case '12':
      return 'Summer'
  }
}

function getSeasonOffset(season) {
  switch (season) {
    case 'Autumn':
      return 2
    case 'Winter':
      return 5
    case 'Spring':
      return 8
    case 'Summer':
      return -1
  }
}

function getQuarterLabel(month) {
  switch (month) {
    case '1':
      return 'Q1'
    case '4':
      return 'Q2'
    case '7':
      return 'Q3'
    case '10':
      return 'Q4'
  }
}

function getQuarterOffset(quarter) {
  switch (quarter) {
    case 'Q1':
      return 0
    case 'Q2':
      return 3
    case 'Q3':
      return 6
    case 'Q4':
      return 9
  }
}

function getHalfYearOffset(period) {
  switch (period) {
    case '1st Half':
      return 0
    case '2nd Half':
      return 6
  }
}

function getMonthOffset(period) {
  switch (period) {
    case 'January':
      return 0
    case 'February':
      return 1
    case 'March':
      return 2
    case 'April':
      return 3
    case 'May':
      return 4
    case 'June':
      return 5
    case 'July':
      return 6
    case 'August':
      return 7
    case 'September':
      return 8
    case 'October':
      return 9
    case 'November':
      return 10
    case 'December':
      return 11
  }
}

function getSeasonClosestDate(date, isFloor, filterPeriod) {
  const isFilter = !filterPeriod || filterPeriod !== 'All'
  if (isFilter) {
    const yearDate = isFloor
      ? d3TimeYear.every(1).floor(date)
      : d3TimeYear.every(1).ceil(date)
    return d3TimeMonth.offset(yearDate, getSeasonOffset(filterPeriod))
  } else {
    const quarter = isFloor
      ? d3TimeMonth.every(3).floor(date)
      : d3TimeMonth.every(3).ceil(date)
    return d3TimeMonth.offset(quarter, -1)
  }
}

function getQuarterClosestDate(date, isFloor, filterPeriod) {
  const isFilter = !filterPeriod || filterPeriod !== 'All'
  if (isFilter) {
    const yearDate = isFloor
      ? d3TimeYear.every(1).floor(date)
      : d3TimeYear.every(1).ceil(date)
    return d3TimeMonth.offset(yearDate, getQuarterOffset(filterPeriod))
  } else {
    return isFloor
      ? d3TimeMonth.every(3).floor(date)
      : d3TimeMonth.every(3).ceil(date)
  }
}

function get6MonthClosestDate(date, isFloor, filterPeriod) {
  const isFilter = !filterPeriod || filterPeriod !== 'All'
  if (isFilter) {
    const yearDate = isFloor
      ? d3TimeYear.every(1).floor(date)
      : d3TimeYear.every(1).ceil(date)
    return d3TimeMonth.offset(yearDate, getHalfYearOffset(filterPeriod))
  } else {
    return isFloor
      ? d3TimeMonth.every(6).floor(date)
      : d3TimeMonth.every(6).ceil(date)
  }
}

function getMonthClosestDate(date, isFloor, filterPeriod) {
  const isFilter = !filterPeriod || filterPeriod !== 'All'
  if (isFilter) {
    const yearDate = isFloor
      ? d3TimeYear.every(1).floor(date)
      : d3TimeYear.every(1).ceil(date)
    return d3TimeMonth.offset(yearDate, getMonthOffset(filterPeriod))
  } else {
    return isFloor
      ? d3TimeMonth.every(1).floor(date)
      : d3TimeMonth.every(1).ceil(date)
  }
}

export default {
  specialDateFormats(
    time,
    range,
    interval,
    isStart,
    isEnd,
    showYear,
    showIntervalRange
  ) {
    const now = Date.now()
    const today = d3TimeFormat('%d/%m/%Y')(now)
    const fDate = d3TimeFormat('%d/%m/%Y')(time)
    const thisYear = d3TimeFormat('%Y')(now)
    const fYear = d3TimeFormat('%Y')(time)
    const sYear = showYear || thisYear !== fYear

    let display = ''
    let formatString = ''

    if (!time) {
      return '—'
    }

    switch (range) {
      case '30D':
        formatString = getFormatStringDay(sYear)
        display = d3TimeFormat(formatString)(time)
        break
      case '1Y':
        if (interval === 'Day') {
          formatString = getFormatStringDay(sYear)
          display = d3TimeFormat(formatString)(time)
        } else if (interval === 'Week') {
          formatString = '%-d %b %Y'
          const newTime = d3TimeMonday
            .every(1)
            .floor(time)
            .getTime()
          if (showIntervalRange) {
            const sixDayslater = newTime + 518400000

            // check year
            const startYear = new Date(time).getFullYear()
            const endYear = new Date(sixDayslater).getFullYear()

            const sDate =
              startYear === endYear
                ? d3TimeFormat('%-d')(newTime)
                : d3TimeFormat(formatString)(newTime)
            const eDate = d3TimeFormat(formatString)(sixDayslater)
            display = `${sDate} – ${eDate}`
          } else {
            if (isStart) {
              display = d3TimeFormat(formatString)(newTime)
            } else {
              const sixDayslater = time + 518400000
              display = d3TimeFormat(formatString)(sixDayslater)
            }
          }
        } else {
          display = d3TimeFormat('%b %Y')(time)
        }
        break
      case 'ALL':
        if (interval === 'Month') {
          display = d3TimeFormat('%b %Y')(time)
        } else if (interval === 'Season') {
          let seasonLabel = getSeasonLabel(d3TimeFormat('%-m')(time))
          let year = new Date(time).getFullYear()
          let nextYearStr = ''
          if (seasonLabel === 'Summer') {
            const nextyear = year + 1 + ''
            nextYearStr = `/${nextyear.substr(2, 2)}`
          }
          display = `${seasonLabel} ${year}${nextYearStr}` // eslint-disable-line
        } else if (interval === 'Quarter') {
          display = `${getQuarterLabel(
            d3TimeFormat('%-m')(time)
          )} ${d3TimeFormat('%Y')(time)}` // eslint-disable-line
        } else if (interval === 'Fin Year') {
          let finYearMonth = d3TimeFormat('%-m')(time)
          let finYear = d3TimeFormat('%y')(time)
          if (finYearMonth > 6) {
            finYear = d3TimeFormat('%y')(time + 31557600000)
          }
          display = `FY${finYear}`
        } else if (interval === 'Half Year') {
          const sixMonthsLater = time + 15552000000
          if (showIntervalRange) {
            display = `${d3TimeFormat('%b')(time)} – ${d3TimeFormat('%b %Y')(
              sixMonthsLater
            )}` // eslint-disable-line
          } else {
            if (isStart) {
              display = `${d3TimeFormat('%b %Y')(time)}` // eslint-disable-line
            } else {
              display = `${d3TimeFormat('%b %Y')(sixMonthsLater)}` // eslint-disable-line
            }
          }
        } else if (interval === 'Year') {
          display = d3TimeFormat('%Y')(time)
        } else {
          display = d3TimeFormat('%b %Y')(time)
        }
        break
      default:
        if (today === fDate) {
          formatString = 'Today at %-I:%M %p'
        } else if (thisYear === fYear) {
          formatString = '%-d %b, %-I:%M %p'
        } else {
          formatString = '%-d %b %Y, %-I:%M %p'
        }
        display = d3TimeFormat(formatString)(time)
    }

    return display
  },

  defaultDisplayDate(time) {
    const now = Date.now()
    const today = d3TimeFormat('%d/%m/%Y')(now)
    const fDate = d3TimeFormat('%d/%m/%Y')(time)
    const thisYear = d3TimeFormat('%Y')(now)
    const fYear = d3TimeFormat('%Y')(time)
    let formatString = ''

    if (today === fDate) {
      formatString = 'Today at %-I:%M %p'
    } else if (thisYear === fYear) {
      formatString = '%-d %b, %-I:%M %p'
    } else {
      formatString = '%-d %b %Y, %-I:%M %p'
    }
    return d3TimeFormat(formatString)(time)
  },

  snapToClosestInterval(interval, date, isLinear) {
    switch (interval) {
      case '5m':
        return d3TimeMinute.every(5).round(date)
      case '30m':
        return d3TimeMinute.every(30).round(date)
      case 'Day':
        return d3TimeDay.every(1).floor(date)
      case 'Week':
        // if (isLinear) {
        //   // is a smooth  line (not area), put point in middle of the week (thu)
        //   const day = date ? date.getDay() : null
        //   if (day > 0 && day < 4) {
        //     return timeThursday.every(1).ceil(date)
        //   }
        //   return timeThursday.every(1).floor(date)
        // }
        return d3TimeMonday.every(1).floor(date)
      case 'Month':
        return d3TimeMonth.every(1).floor(date)
      case 'Season':
        const quarter = d3TimeMonth.every(3).floor(date)
        return d3TimeMonth.offset(quarter, -1)
      case 'Quarter':
        return d3TimeMonth.every(3).floor(date)
      case 'Half Year':
        return d3TimeMonth.every(6).floor(date)
      case 'Fin Year':
        const year = d3TimeYear.every(1).floor(date)
        return d3TimeMonth.offset(year, -6)
      case 'Year':
        return d3TimeYear.every(1).floor(date)
      default:
        return date
    }
  },

  roundToClosestInterval(interval, filterPeriod, date, roundType) {
    const isFloor = roundType === 'floor'
    switch (interval) {
      case '5m':
        return d3TimeMinute.every(5).round(date)
      case '30m':
        return d3TimeMinute.every(30).round(date)
      case 'Day':
        return isFloor
          ? d3TimeDay.every(1).floor(date)
          : d3TimeDay.every(1).ceil(date)
      case 'Week':
        return isFloor
          ? d3TimeMonday.every(1).floor(date)
          : d3TimeMonday.every(1).ceil(date)
      case 'Month':
        return getMonthClosestDate(date, isFloor, filterPeriod)
      case 'Season':
        return getSeasonClosestDate(date, isFloor, filterPeriod)
      case 'Quarter':
        return getQuarterClosestDate(date, isFloor, filterPeriod)
      case 'Half Year':
        return get6MonthClosestDate(date, isFloor, filterPeriod)
      case 'Fin Year':
        const year = isFloor
          ? d3TimeYear.every(1).floor(date)
          : d3TimeYear.every(1).ceil(date)
        return d3TimeMonth.offset(year, -6)
      case 'Year':
        return isFloor
          ? d3TimeYear.every(1).floor(date)
          : d3TimeYear.every(1).ceil(date)
      default:
        return date
    }
  },

  weekendGuides(datasetStart, datasetEnd) {
    const guides = []
    let dStart = datasetStart
    const dEnd = datasetEnd
    const checkWeekend = d3TimeFormat('%a')

    while (dStart <= dEnd) {
      if (checkWeekend(dStart) === 'Sat') {
        guides.push({
          start: dStart,
          end: dStart + 86400000 + 86400000
        })
      }
      dStart = dStart + 86400000
    }
    return guides
  },

  nightGuides(datasetStart, datasetEnd) {
    const guides = []
    let dStart = subDays(new Date(datasetStart), 1).getTime()
    const dEnd = datasetEnd

    while (dStart <= dEnd) {
      const startTime = new Date(dStart)
      startTime.setHours(22)
      startTime.setMinutes(0)
      const endTime = new Date(startTime.getTime() + 32400000)
      guides.push({
        start: startTime,
        end: endTime
      })
      dStart = dStart + 86400000
    }
    return guides
  },

  mutateMonthDate(date, month, filterPeriod) {
    if (filterPeriod === 'January' && month === 0) {
      date.setFullYear(date.getFullYear() - 1)
    } else if (filterPeriod === 'February' && month >= 0 && month <= 1) {
      date.setFullYear(date.getFullYear() - 1)
    } else if (filterPeriod === 'March' && month >= 0 && month <= 2) {
      date.setFullYear(date.getFullYear() - 1)
    } else if (filterPeriod === 'April' && month >= 0 && month <= 3) {
      date.setFullYear(date.getFullYear() - 1)
    } else if (filterPeriod === 'May' && month >= 0 && month <= 4) {
      date.setFullYear(date.getFullYear() - 1)
    } else if (filterPeriod === 'June' && month >= 0 && month <= 5) {
      date.setFullYear(date.getFullYear() - 1)
    } else if (filterPeriod === 'July' && month >= 0 && month <= 6) {
      date.setFullYear(date.getFullYear() - 1)
    } else if (filterPeriod === 'August' && month >= 0 && month <= 7) {
      date.setFullYear(date.getFullYear() - 1)
    } else if (filterPeriod === 'September' && month >= 0 && month <= 8) {
      date.setFullYear(date.getFullYear() - 1)
    } else if (filterPeriod === 'October' && month >= 0 && month <= 9) {
      date.setFullYear(date.getFullYear() - 1)
    } else if (filterPeriod === 'November' && month >= 0 && month <= 10) {
      date.setFullYear(date.getFullYear() - 1)
    } else if (filterPeriod === 'December' && month >= 0 && month <= 11) {
      date.setFullYear(date.getFullYear() - 1)
    }
    date.setDate(1)
    return date
  },

  mutateSeasonDate(date, month, filterPeriod) {
    if (filterPeriod === 'Summer' && month !== 11) {
      date.setFullYear(date.getFullYear() - 1)
    } else if (filterPeriod === 'Autumn' && month >= 0 && month <= 1) {
      date.setFullYear(date.getFullYear() - 1)
    } else if (filterPeriod === 'Winter' && month >= 0 && month <= 5) {
      date.setFullYear(date.getFullYear() - 1)
    } else if (filterPeriod === 'Spring' && month >= 0 && month <= 8) {
      date.setFullYear(date.getFullYear() - 1)
    }
    return date
  },

  mutateQuarterDate(date, month, filterPeriod) {
    if (filterPeriod === 'Q2' && month >= 0 && month <= 2) {
      date.setFullYear(date.getFullYear() - 1)
    } else if (filterPeriod === 'Q3' && month >= 0 && month <= 6) {
      date.setFullYear(date.getFullYear() - 1)
    } else if (filterPeriod === 'Q4' && month >= 0 && month <= 9) {
      date.setFullYear(date.getFullYear() - 1)
    }
    return date
  },

  mutateHalfYearDate(date, month, filterPeriod) {
    if (filterPeriod === '2nd Half' && month >= 0 && month <= 6) {
      date.setFullYear(date.getFullYear() - 1)
    }
    return date
  },

  getPeriodMonth(interval, period) {
    if (interval === 'Month') {
      switch (period) {
        case 'January':
          return 0
        case 'February':
          return 1
        case 'March':
          return 2
        case 'April':
          return 3
        case 'May':
          return 4
        case 'June':
          return 5
        case 'July':
          return 6
        case 'August':
          return 7
        case 'September':
          return 8
        case 'October':
          return 9
        case 'November':
          return 10
        case 'December':
          return 11
      }
    }

    if (interval === 'Quarter') {
      switch (period) {
        case 'Q1':
          return 0
        case 'Q2':
          return 3
        case 'Q3':
          return 6
        case 'Q4':
          return 9
      }
    }

    if (interval === 'Season') {
      switch (period) {
        case 'Summer':
          return 11
        case 'Autumn':
          return 2
        case 'Winter':
          return 5
        case 'Spring':
          return 8
      }
    }

    if (interval === 'Half Year') {
      switch (period) {
        case '1st Half':
          return 0
        case '2nd Half':
          return 6
      }
    }
  },

  getDateTimeWithoutTZ(date) {
    const dateString = date.substring(0, 16)
    return parseISO(dateString)
  },

  getSecondsByInterval(range, interval, date, incompleteDate, isStart, isEnd) {
    let start, end
    switch (interval) {
      case 'Day':
        start = date
        end = endOfDay(date)

        return differenceInSeconds(end, start)

      case 'Week':
        if (isStart && incompleteDate) {
          start = incompleteDate
          end = endOfDay(addDays(date, 6))
        } else if (isEnd && incompleteDate) {
          start = date
          end = endOfDay(incompleteDate)
        } else {
          start = date
          end = endOfDay(addDays(date, 6))
        }
        return differenceInSeconds(end, start)

      case 'Month':
        if (isStart && incompleteDate) {
          start = incompleteDate
          end = endOfMonth(date)
        } else if (isEnd && incompleteDate) {
          start = date
          end =
            range === '1Y'
              ? endOfDay(incompleteDate)
              : endOfMonth(incompleteDate)
        } else {
          start = date
          end = endOfMonth(date)
        }

        return differenceInSeconds(end, start)

      case 'Season':
      case 'Quarter':
        if (isStart && incompleteDate) {
          start = incompleteDate
          end = endOfMonth(addMonths(date, 2))
        } else if (isEnd && incompleteDate) {
          start = date
          end = endOfMonth(incompleteDate)
        } else {
          start = date
          end = endOfMonth(addMonths(date, 2))
        }

        return differenceInSeconds(end, start)

      case 'Half Year':
        if (isStart && incompleteDate) {
          start = incompleteDate
          end = endOfMonth(addMonths(date, 5))
        } else if (isEnd && incompleteDate) {
          start = date
          end = endOfMonth(incompleteDate)
        } else {
          start = date
          end = endOfMonth(addMonths(date, 5))
        }

        return differenceInSeconds(end, start)

      case 'Fin Year':
        if (isStart && incompleteDate) {
          start = incompleteDate
          end = endOfMonth(addMonths(date, 11))
        } else if (isEnd && incompleteDate) {
          start = date
          end = endOfMonth(incompleteDate)
        } else {
          start = date
          end = endOfMonth(addMonths(date, 11))
        }

        return differenceInSeconds(end, start)

      case 'Year':
        if (isStart && incompleteDate) {
          start = incompleteDate
          end = endOfMonth(addMonths(date, 11))
        } else if (isEnd && incompleteDate) {
          start = date
          end = endOfMonth(incompleteDate)
        } else {
          start = date
          end = endOfMonth(addMonths(date, 11))
        }

        return differenceInSeconds(end, start)

      default:
        return 0
    }
  }
}
