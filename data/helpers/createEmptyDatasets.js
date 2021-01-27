import { getStartEndNumInterval, incrementTime } from '@/services/DataCheck.js'

export default function(data) {
  if (data.length <= 0 || (data.length > 0 && !data[0].history)) {
    return []
  }

  const { start, num, intervalKey, intervalValue } = getStartEndNumInterval(
    data[0]
  )
  const datasetFlat = []
  let currentDate = start
  for (let i = 1; i <= num; i++) {
    datasetFlat.push({
      date: currentDate,
      time: currentDate.getTime()
    })
    currentDate = incrementTime({
      date: currentDate,
      intervalKey,
      intervalValue
    })
  }
  return datasetFlat
}
