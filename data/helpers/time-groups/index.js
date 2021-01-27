import timeGroup30m from './30m.js'
import timeGroupDay from './day.js'
import timeGroupWeek from './week.js'
import timeGroupMonth from './month.js'
import timeGroupSeason from './season.js'
import timeGroupQuarter from './quarter.js'
import timeGroupYearHalf from './yearHalf.js'
import timeGroupYearFin from './yearFin.js'
import timeGroupYear from './year.js'
import PerfTime from '@/plugins/perfTime.js'

const perfTime = new PerfTime()

export default function({ domains, datasetFlat, interval, rollUp }) {
  perfTime.time()
  let rolled = datasetFlat
  switch (interval) {
    case '30m':
      rolled = timeGroup30m(domains, datasetFlat, rollUp)
      break
    case 'Day':
      rolled = timeGroupDay(domains, datasetFlat, rollUp)
      break
    case 'Week':
      rolled = timeGroupWeek(domains, datasetFlat, rollUp)
      break
    case 'Month':
      rolled = timeGroupMonth(domains, datasetFlat, rollUp)
      break
    case 'Season':
      rolled = timeGroupSeason(domains, datasetFlat, rollUp)
      break
    case 'Quarter':
      rolled = timeGroupQuarter(domains, datasetFlat, rollUp)
      break
    case 'Half Year':
      rolled = timeGroupYearHalf(domains, datasetFlat, rollUp)
      break
    case 'Fin Year':
      rolled = timeGroupYearFin(domains, datasetFlat, rollUp)
      break
    case 'Year':
      rolled = timeGroupYear(domains, datasetFlat, rollUp)
      break
    default:
  }
  perfTime.timeEnd(`--- data.rollUp.${interval}`)
  return rolled
}
