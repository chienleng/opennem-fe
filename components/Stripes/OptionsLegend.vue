<template>
  <div class="options-legend-wrapper">
    <div class="options">
      <div class="metric-selection select is-rounded">
        <select v-model="selectedMetric">
          <!-- <option
            v-for="(d, i) in metrics"
            :key="`metric-${i}`"
            :value="d.value"
          >
            {{ d.label }}
          </option> -->

          <option
            v-if="featureEmissions"
            value="carbonIntensity">Carbon intensity</option>
          <option value="netInterconnectorFlow">Net interconnector flow (of demand)</option>

          <optgroup label="Proportion">
            <option value="renewablesProportion">Renewables proportion (of demand)</option>
            <option value="solarProportion">Solar proportion (of demand)</option>
            <option value="windProportion">Wind proportion (of demand)</option>
            <option value="gasProportion">Gas proportion (of demand)</option>
            <option value="coalProportion">Coal proportion (of demand)</option>
          </optgroup>

          <optgroup label="Average value">
            <option value="solarValue">Solar value</option>
            <option value="windValue">Wind value</option>
            <option value="hydroValue">Hydro value</option>
            <option value="gasValue">Gas value</option>
            <option value="coalValue">Coal value</option>
            <option value="price">Volume-weighted price</option>
            <option value="inflatedPrice">Volume-weighted price (inflation adjusted)</option>
          </optgroup>

          <optgroup label="Temperature">
            <option value="temperature">Average temperature</option>
            <option value="maxTemperature">Max temperature</option>
          </optgroup>
        </select>
      </div>
    </div>

    <div class="right-col">
      <ColourLegend
        v-if="showLegend"
        :svg-width="legendWidth"
        :font-size="legendFontSize"
        :svg-height="30"
        :unit="
          selectedMetricObj.value === 'carbonIntensity'
            ? ''
            : selectedMetricObj.unit
        "
        :multiplier="selectedMetricObj.divisor"
        :offset="selectedMetricObj.offset"
        :colour-range="selectedMetricObj.range"
        :colour-domain="selectedMetricObj.domain"
        :colour-domain-label="selectedMetricObj.domainLabel"
        :zero-block="selectedMetricObj.showZeroBlock"
        :type="selectedMetricObj.legendType"
        :tooltip-format="selectedMetricObj.numberFormatString"
        class="colour-legend"
      />

      <div
        v-if="useHover"
        class="hover-metric-wrapper">
        <HoverMetric
          v-if="showHover"
          :hover-display="hoverDisplay"
        />
      </div>

    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { metrics } from '@/constants/stripes/'
import ColourLegend from '@/components/Vis/ColourLegend'
import HoverMetric from '@/components/Stripes/HoverMetric'

export default {
  components: {
    ColourLegend,
    HoverMetric
  },

  props: {
    showLegend: {
      type: Boolean,
      default: true
    },
    legendWidth: {
      type: Number,
      default: 310
    },
    legendFontSize: {
      type: Number,
      default: 10
    },
    useHover: {
      type: Boolean,
      default: false
    },
    showHover: {
      type: Boolean,
      default: false
    },
    hoverDisplay: {
      type: Object,
      default: null
    }
  },

  computed: {
    ...mapGetters({
      featureEmissions: 'feature/emissions',
      selectedMetricObj: 'stripes/selectedMetricObj'
    }),
    selectedMetric: {
      get() {
        return this.$store.getters['stripes/selectedMetric']
      },

      set(val) {
        this.$router.push({
          query: {
            metric: val
          }
        })
        this.$store.commit('stripes/selectedMetric', val)
      }
    },

    metrics() {
      if (this.featureEmissions) {
        return metrics
      }
      return metrics.filter(d => d.value !== 'carbonIntensity')
    }
  }
}
</script>

<style lang="scss" scoped>
@import '~/assets/scss/variables.scss';
@import '~/assets/scss/responsive-mixins.scss';

.options-legend-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  position: sticky;
  z-index: 99;
  top: 0;
  padding: 1rem 0;
  background-color: $beige-lighter;
  border-bottom: 1px solid #ddd;

  @include mobile {
    // display: block;
    border-bottom: 1px solid #999;
  }
}
.options {
  display: flex;
  align-items: center;

  @include mobile {
    margin-right: 1rem;
  }

  & > * {
    // margin: 0 1rem;
  }

  label {
    margin: 0 0.5rem 0 0;
  }
}

.metric-selection {
  width: 100%;
  select {
    width: 100%;
  }
}

.colour-legend {
  margin-top: 4px;
  @include mobile {
    // margin-top: 1rem;
  }
}

.right-col {
  @include mobile {
    // display: flex;
    // justify-content: space-between;
    // align-items: center;
  }
}

.hover-metric-wrapper {
  height: 20px;
  display: flex;
  justify-content: flex-end;
  position: relative;
  top: 3px;

  ::v-deep .hover-date-value {
    position: static;
  }

  @include mobile {
    width: 200px;
  }
}
</style>
