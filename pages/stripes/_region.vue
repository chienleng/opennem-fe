<template>
  <div class="container-fluid">
    <h3 v-if="useAllPeriods">{{ dateRange }}</h3>

    <OptionsLegend
      :legend-width="tabletBreak ? 200 : 310"
      :legend-font-size="tabletBreak ? 9 : 10"
      :show-legend="regionData.length > 0"
      :hover-display="hoverDisplay"
      :use-hover="!useAllPeriods"
      :show-hover="hoverDate ? true : false"
    />

    <div class="vis-container">
      <section
        v-for="(d, i) in regionData"
        :key="`region-${i}`"
        :style="{ 'margin-top': useAllPeriods ? '35px' : '0' }"
        class="vis-section"
      >

        <HoverMetric
          v-if="hoverDate"
          :is-yearly="d.yearlyData && d.yearlyData.length > 0 ? true : false"
          :hover-date="hoverDate"
          :data="d.data"
          :hover-value="hoverValue"
          :selected-metric="selectedMetric"
          :selected-metric-object="selectedMetricObject"
          :selected-period="selectedPeriodObject"
          :style="{ display: useAllPeriods ? 'block' : 'none' }"
          @hover-obj="d => hoverDisplay = d"
        />

        <div v-if="d.yearlyData">
          <section
            v-for="(yData, yIndex) in d.yearlyData"
            :key="`yearly-${i}-${yIndex}`"
            style="width: 100%"
          >
            <h5 class="heatmap-label">{{ yData.year }}</h5>
            <Heatmap
              :cell-height="50"
              :svg-width="width"
              :svg-height="50"
              :radius="0"
              :dataset="yData.data"
              :value-prop="selectedMetric"
              :tooltip-value-prop="selectedMetricObject.valueProp ? selectedMetricObject.valueProp : selectedMetric"
              :divisor="selectedMetricObject.divisor"
              :offset="selectedMetricObject.offset"
              :colour-range="selectedMetricObject.range"
              :colour-domain="selectedMetricObject.domain"
              @rect-mousemove="obj => {
                handleMousemove(obj, d.regionId)
              }"
              @rect-mouseout="handleMouseout"
            />
          </section>
        </div>
        <div
          v-else
          style="width: 100%">
          <nuxt-link
            :to="`/stripes/${d.regionId}/?metric=${selectedMetric}`"
            class="heatmap-label region-label">{{ d.region }}</nuxt-link>
          <Heatmap
            :cell-height="75"
            :svg-width="width"
            :svg-height="75"
            :radius="0"
            :dataset="d.data"
            :value-prop="selectedMetric"
            :tooltip-value-prop="selectedMetricObject.valueProp ? selectedMetricObject.valueProp : selectedMetric"
            :divisor="selectedMetricObject.divisor"
            :offset="selectedMetricObject.offset"
            :colour-range="selectedMetricObject.range"
            :colour-domain="selectedMetricObject.domain"
            :hover-date="hoverDate"
            @rect-mousemove="obj => {
              handleMousemove(obj, d.regionId)
            }"
            @rect-mouseout="handleMouseout"
          />
        </div>
      </section>
    </div>

  </div>
</template>

<script>
import { mapGetters, mapActions, mapMutations } from 'vuex'
import debounce from 'lodash.debounce'

import { getEnergyRegionLabel } from '@/constants/energy-regions.js'
import { periods, metrics } from '@/constants/stripes/'

import {
  getRegionStripesData,
  getYearlyStripesData,
  getStripesDateRange,
  getStripesRegion
} from '@/data/pages/page-stripes.js'

import Heatmap from '@/components/Vis/Heatmap'
import ColourLegend from '@/components/Vis/ColourLegend'
import OptionsLegend from '@/components/Stripes/OptionsLegend'
import HoverMetric from '@/components/Stripes/HoverMetric'

export default {
  layout: 'main',

  components: {
    Heatmap,
    ColourLegend,
    OptionsLegend,
    HoverMetric
  },

  head() {
    return {
      title: `: ${getEnergyRegionLabel(this.regionId)} Stripes`,
      meta: [
        {
          hid: 'twitter:title',
          name: 'twitter:title',
          content: `OpenNEM: ${getEnergyRegionLabel(this.regionId)} Stripes`
        },
        {
          hid: 'twitter:image:src',
          name: 'twitter:image:src',
          content: this.cardFilename
        },
        {
          hid: 'og:title',
          property: 'og:title',
          content: `OpenNEM: ${getEnergyRegionLabel(this.regionId)} Stripes`
        },
        {
          hid: 'og:image',
          property: 'og:image',
          content: this.cardFilename
        },
        {
          hid: 'og:image:width',
          property: 'og:image:width',
          content: '1447'
        },
        {
          hid: 'og:image:height',
          property: 'og:image:height',
          content: '932'
        }
      ]
    }
  },

  data() {
    return {
      baseUrl: `${this.$config.url}/images/screens/`,
      width: 0,
      periods,
      metrics,
      dateRange: getStripesDateRange(),
      regionData: [],
      hoverDate: null,
      hoverValue: null,
      hoverRegion: '',
      hoverDisplay: null
    }
  },

  computed: {
    ...mapGetters({
      range: 'range',
      interval: 'interval',
      filterPeriod: 'filterPeriod',
      fuelTechGroupName: 'fuelTechGroupName',
      tabletBreak: 'app/tabletBreak'
    }),

    selectedPeriod: {
      get() {
        return this.$store.getters['stripes/selectedPeriod']
      },

      set(val) {
        this.$store.commit('stripes/selectedPeriod', val)
      }
    },

    selectedMetric: {
      get() {
        return this.$store.getters['stripes/selectedMetric']
      },

      set(val) {
        const query = { metric: val }
        this.$router.push({
          path: `?metric=${val}`
        })
        this.$store.commit('stripes/selectedMetric', val)
        this.setQuery(query)
        this.hoverDisplay = null
      }
    },

    selectedMetricObject() {
      return this.metrics.find(m => m.value === this.selectedMetric)
    },

    selectedPeriodObject() {
      return this.periods.find(p => p.value === this.selectedPeriod)
    },

    regionId() {
      return this.$route.params.region
    },

    queryMetric() {
      return this.$route.query.metric
    },

    useAllPeriods() {
      return this.regionId === 'au' || this.regionId === 'nem'
    },

    cardFilename() {
      return `${this.baseUrl}opennem-stripes-${this.regionId}.png`
    }
  },

  watch: {
    regionId(id) {
      this.getData(id, this.selectedPeriod)
    },
    queryMetric(metric) {
      if (metric) {
        this.selectedMetric = metric
      }
    }
  },

  mounted() {
    if (this.queryMetric) {
      this.selectedMetric = this.queryMetric
    } else {
      this.$router.push({
        query: {
          metric: this.selectedMetric
        }
      })
    }

    this.$store.dispatch('currentView', 'stripes')
    this.getData(this.regionId, this.selectedPeriod)

    this.width = this.$el.offsetWidth - 32

    window.addEventListener(
      'resize',
      debounce(() => {
        this.width =
          this.$el.offsetWidth === 0 ? this.width : this.$el.offsetWidth - 32
      }),
      50
    )
  },

  methods: {
    ...mapActions({
      doGetRegionData: 'regionEnergy/doGetRegionData',
      doGetAllData: 'regionEnergy/doGetAllData'
    }),
    ...mapMutations({
      setQuery: 'app/query'
    }),

    getData(id, period) {
      // reset
      this.regionData = []

      const regions = getStripesRegion(id)

      if (this.useAllPeriods) {
        this.selectedPeriod = 'all/month'

        getRegionStripesData(this.doGetAllData, regions).then(d => {
          this.regionData = d
        })
      } else {
        this.selectedPeriod = 'multiyear/day'

        getYearlyStripesData(this.doGetRegionData, regions).then(d => {
          this.regionData = d
        })
      }
    },

    handleMousemove({ id, date, value }, regionId) {
      this.hoverRegion = regionId
      this.hoverDate = date
      this.hoverValue = value
    },
    handleMouseout() {
      this.hoverDate = null
      this.hoverValue = null
    }
  }
}
</script>

<style lang="scss" scoped>
@import '~/assets/scss/variables.scss';
@import '~/assets/scss/responsive-mixins.scss';

.container-fluid {
  padding: 1rem 16px;
  height: 100%;

  @include mobile {
    padding-top: 0;
  }
}

h3 {
  font-family: $header-font-family;
  font-size: 1.4em;
  font-weight: 300;
  margin-left: 2px;
  padding-bottom: 0.5rem;
  text-align: right;
  border-bottom: 1px solid #ddd;
}

.vis-container {
  margin-top: 1.8rem;
}
.vis-section {
  position: relative;

  h4 {
    font-family: $header-font-family;
    font-size: 1.2em;
    font-weight: 700;
  }
  .heatmap-label {
    font-family: $header-font-family;
    font-weight: 700;
    font-size: 1em;
    position: absolute;
    z-index: 9;
    color: #fff;
    text-shadow: 0 0 2px rgba(0, 0, 0, 0.4);
    background-color: rgba(0, 0, 0, 0.2);
    padding: 0 3px 1px;
    border-radius: 0 0 1px 0;
    left: 1px;
    margin-top: 1px;
  }

  .region-label {
    cursor: pointer;

    &:hover {
      background-color: rgba(0, 0, 0, 0.6);
    }
  }
  header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 5px;

    small {
      font-family: $family-primary;
      font-size: 0.7em;
      font-weight: 300;
    }
  }
}

::v-deep .heatmap {
  border: 1px solid #ddd;
}
</style>
