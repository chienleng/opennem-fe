<template>
  <div
    :class="{
      'is-hovered': hoverOn || focusOn,
      'has-border-bottom': !chartShown
    }"
    class="chart">
    <power-energy-chart-options
      :read-only="readOnly"
      :chart-shown="chartShown"
      :chart-type="chartType"
      :chart-curve="chartCurve"
      :chart-y-axis="chartYAxis"
      :chart-unit="chartUnit"
      :chart-display-prefix="chartDisplayPrefix"
      :is-energy-type="isEnergyType"
      :is-type-area="isTypeArea"
      :is-type-proportion="isTypeProportion"
      :is-type-line="isTypeLine"
      :is-y-axis-absolute="isYAxisAbsolute"
      :is-y-axis-percentage="isYAxisPercentage"
      :is-y-axis-average-power="isYAxisAveragePower"
      :is-renewable-line-only="isRenewableLineOnly"
      :average-energy="averageEnergy"
      :hover-display-date="hoverDisplayDate"
      :hover-value="domains.length > 1 || (isTypeProportion || (isTypeLine && isYAxisPercentage)) ? hoverValue : null"
      :hover-domain-colour="hoverDomainColour"
      :hover-domain-label="hoverDomainLabel"
      :hover-renewables="hoverRenewables"
      :hover-total="hoverTotal"
      :display-unit="displayUnit"
      :display-title="displayTitle"
      :power-options="powerOptions"
      :energy-options="energyOptions"
      :single-domain-colour="singleDomainColour"
      :single-domain-label="singleDomainLabel"
      @type-click="handleTypeClick"
    />

    <stacked-area-vis
      v-if="chartShown && (isTypeArea || isTypeProportion)"
      :read-only="readOnly"
      :domains="domains"
      :dataset="stackedAreaDataset"
      :range="range"
      :interval="interval"
      :curve="chartCurve"
      :y-min="isTypeArea ? yMin : 0"
      :y-max="isTypeArea ? computedYMax : 100"
      :vis-height="chartHeight"
      :hover-on="hoverOn"
      :hover-date="hoverDate"
      :dynamic-extent="zoomExtent"
      :zoomed="zoomExtent.length > 0"
      :x-guides="xGuides"
      :y-guides="yGuides"
      :x-axis-dy="tabletBreak ? 8 : 12"
      :y-axis-ticks="5"
      :compare-dates="compareDates"
      :focus-date="focusDate"
      :focus-on="focusOn"
      :incomplete-intervals="incompleteIntervals"
      :dataset-two="chartEnergyRenewablesLine ? renewablesPercentageDataset : []"
      :dataset-two-colour="renewablesLineColour"
      :highlight-domain="highlightId"
      :mobile-screen="tabletBreak"
      :display-prefix="chartDisplayPrefix"
      :should-convert-value="shouldConvertValue"
      :convert-value="convertValue"
      :unit="` ${chartDisplayPrefix}${chartUnit}`"
      :null-check-prop="'_total'"
      :filter-period="filterPeriod"
      class="vis-chart"
      @dateOver="handleDateHover"
      @domainOver="handleDomainHover"
      @svgClick="handleSvgClick"
      @enter="handleVisEnter"
      @leave="handleVisLeave"
      @zoomExtent="handleZoomExtent"
    />

    <button
      v-if="chartShown && isTypeLine && zoomExtent.length > 0 && !readOnly"
      class="button is-rounded is-small reset-btn"
      @click.stop="handleZoomReset"
    >
      Zoom Out
    </button>
    <multi-line
      v-if="chartShown && isTypeLine"
      :svg-height="chartHeight - 30"
      :domains1="domains"
      :dataset1="multiLineDataset"
      :domains2="[{
        label: 'Renewables',
        domain: 'value',
        colour: renewablesLineColour
      }]"
      :dataset2="renewablesPercentageDataset"
      :show-y2="chartEnergyRenewablesLine"
      :y2-max="renewablesMax"
      :y2-min="0"
      :y2-axis-unit="'%'"
      :y1-max="energyLineYMax"
      :y1-min="energyLineYMin"
      :x-ticks="xTicks"
      :y1-axis-unit="isYAxisPercentage ? '%' : ''"
      :curve="chartCurve"
      :date-hovered="hoverDate"
      :zoom-range="zoomExtent"
      :draw-incomplete-bucket="true"
      :x-shades="xGuides"
      :highlight-domain="highlightId"
      :display-prefix="chartDisplayPrefix"
      :should-convert-value="shouldConvertValue"
      :convert-value="convertValue"
      class="vis-chart"
      @date-hover="handleDateHover"
      @domain-hover="handleDomainHover"
      @enter="handleVisEnter"
      @leave="handleVisLeave" />
    <date-brush
      v-if="chartShown && isTypeLine"
      :dataset="multiLineDataset"
      :zoom-range="zoomExtent"
      :x-ticks="xTicks"
      :tick-format="tickFormat"
      :second-tick-format="secondTickFormat"
      :read-only="readOnly"
      class="date-brush vis-chart"
      @date-hover="handleDateHover"
      @date-filter="handleZoomExtent"
      @enter="handleVisEnter"
      @leave="handleVisLeave" />
  </div>
</template>

<script>
import { mapGetters, mapMutations, mapActions } from 'vuex'
import { min, max } from 'd3-array'
import _includes from 'lodash.includes'
import _cloneDeep from 'lodash.clonedeep'

import AxisTimeFormats from '@/services/axisTimeFormats.js'

import * as OPTIONS from '@/constants/chart-options.js'
import * as SI from '@/constants/si.js'
import { RANGE_ALL_12MTH_ROLLING } from '@/constants/ranges.js'
import { LOAD } from '@/constants/energy-fuel-techs/group-default.js'
import EnergyToAveragePower from '@/data/transform/energy-to-average-power.js'
import DateDisplay from '@/services/DateDisplay.js'
import MultiLine from '@/components/Vis/MultiLine'
import DateBrush from '@/components/Vis/DateBrush'
import StackedAreaVis from '@/components/Vis/StackedArea'
import PowerEnergyChartOptions from './PowerEnergyChartOptions'

const powerOptions = {
  type: [
    OPTIONS.CHART_HIDDEN,
    OPTIONS.CHART_STACKED,
    OPTIONS.CHART_PROPORTION,
    OPTIONS.CHART_LINE
  ],
  curve: [
    OPTIONS.CHART_CURVE_SMOOTH,
    OPTIONS.CHART_CURVE_STEP,
    OPTIONS.CHART_CURVE_STRAIGHT
  ],
  yAxis: [OPTIONS.CHART_YAXIS_ABSOLUTE, OPTIONS.CHART_YAXIS_PERCENTAGE]
}
const energyOptions = {
  type: [
    OPTIONS.CHART_HIDDEN,
    OPTIONS.CHART_STACKED,
    OPTIONS.CHART_PROPORTION,
    OPTIONS.CHART_LINE
  ],
  curve: [
    OPTIONS.CHART_CURVE_SMOOTH,
    OPTIONS.CHART_CURVE_STEP,
    OPTIONS.CHART_CURVE_STRAIGHT
  ],
  yAxis: [
    OPTIONS.CHART_YAXIS_ENERGY,
    OPTIONS.CHART_YAXIS_AVERAGE_POWER,
    OPTIONS.CHART_YAXIS_PERCENTAGE
  ]
}

export default {
  components: {
    PowerEnergyChartOptions,
    StackedAreaVis,
    MultiLine,
    DateBrush
  },

  props: {
    powerEnergyDataset: {
      type: Array,
      default: () => []
    },
    domainPowerEnergy: {
      type: Array,
      default: () => []
    },
    hiddenDomains: {
      type: Array,
      default: () => []
    },
    hoverOn: {
      type: Boolean,
      default: false
    },
    hoverDate: {
      type: Date,
      default: null
    },
    zoomExtent: {
      type: Array,
      default: () => []
    },
    readOnly: {
      type: Boolean,
      default: false
    },
    range: {
      type: String,
      default: ''
    },
    interval: {
      type: String,
      default: ''
    },
    byGeneration: {
      type: Boolean,
      default: true
    },
    compareDates: {
      type: Array,
      default: () => []
    },
    renewablesLineColour: {
      type: String,
      default: '#52BCA3'
    },
    propName: {
      type: String,
      default: ''
    },
    chartHeight: {
      type: Number,
      default: 300
    },
    filterPeriod: {
      type: String,
      default: 'All'
    },
    incompleteIntervals: {
      type: Array,
      default: () => []
    },
    isEnergyType: {
      type: Boolean,
      default: false
    },
    powerOptions: {
      type: Object,
      default: () => {
        return _cloneDeep(powerOptions)
      }
    },
    energyOptions: {
      type: Object,
      default: () => {
        return _cloneDeep(energyOptions)
      }
    },
    yMax: {
      type: Number,
      default: 0
    }
  },

  computed: {
    ...mapGetters({
      tabletBreak: 'app/tabletBreak',

      hoverDomain: 'visInteract/hoverDomain',
      focusOn: 'visInteract/isFocusing',
      focusDate: 'visInteract/focusDate',
      xTicks: 'visInteract/xTicks',
      xGuides: 'visInteract/xGuides',
      yGuides: 'visInteract/yGuides',
      visTickFormat: 'visInteract/tickFormat',
      visSecondTickFormat: 'visInteract/secondTickFormat',
      highlightDomain: 'visInteract/highlightDomain',

      chartShown: 'chartOptionsPowerEnergy/chartShown',
      chartType: 'chartOptionsPowerEnergy/chartType',
      chartEnergyYAxis: 'chartOptionsPowerEnergy/chartEnergyYAxis',
      chartEnergyCurve: 'chartOptionsPowerEnergy/chartEnergyCurve',
      chartEnergyUnit: 'chartOptionsPowerEnergy/chartEnergyUnit',
      chartEnergyUnitPrefix: 'chartOptionsPowerEnergy/chartEnergyUnitPrefix',
      chartEnergyDisplayPrefix:
        'chartOptionsPowerEnergy/chartEnergyDisplayPrefix',
      chartEnergyCurrentUnit: 'chartOptionsPowerEnergy/chartEnergyCurrentUnit',
      chartPowerCurve: 'chartOptionsPowerEnergy/chartPowerCurve',
      chartPowerYAxis: 'chartOptionsPowerEnergy/chartPowerYAxis',
      chartPowerUnit: 'chartOptionsPowerEnergy/chartPowerUnit',
      chartPowerUnitPrefix: 'chartOptionsPowerEnergy/chartPowerUnitPrefix',
      chartPowerDisplayPrefix:
        'chartOptionsPowerEnergy/chartPowerDisplayPrefix',
      chartPowerCurrentUnit: 'chartOptionsPowerEnergy/chartPowerCurrentUnit',
      chartEnergyRenewablesLine:
        'chartOptionsPowerEnergy/chartEnergyRenewablesLine'
    }),

    tickFormat() {
      if (typeof this.visTickFormat === 'string') {
        return AxisTimeFormats[this.visTickFormat]
      }
      return this.visTickFormat
    },
    secondTickFormat() {
      return AxisTimeFormats[this.visSecondTickFormat]
    },

    chartYAxis() {
      return this.isEnergyType ? this.chartEnergyYAxis : this.chartPowerYAxis
    },
    chartCurve() {
      return this.isEnergyType ? this.chartEnergyCurve : this.chartPowerCurve
    },
    chartUnit() {
      return this.isEnergyType
        ? this.isYAxisAveragePower
          ? this.chartPowerUnit
          : this.chartEnergyUnit
        : this.chartPowerUnit
    },
    chartUnitPrefix() {
      return this.isEnergyType
        ? this.isYAxisAveragePower
          ? this.chartPowerUnitPrefix
          : this.chartEnergyUnitPrefix
        : this.chartPowerUnitPrefix
    },
    chartDisplayPrefix() {
      return this.isEnergyType
        ? this.isYAxisAveragePower
          ? this.chartPowerDisplayPrefix
          : this.chartEnergyDisplayPrefix
        : this.chartPowerDisplayPrefix
    },

    shouldConvertValue() {
      return this.isTypeArea || (this.isTypeLine && !this.isYAxisPercentage)
    },

    isTypeArea() {
      return this.chartType === OPTIONS.CHART_STACKED
    },
    isTypeProportion() {
      return this.chartType === OPTIONS.CHART_PROPORTION
    },
    isTypeLine() {
      return this.chartType === OPTIONS.CHART_LINE
    },
    isYAxisPercentage() {
      return this.chartYAxis === OPTIONS.CHART_YAXIS_PERCENTAGE
    },
    isYAxisAbsolute() {
      return (
        this.chartYAxis === OPTIONS.CHART_YAXIS_ENERGY ||
        this.chartYAxis === OPTIONS.CHART_YAXIS_ABSOLUTE
      )
    },
    isYAxisAveragePower() {
      return this.chartYAxis === OPTIONS.CHART_YAXIS_AVERAGE_POWER
    },

    domains() {
      const domains = this.isTypeArea
        ? this.powerEnergyDomains
        : this.energyPercentDomains
      return domains.filter(
        d => !_includes(this.hiddenDomains, d[this.propName])
      )
    },
    powerEnergyDomains() {
      return this.domainPowerEnergy
        ? _cloneDeep(this.domainPowerEnergy).reverse()
        : []
    },
    energyPercentDomains() {
      return this.powerEnergyDomains.filter(d => d.category === 'source')
    },

    singleDomain() {
      return this.domains.length === 1 ? this.domains[0] : null
    },
    singleDomainColour() {
      return this.singleDomain ? this.singleDomain.colour : null
    },
    singleDomainLabel() {
      return this.singleDomain ? this.singleDomain.label : null
    },

    highlightId() {
      const domain = this.highlightDomain
      const find = this.domains.find(d => d[this.propName] === domain)
      return find ? find.id : ''
    },

    displayTitle() {
      if (this.isRenewableLineOnly) {
        return 'Renewables'
      } else if (this.isEnergyType) {
        if (this.isYAxisAveragePower) {
          return 'Average Power'
        } else {
          return 'Energy'
        }
      } else {
        // power
        return 'Generation'
      }
    },

    isRollingSumRange() {
      return this.range === RANGE_ALL_12MTH_ROLLING
    },

    displayUnit() {
      let unit = ''
      if (this.isEnergyType) {
        if (this.isTypeProportion || this.isYAxisPercentage) {
          unit = '%'
        } else if (this.isYAxisAveragePower) {
          unit = this.chartPowerCurrentUnit
        } else {
          const interval = this.isRollingSumRange
            ? 'year'
            : this.intervalLabel(this.interval)
          unit = `${this.chartEnergyCurrentUnit}/${interval}`
        }
      } else {
        // power
        if (this.isTypeProportion || this.isYAxisPercentage) {
          unit = '%'
        } else {
          unit = this.chartPowerCurrentUnit
        }
      }

      if (this.isRenewableLineOnly) {
        unit = '%'
      }
      this.$emit('displayUnit', unit)
      return unit
    },

    energyPercentDataset() {
      const dataset = _cloneDeep(this.powerEnergyDataset)
      dataset.forEach((d, i) => {
        let totalNetGeneration = 0,
          min = 0,
          max = 0

        this.domains.forEach(domain => {
          const id = domain.id
          const ft = domain.fuelTech

          if (d[id] < min) {
            min = d[id]
          }
          if (d[id] > max) {
            max = d[id]
          }

          if (domain.category === 'source') {
            if (ft === 'battery_discharging') {
              totalNetGeneration += d._netBattery
            } else if (ft === 'hydro') {
              totalNetGeneration += d._netHydro
            } else if (ft === 'imports') {
              totalNetGeneration += d._netImports
            } else {
              totalNetGeneration += d[id]
            }
          }
        })

        this.domains.forEach(domain => {
          const ft = domain.fuelTech
          if (domain.category === 'source') {
            if (ft === 'battery_discharging') {
              d[domain.id] = (d._netBattery / totalNetGeneration) * 100
            } else if (ft === 'hydro') {
              d[domain.id] = (d._netHydro / totalNetGeneration) * 100
            } else if (ft === 'imports') {
              d[domain.id] = (d._netImports / totalNetGeneration) * 100
            } else {
              d[domain.id] = (d[domain.id] / totalNetGeneration) * 100
            }
          }
        })

        d._lowest = min
        d._highest = max
      })
      return dataset
    },
    energyGrossPercentDataset() {
      const dataset = this.powerEnergyDataset.map(d => {
        const obj = {
          date: d.date,
          time: d.time,
          _isIncompleteBucket: d._isIncompleteBucket
        }
        this.domains.forEach(domain => {
          obj[domain.id] = (d[domain.id] / d._total) * 100
        })
        return obj
      })

      dataset.forEach(p => {
        let min = 0,
          max = 0
        this.domains.forEach(domain => {
          const id = domain.id

          if (domain.category === 'load') {
            p[id] = -p[id]
          }
          if (p[id] < min) {
            min = p[id]
          }
          if (p[id] > max) {
            max = p[id]
          }
        })
        p._lowest = min
        p._highest = max
      })

      return dataset
    },
    multiLineEnergyDataset() {
      const dataset = this.powerEnergyDataset.map(d => {
        const obj = {
          date: d.date,
          time: d.time,
          _isIncompleteBucket: d._isIncompleteBucket
        }
        this.powerEnergyDomains.forEach(domain => {
          if (domain.category === 'load') {
            obj[domain.id] = d[domain.id] === 0 ? null : -d[domain.id]
          } else {
            obj[domain.id] = d[domain.id] === 0 ? null : d[domain.id]
          }
        })
        return obj
      })

      dataset.forEach(p => {
        let min = 0,
          max = 0
        this.domains.forEach(domain => {
          const id = domain.id

          if (p[id] < min) {
            min = p[id]
          }
          if (p[id] > max) {
            max = p[id]
          }
        })
        p._lowest = min
        p._highest = max
      })

      return dataset
    },
    averagePowerDataset() {
      return EnergyToAveragePower({
        data: this.powerEnergyDataset,
        domains: this.domains,
        range: this.range,
        interval: this.interval,
        exponent: this.chartEnergyUnitPrefix,
        isRollingSum: this.isRollingSumRange
      })
    },
    multiLineDataset() {
      if (this.isYAxisAbsolute) {
        return this.multiLineEnergyDataset
      } else if (this.isYAxisPercentage) {
        return this.energyGrossPercentDataset
      }
      return this.averagePowerDataset
    },
    stackedAreaDataset() {
      if (this.isTypeArea) {
        if (this.isYAxisAbsolute) {
          return this.powerEnergyDataset
        }
        // else return average power
        return this.averagePowerDataset
      } else {
        // return proportions dataset
        return this.energyPercentDataset
      }
    },
    dataset() {
      let ds = null
      if (this.isTypeLine) {
        ds = this.multiLineDataset
      } else {
        ds = this.stackedAreaDataset
      }
      this.$emit('selectedDataset', ds)
      return ds
    },
    yMin() {
      const loadDomains = this.domains.filter(d => d.category === LOAD)
      if (loadDomains.length === 0) {
        return 0
      } else {
        const dataset = _cloneDeep(this.stackedAreaDataset)
        dataset.forEach(d => {
          let stackedMin = 0
          this.domains.forEach(domain => {
            if (d[domain.id] < 0) {
              stackedMin += d[domain.id] || 0
            }
          })
          d._stackedTotalMin = stackedMin
        })
        return min(dataset, d => d._stackedTotalMin)
      }
    },
    // yMax() {
    //   const dataset = _cloneDeep(this.stackedAreaDataset)
    //   dataset.forEach(d => {
    //     let stackedMax = 0
    //     this.domains.forEach(domain => {
    //       stackedMax += d[domain.id]
    //     })
    //     d._stackedTotalMax = stackedMax
    //   })
    //   return max(dataset, d => d._stackedTotalMax)
    // },
    computedYMax() {
      let highest = 0

      this.stackedAreaDataset.forEach(d => {
        let total = 0
        this.domains.forEach(domain => {
          total += d[domain.id] || 0
        })

        if (total > highest) {
          highest = total
        }
      })

      if (highest <= this.yMax) {
        highest = this.yMax
      }

      return highest + (highest * 10) / 100
    },
    energyLineYMin() {
      const dataset = this.multiLineDataset
      const lowest = this.getMinValue(dataset)
      return lowest < 0 ? 0 : lowest
    },
    energyLineYMax() {
      const dataset = this.multiLineDataset
      return this.getMaxValue(dataset)
    },

    renewablesPercentageDataset() {
      const d = this.powerEnergyDataset.map(d => {
        return {
          date: d.date,
          time: d.time,
          renewables: d._totalRenewables,
          value: this.byGeneration
            ? d._totalGenerationRenewablesPercentage
            : d._totalDemandRenewablesPercentage
        }
      })
      return d
    },

    renewablesMax() {
      let m = max(this.renewablesPercentageDataset, d => d.value)
      return m < 100 ? 100 : m
    },
    isRenewableLineOnly() {
      return this.chartEnergyRenewablesLine && this.domains.length === 0
    },

    averageEnergy() {
      const dataset = this.isYAxisAveragePower
        ? this.averagePowerDataset
        : this.stackedAreaDataset
      const filteredDataset =
        this.zoomExtent.length > 0
          ? dataset.filter(
              d =>
                d.time >= this.zoomExtent[0].getTime() &&
                d.time <= this.zoomExtent[1].getTime() - 1
            )
          : dataset

      const total = filteredDataset.reduce((a, b) => a + b._total, 0)
      const average = total / filteredDataset.length
      return this.convertValue(average)
    },

    hoverPowerEnergyDomain() {
      const domain = this.hoverDomain
      const type = this.isEnergyType ? 'energy' : 'power'
      if (domain) {
        const split = domain.split('.')
        split.pop()
        return `${split.join('.')}.${type}`
      }
      return ''
    },
    hoverData() {
      let date = this.focusDate
      if (this.hoverOn) {
        date = this.hoverDate
      }
      if (!date) {
        return null
      }
      const time = date.getTime()
      return this.dataset.find(d => d.time === time)
    },
    hoverValue() {
      let value = null

      if (this.hoverData) {
        value = this.hoverData[this.hoverPowerEnergyDomain]
      }
      return this.isTypeProportion ||
        (this.isTypeLine && this.isYAxisPercentage)
        ? value
        : this.convertValue(value)
    },
    hoverDisplayDate() {
      let date = this.focusDate
      if (this.hoverOn) {
        date = this.hoverDate
      }
      return date
        ? DateDisplay.specialDateFormats(
            date.getTime(),
            this.range,
            this.interval,
            false,
            false,
            false,
            true
          )
        : ''
    },
    hoverDomainLabel() {
      const find = this.domainPowerEnergy.find(
        d => d.id === this.hoverPowerEnergyDomain
      )
      return find ? find.label : '—'
    },
    hoverDomainColour() {
      const find = this.domainPowerEnergy
        ? this.domainPowerEnergy.find(d => d.id === this.hoverPowerEnergyDomain)
        : null
      return find ? find.colour : '—'
    },
    hoverTotal() {
      let total = 0
      let allNulls = true
      if (this.hoverData) {
        this.domains.forEach(d => {
          const value = this.hoverData[d.id]
          total += value || 0
          if (value || value === 0) {
            allNulls = false
          }
        })
      }

      total = allNulls ? null : total
      return this.isTypeProportion ||
        (this.isTypeLine && this.isYAxisPercentage)
        ? total
        : this.convertValue(total)
    },
    hoverRenewables() {
      if (!this.hoverData) {
        return 0
      }
      return this.byGeneration
        ? this.hoverData._totalGenerationRenewablesPercentage
        : this.hoverData._totalDemandRenewablesPercentage
    }
  },

  watch: {
    chartUnit() {
      this.$emit('selectedDataset', this.dataset)
    },
    chartType() {
      this.$emit('selectedDataset', this.dataset)
    },
    chartUnitPrefix() {
      this.$emit('selectedDataset', this.dataset)
    }
  },

  methods: {
    ...mapMutations({
      setHoverDomain: 'visInteract/hoverDomain'
    }),

    ...mapActions({
      doUpdateXTicks: 'visInteract/doUpdateXTicks'
    }),

    convertValue(value) {
      return SI.convertValue(
        this.chartUnitPrefix,
        this.chartDisplayPrefix,
        value
      )
    },
    getMinValue(dataset) {
      let min = 0
      dataset.forEach(d => {
        if (d._lowest < min) {
          min = d._lowest
        }
      })
      return min
    },
    getMaxValue(dataset) {
      let max = 0
      dataset.forEach(d => {
        this.domains.forEach(domain => {
          if (d[domain.id] > max && !d._isIncompleteBucket) {
            max = d[domain.id]
          }
        })
      })
      return max === 0 ? 100 : max
    },
    intervalLabel(interval) {
      if (interval === 'Fin Year') {
        return 'year'
      }
      return interval.toLowerCase()
    },
    handleDomainHover(domain) {
      this.setHoverDomain(domain)
    },
    handleDateHover(evt, date) {
      this.$emit('dateHover', date)
    },
    handleVisEnter() {
      this.$emit('isHovering', true)
    },
    handleVisLeave() {
      this.$emit('isHovering', false)
    },
    handleSvgClick(metaKey) {
      this.$emit('svgClick', metaKey)
    },
    handleZoomExtent(dateRange) {
      this.$emit('zoomExtent', dateRange)
    },
    handleZoomReset() {
      this.$emit('zoomExtent', [])
    },

    handleTypeClick() {
      this.doUpdateXTicks({
        range: this.range,
        interval: this.interval,
        isZoomed: this.zoomExtent.length > 0,
        filterPeriod: this.filterPeriod
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.reset-btn {
  position: absolute;
  top: 39px;
  right: 24px;
}
</style>
