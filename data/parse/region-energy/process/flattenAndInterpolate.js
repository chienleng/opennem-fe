import _cloneDeep from 'lodash.clonedeep'
import * as DT from '@/constants/data-types.js'
import dateDisplay from '@/services/DateDisplay.js'
import { checkIsSameInterval } from '@/services/DataCheck.js'
import interpolateDataset from './interpolateDataset.js'

function createTemporaryDataset(time, date, value) {
  return { time, date, value }
}

export default function(isPowerData, dataInterval, dataAll, datasetAll) {
  dataAll.forEach(d => {
    const isDifferentInterval = !checkIsSameInterval(
      dataInterval,
      d.history.interval
    )
    const updateDataset = () => {
      const historyData = [...d.history.data]
      datasetAll.forEach((h, i) => {
        h[d.id] = historyData[i]
      })
    }
    const updateDatasetWithMixedInterval = datasetMixed => {
      const type = {
        key: d.id,
        interpolation: d.type === 'price' ? 'step' : 'linear',
        startIndex: -1,
        currentValue: null
      }

      // create dataset of 5 min interval for this series
      const datasetMixed5min = []
      datasetMixed.forEach(dMixed => {
        const newObj = {
          time: dMixed.time,
          date: dMixed.date
        }
        newObj[d.id] = dMixed.value
        datasetMixed5min.push(newObj)

        let currentTime = dMixed.time
        for (let i = 1; i <= 5; i++) {
          currentTime += 300000
          const newObj = {
            time: currentTime,
            date: new Date(currentTime)
          }
          newObj[d.id] = null

          datasetMixed5min.push(newObj)
        }
      })

      // then interpolate the values between
      datasetMixed5min.forEach((dMixed5min, i) => {
        if (dMixed5min[type.key] !== null) {
          if (type.interpolation === 'linear') {
            if (type.startIndex === -1) {
              type.startIndex = i
            } else {
              const count = i - type.startIndex
              const addValue =
                (dMixed5min[type.key] - type.currentValue) / count
              for (let x = type.startIndex + 1; x <= i; x += 1) {
                datasetMixed5min[x][type.key] = type.currentValue + addValue
                type.currentValue = datasetMixed5min[x][type.key]
              }
              type.startIndex = i
            }
          }
          type.currentValue = dMixed5min[type.key]
        } else if (dMixed5min[type.key] === null) {
          if (type.interpolation === 'step') {
            dMixed5min[type.key] = type.currentValue
          }
        }
      })

      // finally apply the values to the actual dataset
      datasetAll.forEach(dAll => {
        const find = datasetMixed5min.find(dMixed => dMixed.time === dAll.time)
        if (find) {
          dAll[d.id] = find[d.id]
        } else {
          dAll[d.id] = null
        }
      })
    }

    // Extend when we have more mixed intervals in the dataset
    const update30mInto5mDataset = () => {
      let date = dateDisplay.getDateTimeWithoutTZ(d.history.start)
      let datasetForecast30m = []

      const dataset30m = d.history.data.map(value => {
        const currentTime = date.getTime()
        const obj = createTemporaryDataset(currentTime, date, value)
        date = new Date(currentTime + 1800000) // 30 mins
        return obj
      })

      if (d.forecast) {
        let dateForecast = dateDisplay.getDateTimeWithoutTZ(d.forecast.start)

        datasetForecast30m = d.forecast.data.map(value => {
          const currentTime = dateForecast.getTime()
          const obj = createTemporaryDataset(currentTime, dateForecast, value)
          dateForecast = new Date(currentTime + 1800000) // 30 mins
          return obj
        })
      }

      updateDatasetWithMixedInterval([...dataset30m, ...datasetForecast30m])
    }

    if (isPowerData) {
      if (isDifferentInterval) {
        if (d.history.interval === '30m') {
          update30mInto5mDataset()
        }
      } else {
        updateDataset()
      }
    } else {
      // assume energy json datas have same history intervals for now
      // TODO check start and end is the same.
      updateDataset()
    }
  })

  if (isPowerData) {
    const priceObj = dataAll.find(d => d.type === 'price')
    if (priceObj) {
      const priceId = priceObj.id
      // set up pos/neg properties
      datasetAll.forEach(d => {
        const priceValue = d[priceId]
        d[DT.PRICE_ABOVE_300] = priceValue > 300 ? priceValue : 0.001
        d[DT.PRICE_BELOW_0] = priceValue < 0 ? priceValue : -0.001
      })
    }

    interpolateDataset(dataAll, datasetAll)
  }
}
