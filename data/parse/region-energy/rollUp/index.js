import timeGroups from '@/data/helpers/time-groups'
import energyRollUp from './energyRollUp'
import powerRollUp from './powerRollUp'

export default function({ domains, datasetFlat, interval }) {
  return timeGroups({
    domains,
    datasetFlat,
    interval,
    rollUp: interval === '30m' ? powerRollUp : energyRollUp
  })
}
