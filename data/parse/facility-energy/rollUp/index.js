import timeGroups from '@/data/helpers/time-groups'
import powerRollUp from './powerRollUp'
import energyRollUp from './energyRollUp'

export default function({ domains, datasetFlat, interval, isEnergyType }) {
  return timeGroups({
    domains,
    datasetFlat,
    interval,
    rollUp: isEnergyType ? energyRollUp : powerRollUp
  })
}
