import subDays from 'date-fns/subDays'
import subMonths from 'date-fns/subMonths'
import DateDisplay from '@/services/DateDisplay.js'

export function filterDatasetByRange(dataset, range) {
  if (range === '7D' || range === 'ALL') {
    return dataset // no need to filter
  }

  const latestDate = dataset[dataset.length - 1]
    ? dataset[dataset.length - 1].date
    : null

  if (latestDate) {
    let newStartDate = null
    if (range === '1D') {
      newStartDate = subDays(latestDate, 1)
    } else if (range === '3D') {
      newStartDate = subDays(latestDate, 3)
    } else if (range === '30D') {
      newStartDate = subDays(latestDate, 29)
    } else if (range === '1Y') {
      newStartDate = subMonths(latestDate, 12)
    }
    return dataset.filter(d => d.date >= newStartDate && d.date <= latestDate)
  }

  return dataset
}

export function filterDatasetByPeriod(dataset, interval, period) {
  if (period === 'All') {
    return dataset
  }
  const month = DateDisplay.getPeriodMonth(interval, period)
  return dataset.filter(d => {
    const dMonth = d.date.getMonth()
    return dMonth === month
  })
}
