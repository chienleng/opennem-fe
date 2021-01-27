<template>
  <div class="summary-table">
    <dates-display
      :is-hovering="hoverOn"
      :hovered-date="hoveredDate"
      :focus-on="focusOn"
      :focus-date="focusDate ? focusDate.getTime() : null"
      :start-date="startDate"
      :end-date="endDate"
      :range="range"
      :interval="interval"
      :timezone-string="isEnergyType ? '' : regionTimezoneString"
    />

    <div class="summary-column-headers">
      <div class="summary-row">
        <div
          class="summary-col-label"
          style="padding-top: 3px;">
          <group-selector v-if="groupSelection" />
        </div>

        <div
          v-if="isEnergy"
          class="summary-col-energy">
          <span>
            Energy <small>{{ chartCurrentUnit }}</small>
          </span>
        </div>
        <div
          v-else
          class="summary-col-energy">
          <span v-if="hoverOn || focusOn">
            Power <small>{{ chartCurrentUnit }}</small>
          </span>
          <span v-else>
            Energy <small>GWh</small>
          </span>
        </div>

        <div
          class="summary-col-contribution contribution-toggle"
          @click="handlePercentContributionToClick">
          Contribution <small>to {{ percentContributionTo }}</small>
        </div>
        <div class="summary-col-av-value">
          <column-selector />
        </div>
      </div>

      <div class="summary-row">
        <div class="summary-col-label">Sources</div>

        <div
          v-if="isEnergy"
          class="summary-col-energy cell-value">
          <span v-if="hoverOn || focusOn">
            {{ pointSummarySources._total | convertValue(chartUnitPrefix, chartDisplayPrefix) | formatValue }}
          </span>
          <span v-else>
            {{ summarySources._totalEnergy | convertValue(chartUnitPrefix, chartDisplayPrefix) | formatValue }}
          </span>
        </div>
        <div
          v-else
          class="summary-col-energy cell-value">
          <span v-if="hoverOn || focusOn">
            {{ pointSummarySources._total | convertValue(chartUnitPrefix, chartDisplayPrefix) | formatValue }}
          </span>
          <span v-else>
            {{ summarySources._totalEnergy | formatValue }}
          </span>
        </div>

        <div class="summary-col-contribution cell-value" />
        <div
          v-if="!hoverOn && !focusOn"
          class="summary-col-av-value cell-value">
          <span v-if="isAvValueColumn">
            {{ summary._totalAverageValue | formatCurrency }}
          </span>
          <span v-if="isEmissionsVolumeColumn">
            {{ summary._totalEmissionsVolume | convertValue(chartEmissionsVolumeUnitPrefix, chartEmissionsVolumeDisplayPrefix) | formatValue }}
          </span>
          <span v-if="isEmissionsIntensityColumn">
            {{ summary._averageEmissionsIntensity | formatValue }}
          </span>
        </div>
        <div
          v-if="hoverOn || focusOn"
          class="summary-col-av-value cell-value">
          <span v-if="isAvValueColumn">
            {{ pointSummary._totalAverageValue | formatCurrency }}
          </span>
          <span v-if="isEmissionsVolumeColumn">
            {{ pointSummary._totalEmissionsVolume | convertValue(chartEmissionsVolumeUnitPrefix, chartEmissionsVolumeDisplayPrefix) | formatValue }}
          </span>
          <span v-if="isEmissionsIntensityColumn">
            {{ pointSummary._emissionsIntensity | formatValue }}
          </span>
        </div>
      </div>
    </div>

    <items
      :group="'ft-sources'"
      :hidden-fuel-techs="hiddenSources"
      :original-order="sourcesOrder"
      :market-value-order="sourcesMarketValueOrder"
      :show-point-summary="hoverOn || focusOn"
      :point-summary="pointSummarySources"
      :point-summary-total="pointSummarySourcesTotal"
      :summary="summarySources"
      :summary-total="summarySourcesTotal"
      :domain-toggleable="domainToggleable"
      :energy-domains="energyDomains"
      :emissions-domains="emissionsDomains"
      :is-year-interval="isYearInterval"
      @update="handleSourcesOrderUpdate"
      @fuelTechsHidden="handleSourceFuelTechsHidden"
      @mouse-enter="handleMouseEnter"
      @mouse-leave="handleMouseLeave"
    />

    <div
      v-if="loadsOrder.length > 0"
      class="summary-column-headers">
      <div class="summary-row">
        <div class="summary-col-label">Loads</div>

        <div
          v-if="isEnergy"
          class="summary-col-energy cell-value">
          <span v-if="hoverOn || focusOn">
            {{ pointSummaryLoads._total | convertValue(chartUnitPrefix, chartDisplayPrefix) | formatValue }}
          </span>
          <span v-else>
            {{ summaryLoads._totalEnergy | convertValue(chartUnitPrefix, chartDisplayPrefix) | formatValue }}
          </span>
        </div>
        <div
          v-else
          class="summary-col-energy cell-value">
          <span v-if="hoverOn || focusOn">
            {{ pointSummaryLoads._total | convertValue(chartUnitPrefix, chartDisplayPrefix) | formatValue }}
          </span>
          <span v-else>
            {{ summaryLoads._totalEnergy | formatValue }}
          </span>
        </div>

        <div class="summary-col-contribution cell-value" />
        <div class="summary-col-av-value cell-value" />
      </div>
    </div>

    <items
      :group="'ft-loads'"
      :hidden-fuel-techs="hiddenLoads"
      :original-order="loadsOrder"
      :market-value-order="loadsMarketValueOrder"
      :show-point-summary="hoverOn || focusOn"
      :point-summary="pointSummaryLoads"
      :point-summary-total="pointSummary._totalEnergyForPercentageCalculation"
      :summary="summaryLoads"
      :summary-total="summary._totalEnergyForPercentageCalculation"
      :is-year-interval="isYearInterval"
      :energy-domains="energyDomains"
      :emissions-domains="emissionsDomains"
      @update="handleLoadsOrderUpdate"
      @fuelTechsHidden="handleLoadFuelTechsHidden"
      @mouse-enter="handleMouseEnter"
      @mouse-leave="handleMouseLeave"
    />

    <div
      v-if="loadsOrder.length > 0"
      class="summary-column-headers" >
      <div class="summary-row last-row">
        <div class="summary-col-label">Net</div>

        <div
          v-if="isEnergy"
          class="summary-col-energy cell-value">
          <span v-if="hoverOn || focusOn">
            {{ pointSummary._total | convertValue(chartUnitPrefix, chartDisplayPrefix) | formatValue }}
          </span>
          <span v-else>
            {{ summary._totalEnergy | convertValue(chartUnitPrefix, chartDisplayPrefix) | formatValue }}
          </span>
        </div>
        <div
          v-else
          class="summary-col-energy cell-value">
          <span v-if="hoverOn || focusOn">
            {{ pointSummary._total | convertValue(chartUnitPrefix, chartDisplayPrefix) | formatValue }}
          </span>
          <span v-else>
            {{ summary._totalEnergy | formatValue }}
          </span>
        </div>

        <div class="summary-col-contribution cell-value" />
        <div class="summary-col-av-value cell-value" />
      </div>
    </div>

    <div
      class="summary-column-headers renewable-row"
      @click.exact="handleRenewableRowClicked"
      @click.shift.exact="handleRenewableRowShiftClicked">
      <div class="summary-row last-row">
        <div class="summary-col-label">
          <div
            :class="{
              on: chartEnergyRenewablesLine,
              'alt-colour': useAltRenewablesLineColour
            }"
            class="renewable-line" />
          Renewables
        </div>

        <div
          v-if="isEnergy"
          class="summary-col-energy cell-value">
          <span>
            {{ renewablesValue | convertValue(chartUnitPrefix, chartDisplayPrefix) | formatValue }}
          </span>
        </div>
        <div
          v-else
          class="summary-col-energy cell-value">
          <span v-if="hoverOn || focusOn">
            {{ renewablesValue | convertValue(chartUnitPrefix, chartDisplayPrefix) | formatValue }}
          </span>
          <span v-else>
            {{ renewablesValue | formatValue }}
          </span>
        </div>

        <div
          v-if="!hoverOn && !focusOn"
          class="summary-col-contribution cell-value">
          {{ renewablesPercentage | percentageFormatNumber }}
        </div>
        <div
          v-if="hoverOn || focusOn"
          class="summary-col-contribution cell-value">
          {{ pointRenewablesPercentage | percentageFormatNumber }}
        </div>
        <div class="summary-col-av-value cell-value" />
      </div>
    </div>
  </div>
</template>

<script>
import _isEmpty from 'lodash.isempty'
import _cloneDeep from 'lodash.clonedeep'
import _includes from 'lodash.includes'
import { mapGetters } from 'vuex'
import { format as d3Format } from 'd3-format'
import differenceInMinutes from 'date-fns/differenceInMinutes'
import { energy_sum } from '@opennem/energy-tools'

import Data from '~/services/Data.js'
import Domain from '~/services/Domain.js'
import GroupSelector from '~/components/ui/FuelTechGroupSelector'
import ColumnSelector from '~/components/ui/SummaryColumnSelector'
import Items from './Items'
import DatesDisplay from './DatesDisplay'

export default {
  components: {
    GroupSelector,
    ColumnSelector,
    Items,
    DatesDisplay
  },

  props: {
    energyDomains: {
      type: Array,
      default: () => []
    },
    emissionsDomains: {
      type: Array,
      default: () => []
    },
    marketValueDomains: {
      type: Array,
      default: () => []
    },
    priceId: {
      type: String,
      default: () => ''
    },
    temperatureDomains: {
      type: Array,
      default: () => []
    },
    dataset: {
      type: Array,
      default: () => []
    },
    hiddenFuelTechs: {
      type: Array,
      default: () => []
    },
    hoverDate: {
      type: Date,
      default: () => null
    },
    hoverOn: {
      type: Boolean,
      default: () => false
    },
    focusDate: {
      type: Date,
      default: () => null
    },
    focusOn: {
      type: Boolean,
      default: () => false
    },
    temperatureId: {
      type: String,
      default: () => ''
    },
    range: {
      type: String,
      default: () => ''
    },
    interval: {
      type: String,
      default: () => ''
    },
    isEnergy: {
      type: Boolean,
      default: () => false
    },
    domainToggleable: {
      type: Boolean,
      default: () => true
    },
    groupSelection: {
      type: Boolean,
      default: () => true
    }
  },

  data() {
    return {
      summary: {},
      summarySources: {},
      summaryLoads: {},
      pointSummary: {},
      pointSummarySources: {},
      pointSummaryLoads: {},
      hiddenSources: [],
      hiddenLoads: [],
      hoveredTemperature: 0
    }
  },

  computed: {
    ...mapGetters({
      datasetFlat: 'regionEnergy/datasetFlat',
      domainPowerEnergyGrouped: 'regionEnergy/domainPowerEnergyGrouped',
      regionTimezoneString: 'regionEnergy/regionTimezoneString',
      isEnergyType: 'regionEnergy/isEnergyType',

      chartEnergyRenewablesLine:
        'chartOptionsPowerEnergy/chartEnergyRenewablesLine',

      chartEnergyUnit: 'chartOptionsPowerEnergy/chartEnergyUnit',
      chartEnergyUnitPrefix: 'chartOptionsPowerEnergy/chartEnergyUnitPrefix',
      chartEnergyDisplayPrefix:
        'chartOptionsPowerEnergy/chartEnergyDisplayPrefix',
      chartEnergyCurrentUnit: 'chartOptionsPowerEnergy/chartEnergyCurrentUnit',

      chartPowerUnit: 'chartOptionsPowerEnergy/chartPowerUnit',
      chartPowerUnitPrefix: 'chartOptionsPowerEnergy/chartPowerUnitPrefix',
      chartPowerDisplayPrefix:
        'chartOptionsPowerEnergy/chartPowerDisplayPrefix',
      chartPowerCurrentUnit: 'chartOptionsPowerEnergy/chartPowerCurrentUnit',

      chartEmissionsVolumeUnitPrefix:
        'chartOptionsEmissionsVolume/chartUnitPrefix',
      chartEmissionsVolumeDisplayPrefix:
        'chartOptionsEmissionsVolume/chartDisplayPrefix'
    }),

    chartUnit() {
      return this.isEnergy ? this.chartEnergyUnit : this.chartPowerUnit
    },
    chartUnitPrefix() {
      return this.isEnergy
        ? this.chartEnergyUnitPrefix
        : this.chartPowerUnitPrefix
    },
    chartDisplayPrefix() {
      return this.isEnergy
        ? this.chartEnergyDisplayPrefix
        : this.chartPowerDisplayPrefix
    },
    chartCurrentUnit() {
      return this.isEnergy
        ? this.chartEnergyCurrentUnit
        : this.chartPowerCurrentUnit
    },

    fuelTechGroupName() {
      return this.$store.getters.fuelTechGroupName
    },

    propRef() {
      return this.fuelTechGroupName === 'Default' ? 'fuelTech' : 'group'
    },

    percentContributionTo() {
      return this.$store.getters.percentContributionTo
    },

    showSummaryColumn() {
      return this.$store.getters.showSummaryColumn
    },

    isAvValueColumn() {
      return this.showSummaryColumn === 'av-value'
    },

    isEmissionsVolumeColumn() {
      return this.showSummaryColumn === 'emissions-volume'
    },

    isEmissionsIntensityColumn() {
      return this.showSummaryColumn === 'emissions-intensity'
    },

    sourcesOrderLength() {
      return this.energyDomains.filter(
        d => d.category === 'source' || d.category === 'load'
      ).length
    },

    sourcesOrder() {
      return this.energyDomains.filter(d => d.category === 'source')
    },

    loadsOrder() {
      return this.energyDomains.filter(d => d.category === 'load')
    },

    sourcesMarketValueOrder() {
      return this.marketValueDomains.filter(d => d.category === 'source')
    },

    loadsMarketValueOrder() {
      return this.marketValueDomains.filter(d => d.category === 'load')
    },

    renewablesValue() {
      const isSummary = !this.hoverOn && !this.focusOn
      const totalRenewables = isSummary
        ? this.dataset.reduce((a, b) => a + b._totalRenewables, 0)
        : this.pointSummary._totalRenewables
      const mins = this.interval === '30m' ? 30 : 5

      return this.isEnergy || !isSummary
        ? totalRenewables
        : (totalRenewables * mins) / 60 / 1000
    },

    renewablesPercentage() {
      const key =
        this.percentContributionTo === 'demand'
          ? '_totalEnergyForPercentageCalculation'
          : '_totalGeneration'
      let totalRenewables = this.dataset.reduce(
        (a, b) => a + b._totalRenewables,
        0
      )
      let total = this.dataset.reduce((a, b) => a + b[key], 0)

      const r = (totalRenewables / total) * 100
      const f = d3Format(',.3f')
      if (!isNaN(r)) {
        console.log(`***** Renewables: ${f(r)}%`)
      }
      return r
    },

    pointRenewablesPercentage() {
      const key =
        this.percentContributionTo === 'demand'
          ? '_totalEnergyForPercentageCalculation'
          : '_totalGeneration'
      const totalRenewables = this.pointSummary._totalRenewables
      const total = this.pointSummary[key]
      return (totalRenewables / total) * 100
    },

    pointSummarySourcesTotal() {
      if (this.percentContributionTo === 'demand') {
        return this.pointSummary._totalEnergyForPercentageCalculation
      } else {
        return this.pointSummarySources._totalGeneration
      }
    },

    summarySourcesTotal() {
      if (this.percentContributionTo === 'demand') {
        return this.summary._totalEnergyForPercentageCalculation
      } else {
        return this.summarySources._totalGeneration
      }
    },

    intervalMins() {
      const interval = this.interval
      if (interval === '30m') {
        return 30
      } else if (interval === 'Day') {
        return 60 * 24
      }
      // default 5 mins
      return 5
    },

    hoveredDate() {
      const item = this.pointSummary
      return item ? item.time : null
    },

    hoveredDateTime() {
      const item = this.pointSummary
      const date = item ? item.date : null
      return date ? new Date(date).toISOString() : ''
    },

    startDate() {
      const dataLength = this.dataset.length
      const startDate = dataLength > 0 ? this.dataset[0].time : null
      return startDate
    },

    startDateTime() {
      // const dataLength = this.dataset.length
      // const startDate = dataLength > 0 ? this.dataset[0].date : null
      return this.startDate ? new Date(this.startDate).toISOString() : ''
    },

    endDate() {
      const dataLength = this.dataset.length
      let whichIndex = 1
      // if (this.range === '30D' || this.range === '1Y' || this.range === 'ALL') {
      //   whichIndex = 2
      // }
      if (dataLength > 0) {
        const time = this.dataset[dataLength - whichIndex]
          ? this.dataset[dataLength - whichIndex].time
          : this.dataset[dataLength - 1].time
        const endDate = time
        return endDate
      } else {
        return null
      }
    },

    endDateTime() {
      // const dataLength = this.dataset.length
      // const endDate = dataLength > 0 ? this.dataset[dataLength - 1].date : null
      return this.endDate ? new Date(this.endDate).toISOString() : ''
    },

    isYearInterval() {
      return this.interval === 'Fin Year' || this.interval === 'Year'
    },

    useAltRenewablesLineColour() {
      return (
        this.fuelTechGroupName === 'Renewable/Fossil' ||
        this.fuelTechGroupName === 'Flexibility'
      )
    }
  },

  watch: {
    fuelTechGroupName() {
      // clear hidden fuel techs when grouping is changed
      this.hiddenSources = []
      this.hiddenLoads = []
      this.emitHiddenFuelTechs()

      if (this.focusOn) {
        this.updatePointSummary(this.focusDate)
      }
    },
    dataset(updated) {
      this.calculateSummary(updated)
    },
    energyDomains(updated) {
      this.calculateSummary(this.dataset)
    },
    marketValueDomains(updated) {
      this.calculateSummary(this.dataset)
    },
    hoverDate(date) {
      this.updatePointSummary(date)
    },
    hoverOn(on) {
      if (on) {
        this.updatePointSummary(this.hoverDate)
      } else if (this.focusOn) {
        this.updatePointSummary(this.focusDate)
      }
    },
    focusOn(on) {
      if (on) {
        this.updatePointSummary(this.focusDate)
      }
    },
    hiddenFuelTechs(updated) {
      this.calculateSummary(this.dataset)
    },
    percentContributionTo(updated) {
      this.calculateSummary(this.dataset)
    }
  },

  mounted() {
    let hiddenFuelTechs = this.hiddenFuelTechs

    // if all is hidden, then unhide all
    let hiddenLength = 0
    this.energyDomains.forEach(d => {
      if (_includes(hiddenFuelTechs, d[this.propRef])) {
        hiddenLength += 1
      }
    })

    if (this.energyDomains.length === hiddenLength) {
      this.hiddenSources = []
      this.hiddenLoads = []
      hiddenFuelTechs = []
    }

    this.$emit('fuelTechsHidden', hiddenFuelTechs)

    hiddenFuelTechs.forEach(fuelTech => {
      const find = this.energyDomains.find(
        domain => domain[this.propRef] === fuelTech
      )
      if (find) {
        if (find.category === 'source') {
          this.hiddenSources.push(fuelTech)
        } else {
          this.hiddenLoads.push(fuelTech)
        }
      }
    })
    this.calculateSummary(this.dataset)
  },

  methods: {
    calculateSummary(data) {
      // console.log('Calculate summary')
      if (data.length > 0) {
        const isGeneration = this.percentContributionTo === 'generation'
        let totalEnergy = 0
        let totalEnergyMinusHidden = 0
        let totalEnergyForPercentageCalculation = 0
        let totalPower = 0
        let totalPowerMinusHidden = 0
        let totalGenerationEnergyMinusHidden = 0
        let totalSources = 0
        let totalGeneration = 0
        let totalLoads = 0
        let totalPriceMarketValue = 0
        let totalEVMinusHidden = 0
        let totalEIMinusHidden = 0
        this.summary = {}
        this.summarySources = {}
        this.summaryLoads = {}

        const energySummary = data.map(d => {
          let p = 0
          this.energyDomains.forEach(ft => {
            p += d[ft.id] || 0
          })
          return p
        })
        const energySummaryTotal = energySummary.reduce((a, b) => a + b, 0)
        const volWeightPrice = energySummary.map((d, i) => {
          const price = data[i][this.priceId]
          return price * d
        })
        const volWeightPriceTotal = volWeightPrice.reduce((a, b) => a + b, 0)

        const dataEnergyMap = (ft, excludeHidden) => {
          return data.map(d => {
            const energy = {}
            const setEnergy = () => {
              if (this.isEnergy) {
                return d[ft.id]
              } else {
                // calculate energy (GWh) += power * 5mins/60/1000
                const mins = this.interval === '30m' ? 30 : 5
                return (d[ft.id] * mins) / 60 / 1000
              }
            }

            if (excludeHidden) {
              if (!_includes(this.hiddenFuelTechs, ft[this.propRef])) {
                energy[ft.id] = setEnergy()
              } else {
                energy[ft.id] = 0
              }
            } else {
              energy[ft.id] = setEnergy()
            }

            return energy
          })
        }
        const dataPowerMap = (ft, excludeHidden) => {
          return data.map(d => {
            const power = {}
            const setPower = () => {
              if (!this.isEnergy) {
                return d[ft.id]
              }
              return 0
            }

            if (excludeHidden) {
              if (!_includes(this.hiddenFuelTechs, ft[this.propRef])) {
                power[ft.id] = setPower()
              } else {
                power[ft.id] = 0
              }
            } else {
              power[ft.id] = setPower()
            }
            return power
          })
        }
        const sumMap = (ft, dataMap) => {
          return dataMap.reduce((prev, cur) => prev + cur[ft.id], 0)
        }

        // fetch original data
        const start = data[0]
        const end = data[data.length - 1]
        const startDate = start.date
        const endDate = end.date
        const fullDatasetFiltered = this.datasetFlat.filter(
          df => df.time >= start.time && df.time <= end.time
        )
        const bucketSizeMins = differenceInMinutes(endDate, startDate) + 1

        // Calculate Energy
        this.energyDomains.forEach(ft => {
          const category = ft.category
          const fullDomainData = fullDatasetFiltered.map(fd => fd[ft.id])
          const fullDomainDataMinusHidden = fullDatasetFiltered.map(
            fd =>
              _includes(this.hiddenFuelTechs, ft[this.propRef]) ? 0 : fd[ft.id]
          )

          const dataEnergy = dataEnergyMap(ft)
          const dataEnergyMinusHidden = dataEnergyMap(ft, true)

          // For Power, calculate using trapezoid, then convert to GWh
          const dataEnergySum = this.isEnergyType
            ? sumMap(ft, dataEnergy)
            : energy_sum(fullDomainData, bucketSizeMins) / 1000
          const dataEnergyMinusHiddenSum = this.isEnergyType
            ? sumMap(ft, dataEnergyMinusHidden)
            : energy_sum(fullDomainDataMinusHidden, bucketSizeMins) / 1000

          const dataPower = dataPowerMap(ft)
          const dataPowerMinusHidden = dataPowerMap(ft, true)
          const dataPowerSum = sumMap(ft, dataPower)
          const dataPowerMinusHiddenSum = sumMap(ft, dataPowerMinusHidden)

          let avValue = 0

          this.summary[ft.id] = dataEnergySum

          totalEnergy += dataEnergySum
          totalPower += dataPowerSum
          totalEnergyMinusHidden += dataEnergyMinusHiddenSum
          totalPowerMinusHidden += dataPowerMinusHiddenSum

          if (category !== 'load' || _includes(ft.id, 'exports')) {
            totalEnergyForPercentageCalculation += dataEnergySum
          }

          if (category === 'source') {
            this.summarySources[ft.id] = dataEnergySum
            totalSources += dataEnergySum
            if (!_includes(ft.id, 'imports')) {
              totalGeneration += dataEnergySum
            }
          } else if (category === 'load') {
            this.summaryLoads[ft.id] = dataEnergySum
            totalLoads += dataEnergySum
          }
        })

        // Calculate Emissions
        this.emissionsDomains.forEach(ft => {
          const category = ft.category
          const dataEVMinusHidden = data.map(d => {
            const emissionsVol = {}
            if (!_includes(this.hiddenFuelTechs, ft[this.propRef])) {
              if (
                !isGeneration ||
                (isGeneration &&
                  ft.fuelTech !== 'imports' &&
                  ft.fuelTech !== 'exports')
              ) {
                emissionsVol[ft.id] = d[ft.id]
              } else {
                emissionsVol[ft.id] = 0
              }
            } else {
              emissionsVol[ft.id] = 0
            }
            return emissionsVol
          })
          const evSum = sumMap(ft, dataEVMinusHidden)
          this.summary[ft.id] = evSum
          totalEVMinusHidden += evSum

          if (category === 'source') {
            this.summarySources[ft.id] = evSum
          } else if (category === 'load') {
            this.summaryLoads[ft.id] = evSum
          }
        })

        totalEIMinusHidden = data.reduce(
          (prev, cur) => prev + cur._emissionsIntensity,
          0
        )
        // Calculate Market Value for Energy
        // TODO: refactor price market value calcuation
        if (this.marketValueDomains.length > 0) {
          if (this.isEnergy) {
            this.marketValueDomains.forEach((ft, index) => {
              const category = ft.category
              let avValue = null
              let dataMarketValueSum = 0

              const dataMarketValue = data.map(d => {
                const marketValue = {}
                marketValue[ft.id] = d[ft.id]
                return marketValue
              })
              dataMarketValueSum = dataMarketValue.reduce(
                (prev, cur) => prev + cur[ft.id],
                0
              )
              const findEnergyEq = this.energyDomains.find(
                e => e[this.propRef] === ft[this.propRef]
              )
              if (!findEnergyEq) {
                console.error(
                  'There is an issue finding the energy fuel tech in market value calculations.'
                )
              }
              const ftTotal = this.summary[findEnergyEq.id]
              avValue = dataMarketValueSum / ftTotal / 1000

              this.summary[ft.id] = avValue
              totalPriceMarketValue += dataMarketValueSum

              if (category === 'source') {
                this.summarySources[ft.id] = avValue
              } else if (category === 'load') {
                this.summaryLoads[ft.id] = -avValue
              }
            })
          } else {
            let avValue = null

            this.energyDomains.forEach(domain => {
              const id = domain.id
              const ftPrice = data.map((p, pIndex) => {
                const price = data[pIndex][this.priceId]
                  ? data[pIndex][this.priceId]
                  : 0
                return Math.abs(p[id]) * price
              })
              const ftPriceTotal = ftPrice.reduce((a, b) => a + b, 0)
              avValue = ftPriceTotal / Math.abs(totalPower)
            })

            this.summary[this.priceId] = avValue

            avValue = null

            this.marketValueDomains.forEach(domain => {
              const category = domain.category
              const id = domain.id
              const findEnergyEq = this.energyDomains.find(
                e => e[this.propRef] === domain[this.propRef]
              )
              const ftId = findEnergyEq.id
              let avValue = null
              if (!findEnergyEq) {
                console.error(
                  'There is an issue finding the energy fuel tech in market value calculations.'
                )
              }
              const dataPowerTotal = data.reduce(
                (a, b) => a + (b[ftId] || 0),
                0
              )
              const ftPrice = data.map((p, pIndex) => {
                const price = data[pIndex][this.priceId]
                  ? data[pIndex][this.priceId]
                  : 0
                return Math.abs(p[ftId]) * price
              })

              const ftPriceTotal = ftPrice.reduce((a, b) => a + b, 0)
              avValue = ftPriceTotal / Math.abs(dataPowerTotal)

              this.summary[id] = avValue

              if (category === 'source') {
                this.summarySources[id] = avValue
              } else if (category === 'load') {
                this.summaryLoads[id] = avValue
              }
            })
          }
        }

        // Calculate Temperature domains
        const temperatureObj = this.temperatureDomains.find(domain => {
          return domain.type === 'temperature' ||
            domain.type === 'temperature_mean'
            ? domain.id
            : null
        })
        const temperatureWithoutNulls = temperatureObj
          ? data.filter(d => {
              return d[temperatureObj.id] !== null
            })
          : []
        const totalTemperatureWithoutNulls = temperatureObj
          ? temperatureWithoutNulls.reduce(
              (prev, cur) => prev + (cur[temperatureObj.id] || 0),
              0
            )
          : 0

        let totalAverageValue = 0
        if (this.isEnergy) {
          totalAverageValue = totalPriceMarketValue / energySummaryTotal / 1000
        } else {
          totalAverageValue = volWeightPriceTotal / energySummaryTotal
        }

        this.summary._totalEnergy = totalEnergy
        this.summary._totalEnergyForPercentageCalculation = totalEnergyForPercentageCalculation
        this.summary._totalAverageValue = totalAverageValue
        this.summarySources._totalEnergy = totalSources
        this.summarySources._totalGeneration = totalGeneration
        this.summaryLoads._totalEnergy = totalLoads

        // calculate averages
        const avTotal = this.isEnergy
          ? totalEnergyMinusHidden
          : totalPowerMinusHidden

        const average = avTotal / data.length
        this.summary._averageEnergy = average
        this.summary._totalEmissionsVolume = totalEVMinusHidden
        this.summary._averageEmissionsVolume = totalEVMinusHidden / data.length
        this.summary._averageEmissionsIntensity = totalEVMinusHidden / avTotal
        this.summary._averageTemperature =
          totalTemperatureWithoutNulls / temperatureWithoutNulls.length
        this.$emit('summary-update', this.summary)
      }
    },

    calculatePointSummary(data) {
      let totalSources = 0
      let totalGeneration = 0
      let totalLoads = 0
      let totalPriceMarketValue = 0
      let totalEmissionsVol = 0
      this.pointSummary = data || {} // pointSummary._total is already calculated
      this.pointSummarySources = {}
      this.pointSummaryLoads = {}

      if (!_isEmpty(this.pointSummary)) {
        this.energyDomains.forEach(ft => {
          const category = ft.category
          const value = this.pointSummary[ft.id]

          if (category === 'source') {
            this.pointSummarySources[ft.id] = value
            totalSources += value
            if (!_includes(ft.id, 'imports')) {
              totalGeneration += value
            }
          } else if (category === 'load') {
            this.pointSummaryLoads[ft.id] = value
            totalLoads += value
          }
        })

        // Calculate Market Value
        if (this.isEnergy) {
          this.marketValueDomains.forEach((ft, index) => {
            const category = ft.category
            const value = this.pointSummary[ft.id]
            const findEnergyEq = this.energyDomains.find(
              e => e[this.propRef] === ft[this.propRef]
            )
            if (!findEnergyEq) {
              console.error(
                'There is an issue finding the energy fuel tech in market value calculations.'
              )
            }
            const ftTotal = this.pointSummary[findEnergyEq.id]
            const avValue = value / ftTotal / 1000

            this.pointSummary[ft.id] = avValue
            totalPriceMarketValue += value

            if (category === 'source') {
              this.pointSummarySources[ft.id] = avValue

              if (findEnergyEq.fuelTech === 'imports') {
                this.pointSummarySources[ft.id] = -avValue
              }
            } else if (category === 'load') {
              this.pointSummaryLoads[ft.id] = -avValue
            }
          })
        }

        // Calculate Emissions
        this.emissionsDomains.forEach(domain => {
          const category = domain.category
          const value = this.pointSummary[domain.id]

          totalEmissionsVol += value

          if (category === 'source') {
            this.pointSummarySources[domain.id] = value
          } else if (category === 'load') {
            this.pointSummaryLoads[domain.id] = value
          }
        })
      }

      if (this.priceId) {
        this.pointSummary._totalAverageValue = this.pointSummary[this.priceId]
      } else {
        let totalAverageValue =
          totalPriceMarketValue / this.pointSummary._total / 1000
        if (totalAverageValue === 0) {
          totalAverageValue = '–'
        }
        this.pointSummary._totalAverageValue = totalAverageValue
      }
      this.pointSummarySources._total = totalSources
      this.pointSummarySources._totalGeneration = totalGeneration
      this.pointSummaryLoads._total = totalLoads
      this.pointSummary._totalEmissionsVolume = totalEmissionsVol
    },

    updatePointSummary(date) {
      if (!date) return
      const dataFound = this.dataset.find(d => d.time === date.getTime())

      this.hoveredTemperature =
        dataFound && dataFound[this.temperatureId]
          ? dataFound[this.temperatureId]
          : ''
      this.calculatePointSummary(_cloneDeep(dataFound))
    },

    handleSourcesOrderUpdate(newSourceOrder) {
      this.setFuelTechOrder(newSourceOrder, this.loadsOrder)
    },

    handleLoadsOrderUpdate(newLoadsOrder) {
      this.setFuelTechOrder(this.sourcesOrder, newLoadsOrder)
    },

    setFuelTechOrder(sources, loads) {
      const loadsOrder = loads.map(d => d.fuelTech)
      const sourcesOrder = sources.map(d => d.fuelTech)
      const order = [...sourcesOrder, ...loadsOrder]
      this.$store.dispatch('fuelTechOrder', order.reverse())
    },

    emitHiddenFuelTechs() {
      let hiddenFuelTechs = [...this.hiddenSources, ...this.hiddenLoads]
      // if all is hidden, then unhide all
      let sourcesHiddenLength = 0
      this.sourcesOrder.forEach(d => {
        if (_includes(this.hiddenSources, d[this.propRef])) {
          sourcesHiddenLength += 1
        }
      })
      let loadsHiddenLength = 0
      this.loadsOrder.forEach(d => {
        if (_includes(this.hiddenLoads, d[this.propRef])) {
          loadsHiddenLength += 1
        }
      })
      if (
        this.sourcesOrder.length === sourcesHiddenLength &&
        this.loadsOrder.length === loadsHiddenLength &&
        !this.chartEnergyRenewablesLine
      ) {
        this.hiddenSources = []
        this.hiddenLoads = []
        hiddenFuelTechs = []
      }

      this.$emit('fuelTechsHidden', hiddenFuelTechs)
    },

    handleSourceFuelTechsHidden(hidden, hideOthers, onlyFt) {
      this.hiddenSources = hidden
      if (hideOthers) {
        if (this.fuelTechGroupName === 'Default') {
          const hiddenSources = Domain.getAllDomainObjs().filter(
            d => d.category === 'source' && d.fuelTech !== onlyFt.fuelTech
          )
          const hiddenLoads = Domain.getAllDomainObjs().filter(
            d => d.category === 'load'
          )
          this.hiddenSources = hiddenSources.map(d => d.fuelTech)
          this.hiddenLoads = hiddenLoads.map(d => d.fuelTech)
        } else {
          const hiddenLoads = this.domainPowerEnergyGrouped[
            this.fuelTechGroupName
          ].filter(d => d.category === 'load')
          this.hiddenLoads = hiddenLoads.map(d => d[this.propRef])
          // this.hiddenLoads = this.loadsOrder.map(d => d[property])
        }
      }
      this.emitHiddenFuelTechs()
    },

    handleLoadFuelTechsHidden(hidden, hideOthers, onlyFt) {
      this.hiddenLoads = hidden
      if (hideOthers) {
        if (this.fuelTechGroupName === 'Default') {
          const hiddenSources = Domain.getAllDomainObjs().filter(
            d => d.category === 'source'
          )
          const hiddenLoads = Domain.getAllDomainObjs().filter(
            d => d.category === 'load' && d.fuelTech !== onlyFt.fuelTech
          )
          this.hiddenSources = hiddenSources.map(d => d.fuelTech)
          this.hiddenLoads = hiddenLoads.map(d => d.fuelTech)
        } else {
          this.hiddenSources = this.sourcesOrder.map(d => d[this.propRef])
        }
      }
      this.emitHiddenFuelTechs()
    },

    handlePercentContributionToClick() {
      if (this.percentContributionTo === 'demand') {
        this.$store.dispatch('percentContributionTo', 'generation')
      } else {
        this.$store.dispatch('percentContributionTo', 'demand')
      }
    },

    handleRenewableRowClicked() {
      const rowToggle = !this.chartEnergyRenewablesLine
      this.$store.commit(
        'chartOptionsPowerEnergy/chartEnergyRenewablesLine',
        rowToggle
      )
      this.emitHiddenFuelTechs()
    },

    handleRenewableRowShiftClicked() {
      if (this.fuelTechGroupName === 'Default') {
        const hiddenSources = Domain.getAllDomainObjs().filter(
          d => d.category === 'source'
        )
        const hiddenLoads = Domain.getAllDomainObjs().filter(
          d => d.category === 'load'
        )
        this.hiddenSources = hiddenSources.map(d => d.fuelTech)
        this.hiddenLoads = hiddenLoads.map(d => d.fuelTech)
      } else {
        const hiddenLoads = this.domainPowerEnergyGrouped[
          this.fuelTechGroupName
        ].filter(d => d.category === 'load')
        this.hiddenLoads = hiddenLoads.map(d => d[this.propRef])
        this.hiddenSources = this.sourcesOrder.map(d => d[this.propRef])
      }

      this.$store.commit(
        'chartOptionsPowerEnergy/chartEnergyRenewablesLine',
        true
      )
      this.emitHiddenFuelTechs()
    },

    handleMouseEnter(ft) {
      this.$emit('mouse-enter', ft)
    },
    handleMouseLeave() {
      this.$emit('mouse-leave')
    }
  }
}
</script>

<style lang="scss" scoped>
@import '~/assets/scss/responsive-mixins.scss';
@import '~/assets/scss/variables.scss';

.summary-table {
  color: #333;
  font-size: 11px;

  .cell-value {
    font-family: $family-primary;
  }
}

.contribution-toggle {
  cursor: pointer;
  &:hover {
    background-color: rgba(255, 255, 255, 0.7);
  }
}

.renewable-row {
  cursor: pointer;
  &:hover {
    background-color: rgba(255, 255, 255, 0.7);
  }

  .summary-col-label {
    display: flex;
    align-items: center;
  }

  .renewable-line {
    width: 15px;
    height: 3px;
    background: #ddd;
    margin-right: 5px;

    &.on {
      background: #52bca3;

      &.alt-colour {
        background: #e34a33;
      }
    }
  }
}

::v-deep .summary-column-headers {
  .summary-row {
    font-family: $header-font-family;
    font-weight: 700;
    user-select: none;
  }
}

::v-deep .summary-row {
  display: flex;
  font-size: 1em;
  padding: 3px 4px;
  border-bottom: 1px solid #ddd;

  &.last-row {
    border-bottom-color: #000;
  }

  .summary-col-label {
    width: 200px;
  }
  .summary-col-energy,
  .summary-col-contribution,
  .summary-col-av-value,
  .summary-col-ev,
  .summary-col-ei {
    width: 25%;
    text-align: right;
    padding: 0 5px;
  }

  small {
    display: block;
    color: #999;
  }
}
</style>
