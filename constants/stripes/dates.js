import eachYearOfInterval from 'date-fns/eachYearOfInterval'
import eachMonthOfInterval from 'date-fns/eachMonthOfInterval'
import eachDayOfInterval from 'date-fns/eachDayOfInterval'

const METRICS_START_YEAR = 2010
const METRICS_START_MONTH = 10 // 0 - Jan, 11 - Dec

export const getEachYearOfInterval = eachYearOfInterval({
  start: new Date(METRICS_START_YEAR, 0, 1),
  end: new Date()
}).map(d => d.getFullYear())

export const getEachDayOfInterval = year => {
  return eachDayOfInterval({
    start: new Date(year, 0, 1),
    end: new Date(year, 11, 31)
  }).map(d => {
    return {
      date: d,
      time: d.getTime()
    }
  })
}

export const getEachMonthOfInterval = () => {
  return eachMonthOfInterval({
    start: new Date(METRICS_START_YEAR, METRICS_START_MONTH, 1),
    end: new Date() // to Now
  }).map(d => {
    return {
      date: d,
      time: d.getTime()
    }
  })
}
