<template>
  <chart-header>
    <template
      v-slot:options
      v-if="!readOnly">
      <chart-options
        :options="options"
        :chart-type="chartType"
        :chart-curve="chartCurve"
        :chart-shown="chartShown"
        :chart-y-axis="chartYAxis"
        :show-y-axis-options="showYAxisOptions"
        :chart-unit="chartUnit"
        :chart-display-prefix="chartDisplayPrefix"
        :show="chartOptions"
        @show-change="s => chartOptions = s"
        @type-click="handleTypeClick"
        @y-axis-click="handleYAxisClick"
        @curve-click="handleCurveClick"
        @prefix-click="handlePrefixClick" />
    </template>

    <template v-slot:label-unit>
      <strong>{{ displayTitle }}</strong>
      <small
        :class="{ 'display-unit': allowDisplayHover }"
        @click.stop="handleUnitClick">{{ displayUnit }}</small>
    </template>

    <template
      v-slot:average-value
      v-if="showAverageValue">
      Av.
      <strong>
        {{ averageEnergy | formatValue }}
        <span>{{ displayUnit }}</span>
      </strong>
    </template>

    <template v-slot:hover-date>
      {{ hoverDisplayDate }}
    </template>
    <template v-slot:hover-values>
      <span
        v-if="hoverValue"
        class="ft-value">
        <em
          :style="{ 'background-color': hoverDomainColour }"
          class="colour-square" />
        {{ hoverDomainLabel }}
        <strong>
          {{ hoverValue | formatValue }}
          <span>{{ displayUnit }}</span>
        </strong>
      </span>

      <span
        v-if="isRenewableLineOnly"
        class="renewables-value">
        <strong>{{ hoverRenewables | percentageFormatNumber }}</strong>
      </span>
      <span
        v-else-if="!isTypeProportion && !(isTypeLine && isYAxisPercentage)"
        class="total-value">
        Total
        <strong>
          {{ hoverTotal | formatValue }}
          <span>{{ displayUnit }}</span>
        </strong>
      </span>
    </template>
  </chart-header>
</template>

<script>
import { mapGetters } from 'vuex'
import _cloneDeep from 'lodash.clonedeep'
import ChartHeader from '@/components/Vis/ChartHeader'
import ChartOptions from '@/components/Vis/ChartOptions'
import * as OPTIONS from '@/constants/chart-options.js'
import * as SI from '@/constants/si'

const powerSi = [SI.MEGA, SI.GIGA]
const energySi = [SI.GIGA, SI.TERA]

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
    ChartHeader,
    ChartOptions
  },
  props: {
    chartShown: {
      type: Boolean,
      default: false
    },
    chartType: {
      type: String,
      default: ''
    },
    chartCurve: {
      type: String,
      default: ''
    },
    chartYAxis: {
      type: String,
      default: ''
    },
    chartUnit: {
      type: String,
      default: ''
    },
    chartDisplayPrefix: {
      type: String,
      default: ''
    },
    isEnergyType: {
      type: Boolean,
      default: false
    },
    isTypeArea: {
      type: Boolean,
      default: false
    },
    isTypeProportion: {
      type: Boolean,
      default: false
    },
    isTypeLine: {
      type: Boolean,
      default: false
    },
    isYAxisAbsolute: {
      type: Boolean,
      default: false
    },
    isYAxisPercentage: {
      type: Boolean,
      default: false
    },
    isYAxisAveragePower: {
      type: Boolean,
      default: false
    },
    isRenewableLineOnly: {
      type: Boolean,
      default: false
    },
    averageEnergy: {
      type: Number,
      default: 0
    },
    hoverDisplayDate: {
      type: String,
      default: ''
    },
    hoverValue: {
      type: Number,
      default: 0
    },
    hoverDomainColour: {
      type: String,
      default: ''
    },
    hoverDomainLabel: {
      type: String,
      default: ''
    },
    hoverRenewables: {
      type: Number,
      default: 0
    },
    hoverTotal: {
      type: Number,
      default: 0
    },
    displayUnit: {
      type: String,
      default: ''
    },
    displayTitle: {
      type: String,
      default: ''
    },
    readOnly: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      chartOptions: false
    }
  },
  computed: {
    allowDisplayHover() {
      return (
        !this.isRenewableLineOnly &&
        (this.isTypeArea || (this.isTypeLine && !this.isYAxisPercentage))
      )
    },
    showAverageValue() {
      if (this.isRenewableLineOnly) {
        return false
      }

      if (this.isTypeArea) {
        return true
      } else if (this.isTypeLine) {
        if (this.isYAxisAbsolute || this.isYAxisAveragePower) {
          return true
        }
      }

      return false
    },
    showYAxisOptions() {
      if (this.isEnergyType) {
        return true
      } else {
        if (this.isTypeLine) {
          return true
        }
        return false
      }
    },
    options() {
      let options = []
      if (this.isEnergyType) {
        options = _cloneDeep(energyOptions)
        if (this.isTypeLine) {
          options.yAxis = [
            OPTIONS.CHART_YAXIS_ENERGY,
            OPTIONS.CHART_YAXIS_AVERAGE_POWER,
            OPTIONS.CHART_YAXIS_PERCENTAGE
          ]
          if (this.isYAxisAbsolute) {
            options.si = energySi
          } else if (this.isYAxisAveragePower) {
            options.si = powerSi
          }
        } else if (this.isTypeArea) {
          options.yAxis = [
            OPTIONS.CHART_YAXIS_ENERGY,
            OPTIONS.CHART_YAXIS_AVERAGE_POWER
          ]
          if (this.isYAxisAbsolute) {
            options.si = energySi
          } else if (this.isYAxisAveragePower) {
            options.si = powerSi
          }
        } else if (this.isTypeProportion) {
          options.yAxis = []
        }
      } else {
        options = _cloneDeep(powerOptions)
        if (this.isTypeArea || (this.isTypeLine && this.isYAxisAbsolute)) {
          options.si = powerSi
        }
      }
      return options
    }
  },

  methods: {
    handleTypeClick(type) {
      if (this.isEnergyType) {
        if (
          (this.chartType === OPTIONS.CHART_LINE &&
            this.chartYAxis === OPTIONS.CHART_YAXIS_PERCENTAGE) ||
          ((this.chartType === OPTIONS.CHART_LINE ||
            this.chartType === OPTIONS.CHART_STACKED) &&
            this.chartYAxis === OPTIONS.CHART_YAXIS_AVERAGE_POWER &&
            type === OPTIONS.CHART_PROPORTION)
        ) {
          this.$store.commit(
            'chartOptionsPowerEnergy/chartEnergyYAxis',
            OPTIONS.CHART_YAXIS_ENERGY
          )
        }
      } else {
        console.log('power', this.chartYAxis)
        if (
          this.chartType === OPTIONS.CHART_LINE &&
          this.chartYAxis === OPTIONS.CHART_YAXIS_PERCENTAGE
        ) {
          this.$store.commit(
            'chartOptionsPowerEnergy/chartPowerYAxis',
            OPTIONS.CHART_YAXIS_ABSOLUTE
          )
        }
      }
      this.$store.commit('chartOptionsPowerEnergy/chartType', type)
    },
    handleCurveClick(curve) {
      if (this.isEnergyType) {
        this.$store.commit('chartOptionsPowerEnergy/chartEnergyCurve', curve)
      } else {
        this.$store.commit('chartOptionsPowerEnergy/chartPowerCurve', curve)
      }
    },
    handleYAxisClick(yAxis) {
      if (this.isEnergyType) {
        this.$store.commit('chartOptionsPowerEnergy/chartEnergyYAxis', yAxis)
      } else {
        this.$store.commit('chartOptionsPowerEnergy/chartPowerYAxis', yAxis)
      }
    },
    handlePrefixClick(prefix) {
      if (this.isEnergyType) {
        if (this.isYAxisAveragePower) {
          this.$store.commit(
            'chartOptionsPowerEnergy/chartPowerDisplayPrefix',
            prefix
          )
        } else {
          this.$store.commit(
            'chartOptionsPowerEnergy/chartEnergyDisplayPrefix',
            prefix
          )
        }
      } else {
        this.$store.commit(
          'chartOptionsPowerEnergy/chartPowerDisplayPrefix',
          prefix
        )
      }
    },
    togglePrefix(prefix) {
      let updatedPrefix = prefix
      if (this.isEnergyType) {
        if (this.isYAxisAveragePower) {
          updatedPrefix = powerSi.find(p => p !== prefix)
        } else {
          updatedPrefix = energySi.find(p => p !== prefix)
        }
      } else {
        updatedPrefix = powerSi.find(p => p !== prefix)
      }
      return updatedPrefix
    },
    handleUnitClick() {
      if (!this.isRenewableLineOnly) {
        if (this.isTypeArea || (this.isTypeLine && !this.isYAxisPercentage)) {
          const updatedPrefix = this.togglePrefix(this.chartDisplayPrefix)
          this.handlePrefixClick(updatedPrefix)
        }
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.display-unit {
  cursor: pointer;
  padding: 2px 4px 1px;
  border-radius: 4px;

  &:hover {
    background-color: rgba(255, 255, 255, 0.7);
  }
}
</style>
