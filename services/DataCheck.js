import parseISO from 'date-fns/parseISO'
import differenceInMinutes from 'date-fns/differenceInMinutes'
import differenceInDays from 'date-fns/differenceInDays'
import differenceInMonths from 'date-fns/differenceInMonths'
import differenceInQuarters from 'date-fns/differenceInQuarters'
import addMinutes from 'date-fns/addMinutes'
import addDays from 'date-fns/addDays'
import addMonths from 'date-fns/addMonths'
import addQuarters from 'date-fns/addQuarters'
import intervalParser from '@/plugins/intervalParser.js'
import dateDisplay from '@/services/DateDisplay.js'

export function checkPowerEnergyExists({ dataPower, dataEnergy }) {
  // check that data should not have both power and energy
  if (dataPower.length > 0 && dataEnergy.length > 0) {
    throw new Error(
      'Parsing json error: data contains both power and energy',
      dataPower,
      dataEnergy
    )
  }

  // check that at least power or energy exists
  if (dataPower.length === 0 && dataEnergy.length === 0) {
    throw new Error(
      'Parsing json error: data does not contain power or energy',
      dataPower,
      dataEnergy
    )
  }
}

export function checkHistoryObject(d) {
  const id = d.id
  const history = d.history

  // check if history exist
  if (!history) {
    console.error(`History is undefined for ${d.id}`)
  }

  const start = history.start
  const last = history.last
  const interval = history.interval
  const data = history.data
  let intervalObj = null

  // check if start exist
  if (!start) {
    console.error(`History start date is undefined for ${id}`)
  }
  // check if last exist
  if (!last) {
    console.error(`History last date is undefined for ${id}`)
  }
  // check if interval exist
  if (!interval) {
    console.error(`History interval is undefined for ${id}`)
  } else {
    // test parsing interval
    intervalObj = intervalParser(interval)
    if (!intervalObj) {
      console.error(`Invalid interval for ${id}: ${interval}`)
    }
  }
  // check if data exist
  if (!data) {
    console.error(`History data is undefined for ${id}`)
  } else {
    if (data.length === 0) {
      console.error(`History data is empty for ${id}`)
    } else {
      const intervalKey = intervalObj.key
      const intervalValue = intervalObj.value
      const startDate = parseISO(start)
      const lastDate = parseISO(last)
      let diff = 0

      switch (intervalKey) {
        case 'm':
          diff = differenceInMinutes(lastDate, startDate)
          break
        case 'd':
          diff = differenceInDays(lastDate, startDate)
          break
        case 'M':
          diff = differenceInMonths(lastDate, startDate)
          break
        case 'Q':
          diff = differenceInQuarters(lastDate, startDate)
          break
        default:
          console.warn(`${interval} interval not support for ${id}`)
      }

      // check if start, last, interval matches data length
      const dataLength = data.length
      const expectedLength =
        intervalValue === 5 ? diff / intervalValue : diff / intervalValue + 1
      if (dataLength !== expectedLength) {
        console.warn(`--${id}`)
        console.warn(
          'History data length does not match start, last and interval'
        )
        console.warn(
          `Data length: ${dataLength} (expected ${expectedLength}), start: ${start}, last: ${last}, interval: ${interval}`
        )
        console.warn(`----`)
      }
    }
  }
}

function getArrLength({
  intervalKey,
  intervalValue,
  start,
  last,
  includeLastPoint
}) {
  const plusCount = includeLastPoint ? 1 : 0
  switch (intervalKey) {
    case 'm':
      return differenceInMinutes(last, start) / intervalValue + plusCount
    case 'd':
      return differenceInDays(last, start) / intervalValue + 1
    case 'M':
      return differenceInMonths(last, start) / intervalValue + 1
    case 'Q':
      return differenceInQuarters(last, start) / intervalValue + 1
    default:
      return 0
  }
}

export function getStartEndNumInterval(dataObj) {
  const region = dataObj.region
  const includeLastPoint = region === 'WEM' ? true : false
  const history = dataObj.history
  if (!history) {
    throw new Error('No history object found')
  }
  const startDateTime = dateDisplay.getDateTimeWithoutTZ(history.start)
  const lastDateTime = dateDisplay.getDateTimeWithoutTZ(history.last)
  const interval = intervalParser(history.interval)
  const num = getArrLength({
    intervalKey: interval.key,
    intervalValue: interval.value,
    start: startDateTime,
    last: lastDateTime,
    includeLastPoint
  })

  return {
    start: startDateTime,
    end: lastDateTime,
    num,
    intervalKey: interval.key,
    intervalValue: interval.value
  }
}

export function checkIsSameInterval(interval, compareInterval) {
  return interval === compareInterval
}

export function incrementTime({ date, intervalKey, intervalValue }) {
  switch (intervalKey) {
    case 'm':
      return addMinutes(date, intervalValue)
    case 'd':
      return addDays(date, intervalValue)
    case 'M':
      return addMonths(date, intervalValue)
    case 'Q':
      return addQuarters(date, intervalValue)
    default:
      return null
  }
}
