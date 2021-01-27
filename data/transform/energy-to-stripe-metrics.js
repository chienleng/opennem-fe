import startOfQuarter from 'date-fns/startOfQuarter'
import differenceInDays from 'date-fns/differenceInDays'
import addDays from 'date-fns/addDays'

export default function(
  dataset,
  datasetInflation,
  domainPowerEnergy,
  domainEmissions,
  domainTemperature,
  domainPrice,
  domainMarketValue,
  domainInflation,
  topUp,
  bucket
) {
  if (bucket) {
    const data = bucket.map(d => {
      const obj = createEmptyMetricObj(d.date, d.time)
      const find = dataset.find(x => x.time === d.time)
      return updateMetricObject(
        obj,
        find,
        datasetInflation,
        domainPowerEnergy,
        domainEmissions,
        domainTemperature,
        domainPrice,
        domainMarketValue,
        domainInflation
      )
    })

    return data
  }

  const data = dataset.map(d => {
    const obj = createEmptyMetricObj(d.date, d.time)
    return updateMetricObject(
      obj,
      d,
      datasetInflation,
      domainPowerEnergy,
      domainEmissions,
      domainTemperature,
      domainPrice,
      domainMarketValue,
      domainInflation
    )
  })

  if (data.length > 0 && topUp) {
    const lastDataDate = data[data.length - 1].date
    const last = new Date(lastDataDate.getFullYear(), 11, 31)
    const fillUp = differenceInDays(last, addDays(lastDataDate, 1))
    let cDate = lastDataDate
    for (let i = 1; i <= fillUp + 1; i++) {
      cDate = addDays(cDate, 1)
      data.push(createEmptyMetricObj(cDate, cDate.getTime()))
    }
  }

  return data
}

function createEmptyMetricObj(date, time) {
  return {
    date,
    time,
    carbonIntensity: null,
    renewablesProportion: null,
    windProportion: null,
    solarProportion: null,
    coalProportion: null,
    coal: null,
    gasProportion: null,
    gas: null,
    temperature: null,
    maxTemperature: null,
    importsExports: null,
    sumImportsExports: null,
    netInterconnectorFlow: null,
    price: null,
    inflatedPrice: null,
    windValue: null,
    solarValue: null,
    coalValue: null,
    hydroValue: null,
    gasValue: null
  }
}

function updateMetricObject(
  obj,
  d,
  datasetInflation,
  domainPowerEnergy,
  domainEmissions,
  domainTemperature,
  domainPrice,
  domainMarketValue,
  domainInflation
) {
  if (d) {
    let totalEmissions = 0,
      totalPowerEnergy = 0,
      temperature = null,
      maxTemperature = null,
      sumImportsExports = 0,
      hasImportsExportsValue = false,
      importsExports = null,
      hasEmissionsValue = false

    domainEmissions.forEach(domain => {
      if (d[domain.id] || d[domain.id] === 0) {
        hasEmissionsValue = true
      }
      totalEmissions += d[domain.id] || 0
    })

    domainTemperature.forEach(domain => {
      if (domain.type === 'temperature_mean') {
        temperature = d[domain.id]
      }
      if (domain.type === 'temperature_max') {
        maxTemperature = d[domain.id]
      }
    })

    domainPowerEnergy.forEach(domain => {
      const ft = domain.fuelTech
      const id = domain.id

      if (domain.category !== 'load' || ft === 'exports') {
        totalPowerEnergy += d[id] || 0
      }
      if (ft === 'imports' || ft === 'exports') {
        if (d[id] || d[id] === 0) {
          hasImportsExportsValue = true
        }
        sumImportsExports += d[id]
      }
    })

    const ei = hasEmissionsValue ? totalEmissions / totalPowerEnergy : null
    const isValidEI = Number.isFinite(ei)

    // if no value
    importsExports = hasImportsExportsValue
      ? sumImportsExports > 0
        ? 1
        : 0
      : null
    if (!hasImportsExportsValue) {
      sumImportsExports = null
    }

    const hasInflation = domainInflation && datasetInflation.length > 0
    let inflatedPrice = null

    if (hasInflation) {
      const startQ = startOfQuarter(d.date)
      const find = datasetInflation.find(dInflation => {
        return dInflation.time === startQ.getTime()
      })
      const lastIndex =
        datasetInflation[datasetInflation.length - 1][domainInflation.id]
      const inflationIndex = find ? find[domainInflation.id] : lastIndex

      if (inflationIndex || inflationIndex === 0) {
        inflatedPrice =
          d._volWeightedPrice || d._volWeightedPrice === 0
            ? (lastIndex / inflationIndex) * d._volWeightedPrice
            : null
      }
    }

    obj.carbonIntensity = isValidEI ? ei : null
    obj.renewablesProportion =
      d._totalDemandRenewablesPercentage < 0
        ? 0
        : d._totalDemandRenewablesPercentage
    obj.windProportion =
      d._totalDemandWindProportion < 0 ? 0 : d._totalDemandWindProportion
    obj.solarProportion =
      d._totalDemandSolarProportion < 0 ? 0 : d._totalDemandSolarProportion
    obj.coalProportion =
      d._totalDemandCoalProportion < 0 ? 0 : d._totalDemandCoalProportion
    obj.coal = d._totalCoal
    obj.gasProportion =
      d._totalDemandGasProportion < 0 ? 0 : d._totalDemandGasProportion
    obj.gas = d._totalGas
    obj.temperature = temperature
    obj.maxTemperature = maxTemperature
    obj.importsExports = importsExports
    obj.sumImportsExports = sumImportsExports
    obj.netInterconnectorFlow = d._totalDemandImportsExportsProportion
    obj.price = d._volWeightedPrice
    obj.inflatedPrice = inflatedPrice
    obj.coalValue = d._coalValue
    obj.windValue = d._windValue
    obj.solarValue = d._solarValue
    obj.hydroValue = d._hydroValue
    obj.gasValue = d._gasValue
  }

  return obj
}
