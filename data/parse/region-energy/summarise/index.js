import * as FT from '@/constants/energy-fuel-techs/group-default.js'
import PerfTime from '@/plugins/perfTime.js'
const perfTime = new PerfTime()

/*
  - Mutate and summarise each data point
  - Reverse value for imports and load types
*/
export default function({
  isEnergyType,
  currentDataset,
  datasetInflation,
  domainPowerEnergy,
  domainEmissions,
  domainPrice,
  domainInflation
}) {
  perfTime.time()

  const dataset = currentDataset

  dataset.forEach((d, i) => {
    let batteryChargingId = null,
      batteryDischargingId = null,
      hydroId = null,
      pumpsId = null,
      exportsId = null,
      importsId = null
    let totalDemand = 0,
      totalEnergyForPercentageCalculation = 0,
      totalSources = 0,
      totalGeneration = 0,
      totalNetGeneration = 0,
      min = 0,
      lowest = 0,
      highest = 0,
      totalEmissionsVol = 0,
      totalRenewables = 0,
      totalMarketValue = 0,
      totalCoal = 0,
      totalCoalValue = 0,
      totalGas = 0,
      totalGasValue = 0,
      totalWind = 0,
      totalWindValue = 0,
      totalSolar = 0,
      totalSolarValue = 0,
      totalHydro = 0,
      totalHydroValue = 0,
      totalImportsExports = 0,
      hasRenewables = false,
      hasCoal = false,
      hasCoalValue = false,
      hasGas = false,
      hasGasValue = false,
      hasWind = false,
      hasWindValue = false,
      hasSolar = false,
      hasSolarValue = false,
      hasHydro = false,
      hasHydroValue = false,
      hasImportsExports = false,
      hasValueForPercentageCalculation = false

    domainPowerEnergy.forEach(domain => {
      const id = domain.id
      const ft = domain.fuelTech

      if (FT.isNetFuelTech(ft)) {
        if (ft === FT.BATTERY_CHARGING) batteryChargingId = id
        if (ft === FT.BATTERY_DISCHARGING) batteryDischargingId = id
        if (ft === FT.HYDRO) hydroId = id
        if (ft === FT.PUMPS) pumpsId = id
        if (ft === FT.EXPORTS) exportsId = id
        if (ft === FT.IMPORTS) importsId = id
      }

      if (d[id] > highest) {
        highest = d[id]
      }
      if (d[id] < lowest) {
        lowest = d[id]
      }
      d._highest = highest
      d._lowest = lowest
    })

    //  Derived net values
    dataset[i]._netBattery =
      (d[batteryDischargingId] || 0) - (d[batteryChargingId] || 0)
    dataset[i]._netHydro = (d[hydroId] || 0) - (d[pumpsId] || 0)
    dataset[i]._netImports = -(d[importsId] || 0) - (d[exportsId] || 0) // imports comes in as negative

    if (isNaN(dataset[i]._netBattery) || dataset[i]._netBattery < 0) {
      dataset[i]._netBattery = 0
    }
    if (isNaN(dataset[i]._netHydro) || dataset[i]._netHydro < 0) {
      dataset[i]._netHydro = 0
    }
    if (isNaN(dataset[i]._netImports) || dataset[i]._netImports < 0) {
      dataset[i]._netImports = 0
    }

    domainPowerEnergy.forEach(domain => {
      const id = domain.id
      const ft = domain.fuelTech

      if (domain.category === FT.SOURCE) {
        if (ft === FT.BATTERY_DISCHARGING) {
          totalNetGeneration += dataset[i]._netBattery
        } else if (ft === FT.HYDRO) {
          totalNetGeneration += dataset[i]._netHydro
        } else if (ft === FT.IMPORTS) {
          totalNetGeneration += dataset[i]._netImports
        } else {
          totalNetGeneration += d[id]
        }
      }
    })

    domainPowerEnergy.forEach(domain => {
      const id = domain.id
      const ft = domain.fuelTech

      if (domain.category === FT.LOAD || ft === FT.IMPORTS) {
        const negValue = -d[id]
        d[id] = negValue
      }

      if (domain.category === FT.SOURCE) {
        totalSources += d[id] || 0
      }

      if (domain.category === FT.SOURCE && ft !== FT.IMPORTS) {
        totalGeneration += d[id] || 0
      }

      if (domain.category !== FT.LOAD || ft === FT.EXPORTS) {
        totalEnergyForPercentageCalculation += d[id] || 0
      }

      if (domain.category === FT.SOURCE && ft !== FT.IMPORTS) {
        if (d[id] || d[id] === 0) {
          hasValueForPercentageCalculation = true
        }
      }

      if (domain.renewable) {
        if (d[id] || d[id] === 0) {
          hasRenewables = true
        }
        totalRenewables += d[id] || 0
      }

      if (FT.isCoal(ft)) {
        if (d[id] || d[id] === 0) {
          hasCoal = true
        }
        totalCoal += d[id] || 0
      }

      if (FT.isGas(ft)) {
        if (d[id] || d[id] === 0) {
          hasGas = true
        }
        totalGas += d[id] || 0
      }

      if (FT.isWind(ft)) {
        if (d[id] || d[id] === 0) {
          hasWind = true
        }
        totalWind += d[id] || 0
      }

      if (FT.isSolar(ft)) {
        if (d[id] || d[id] === 0) {
          hasSolar = true
        }
        totalSolar += d[id] || 0
      }

      if (FT.isHydro(ft)) {
        if (d[id] || d[id] === 0) {
          hasHydro = true
        }
        totalHydro += d[id] || 0
      }

      if (ft === FT.IMPORTS || ft === FT.EXPORTS) {
        if (d[id] || d[id] === 0) {
          hasImportsExports = true
        }
        totalImportsExports += d[id] || 0
      }

      totalDemand += d[id] || 0

      if (d[id] < 0) {
        min += d[id] || 0
      }
    })

    domainEmissions.forEach(domain => {
      totalEmissionsVol += d[domain.id] || 0
    })

    // calculate vol weighted pricing
    let allMarketValueNulls = true
    if (isEnergyType) {
      domainPrice.forEach(domain => {
        const id = domain.id
        const ft = domain.fuelTech

        totalMarketValue += d[id] || 0

        if (d[id] || d[id] === 0) {
          allMarketValueNulls = false
        }

        if (FT.isWind(ft)) {
          if (d[id] || d[id] === 0) {
            hasWindValue = true
          }
          totalWindValue += d[id]
        }

        if (FT.isCoal(ft)) {
          if (d[id] || d[id] === 0) {
            hasCoalValue = true
          }
          totalCoalValue += d[id]
        }

        if (FT.isGas(ft)) {
          if (d[id] || d[id] === 0) {
            hasGasValue = true
          }
          totalGasValue += d[id]
        }

        if (FT.isSolar(ft)) {
          if (d[id] || d[id] === 0) {
            hasSolarValue = true
          }
          totalSolarValue += d[id]
        }

        if (FT.isHydro(ft)) {
          if (d[id] || d[id] === 0) {
            hasHydroValue = true
          }
          totalHydroValue += d[id]
        }
      })
    }

    // null checks
    if (!hasRenewables) {
      totalRenewables = null
    }
    if (!hasCoal) {
      totalCoal = null
    }
    if (!hasCoalValue) {
      totalCoalValue = null
    }

    if (!hasGas) {
      totalGas = null
    }
    if (!hasGasValue) {
      totalGasValue = null
    }

    if (!hasWind) {
      totalWind = null
    }
    if (!hasWindValue) {
      totalWindValue = null
    }

    if (!hasSolar) {
      totalSolar = null
    }
    if (!hasSolarValue) {
      totalSolarValue = null
    }

    if (!hasHydro) {
      totalHydro = null
    }
    if (!hasHydroValue) {
      totalHydroValue = null
    }

    if (!hasImportsExports) {
      totalImportsExports = null
    }

    const volWeightedPrice = allMarketValueNulls
      ? null
      : totalMarketValue / totalDemand / 1000

    const nanCheck = value => {
      return isNaN(value) ? null : value
    }
    const validNumCheck = value => {
      return value || value === 0
    }
    const getAvValue = (value, generation) => {
      return validNumCheck(value) && validNumCheck(generation)
        ? value / generation / 1000
        : null
    }

    dataset[i]._total = totalDemand
    dataset[
      i
    ]._totalEnergyForPercentageCalculation = totalEnergyForPercentageCalculation
    dataset[i]._totalRenewables = totalRenewables

    dataset[i]._totalDemandRenewablesPercentage = hasRenewables
      ? nanCheck((totalRenewables / totalEnergyForPercentageCalculation) * 100)
      : null

    dataset[i]._totalGenerationRenewablesPercentage = nanCheck(
      (totalRenewables / totalGeneration) * 100
    )

    dataset[i]._totalCoal = totalCoal
    dataset[i]._totalDemandCoalProportion = hasCoal
      ? nanCheck((totalCoal / totalEnergyForPercentageCalculation) * 100)
      : null
    dataset[i]._coalValue = getAvValue(totalCoalValue, totalCoal)

    dataset[i]._totalGas = totalGas
    dataset[i]._totalDemandGasProportion = hasGas
      ? nanCheck((totalGas / totalEnergyForPercentageCalculation) * 100)
      : null
    dataset[i]._gasValue = getAvValue(totalGasValue, totalGas)

    dataset[i]._totalWind = totalWind
    dataset[i]._totalDemandWindProportion = hasWind
      ? nanCheck((totalWind / totalEnergyForPercentageCalculation) * 100)
      : null
    dataset[i]._windValue = getAvValue(totalWindValue, totalWind)

    dataset[i]._totalSolar = totalSolar
    dataset[i]._totalDemandSolarProportion = hasSolar
      ? nanCheck((totalSolar / totalEnergyForPercentageCalculation) * 100)
      : null
    dataset[i]._solarValue = getAvValue(totalSolarValue, totalSolar)

    dataset[i]._totalHydro = totalHydro
    dataset[i]._hydroValue = getAvValue(totalHydroValue, totalHydro)

    dataset[i]._totalImportsExports = totalImportsExports
    dataset[i]._totalDemandImportsExportsProportion =
      hasImportsExports && hasValueForPercentageCalculation
        ? nanCheck(
            (totalImportsExports / totalEnergyForPercentageCalculation) * 100
          )
        : null

    dataset[i]._totalSources = totalSources
    dataset[i]._totalGeneration = totalGeneration
    dataset[i]._totalNetGeneration = totalNetGeneration
    dataset[i]._totalSourcesRenewables = (totalRenewables / totalSources) * 100
    dataset[i]._totalGenerationRenewables =
      (totalRenewables / totalGeneration) * 100

    dataset[i]._stackedTotalMin = min
    dataset[i]._stackedTotalMax = totalDemand
    dataset[i]._totalEmissionsVol = totalEmissionsVol
    dataset[i]._stackedTotalEmissionsMin = 0
    dataset[i]._stackedTotalEmissionsMax = totalEmissionsVol
    dataset[i]._totalMarketValue = totalMarketValue

    dataset[i]._volWeightedPrice = isNaN(volWeightedPrice)
      ? null
      : volWeightedPrice

    dataset[i]._volWeightedPriceAbove300 =
      !isNaN(volWeightedPrice) && volWeightedPrice > 300
        ? volWeightedPrice
        : 0.01
    dataset[i]._volWeightedPriceBelow0 =
      !isNaN(volWeightedPrice) && volWeightedPrice < 0
        ? volWeightedPrice
        : -0.01
  })

  perfTime.timeEnd('--- data.summarise')
}
