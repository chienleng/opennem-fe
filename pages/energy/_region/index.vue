<template>
  <div class="energy-region">
    <data-options-bar @queryChange="handleQueryChange"/>
    <transition name="fade">
      <div
        v-if="!ready"
        class="vis-table-container loading-containers">
        <div class="vis-container">
          <div
            class="loader-block"
            style="height: 30px" />
          <div
            class="loader-block"
            style="height: 400px" />
        </div>
        <div class="table-container">
          <div
            class="loader-block"
            style="height: 30px" />
          <div
            class="loader-block"
            style="height: 400px" />
        </div>
      </div>
    </transition>
    <div
      v-if="ready"
      class="vis-table-container">
      <vis-section
        :date-hover="hoverDate"
        :on-hover="isHovering"
        class="vis-container"
        @dateHover="handleDateHover"
        @isHovering="handleIsHovering" />
      <summary-section
        :hover-date="hoverDate"
        :is-hovering="isHovering"
        class="table-container"
        @dateHover="handleDateHover"
        @isHovering="handleIsHovering" />
    </div>
  </div>
</template>

<script>
import { mapActions, mapGetters, mapMutations } from 'vuex'
import { isPowerRange } from '@/constants/ranges.js'
import {
  isValidRegion,
  getEnergyRegionLabel
} from '@/constants/energy-regions.js'
import DataOptionsBar from '@/components/Energy/DataOptionsBar.vue'
import VisSection from '@/components/Energy/VisSection.vue'
import SummarySection from '@/components/Energy/SummarySection.vue'

export default {
  layout: 'main',

  head() {
    return {
      title: `: ${getEnergyRegionLabel(this.regionId)}`,
      meta: [
        {
          hid: 'twitter:title',
          name: 'twitter:title',
          content: `OpenNEM: ${getEnergyRegionLabel(this.regionId)}`
        },
        {
          hid: 'twitter:image:src',
          name: 'twitter:image:src',
          content: this.cardFilename
        },
        {
          hid: 'og:title',
          property: 'og:title',
          content: `OpenNEM: ${getEnergyRegionLabel(this.regionId)}`
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

  components: {
    DataOptionsBar,
    VisSection,
    SummarySection
  },

  data() {
    return {
      isHovering: false,
      hoverDate: null,
      baseUrl: `${this.$config.url}/images/screens/`,
      useDev: this.$config.useDev
    }
  },

  computed: {
    ...mapGetters({
      range: 'range',
      interval: 'interval',
      filterPeriod: 'filterPeriod',
      fuelTechGroupName: 'fuelTechGroupName',
      ready: 'regionEnergy/ready',
      isEnergyType: 'regionEnergy/isEnergyType',
      powerEnergyPrefix: 'regionEnergy/powerEnergyPrefix',
      currentDataset: 'regionEnergy/currentDataset',
      filteredDates: 'regionEnergy/filteredDates',
      query: 'app/query',
      showFeatureToggle: 'app/showFeatureToggle'
    }),
    regionId() {
      return this.$route.params.region
    },
    cardFilename() {
      return this.useDev
        ? `${this.baseUrl}opennem-dev.png`
        : `${this.baseUrl}opennem-${this.regionId}.png`
    }
  },

  watch: {
    showFeatureToggle(show) {
      if (!show) {
        this.doGetRegionDataByRangeInterval({
          region: this.regionId,
          range: this.range,
          interval: this.interval,
          period: this.filterPeriod,
          groupName: this.fuelTechGroupName
        })
      }
    },
    range(curr, prev) {
      this.setCompareDifference(false)
      this.doUpdateTickFormats({ range: curr, interval: this.interval })
      if (isPowerRange(curr) && isPowerRange(prev)) {
        this.doUpdateDatasetByFilterRange({
          range: curr,
          interval: this.interval
        })
      } else {
        this.doGetRegionDataByRangeInterval({
          region: this.regionId,
          range: curr,
          interval: this.interval,
          period: this.filterPeriod,
          groupName: this.fuelTechGroupName
        })
      }
    },
    interval(interval) {
      this.setCompareDifference(false)
      this.doUpdateTickFormats({ range: this.range, interval: interval })
      this.doUpdateDatasetByInterval({ range: this.range, interval })
    },
    filteredDates(dates) {
      this.doUpdateXTicks({
        range: this.range,
        interval: this.interval,
        isZoomed: dates.length > 0,
        filterPeriod: this.filterPeriod
      })
    },
    filterPeriod(period) {
      this.doUpdateDatasetByFilterPeriod({
        range: this.range,
        interval: this.interval,
        period
      })
    },
    fuelTechGroupName(groupName) {
      if (groupName === 'regions') {
        console.log(groupName)
      } else {
        this.doUpdateDatasetByGroup({ groupName })
      }
    },
    currentDataset(dataset) {
      if (dataset.length > 0) {
        this.doUpdateXGuides({
          interval: this.interval,
          start: dataset[0].time,
          end: dataset[dataset.length - 1].time
        })
      }
    },
    powerEnergyPrefix(prefix) {
      this.doSetChartEnergyUnitPrefix(prefix)
    }
  },

  created() {
    if (isValidRegion(this.regionId)) {
      this.$store.dispatch('currentView', 'energy')
      if (this.regionId === 'wem' && !this.isEnergyType) {
        this.setInterval('30m')
      }
      this.doGetRegionDataByRangeInterval({
        region: this.regionId,
        range: this.range,
        interval: this.interval,
        period: this.filterPeriod,
        groupName: this.fuelTechGroupName
      })
      this.doUpdateTickFormats({ range: this.range, interval: this.interval })
    } else {
      this.$router.push({
        params: { region: 'nem' },
        query: this.query
      })
    }
  },

  methods: {
    ...mapActions({
      doGetRegionDataByRangeInterval:
        'regionEnergy/doGetRegionDataByRangeInterval',
      doUpdateDatasetByInterval: 'regionEnergy/doUpdateDatasetByInterval',
      doUpdateDatasetByGroup: 'regionEnergy/doUpdateDatasetByGroup',
      doUpdateDatasetByFilterRange: 'regionEnergy/doUpdateDatasetByFilterRange',
      doUpdateDatasetByFilterPeriod:
        'regionEnergy/doUpdateDatasetByFilterPeriod',
      doUpdateXGuides: 'visInteract/doUpdateXGuides',
      doUpdateTickFormats: 'visInteract/doUpdateTickFormats',
      doUpdateXTicks: 'visInteract/doUpdateXTicks',
      doSetChartEnergyUnitPrefix:
        'chartOptionsPowerEnergy/doSetChartEnergyUnitPrefix'
    }),
    ...mapMutations({
      setCompareDifference: 'compareDifference',
      setInterval: 'interval',
      setQuery: 'app/query'
    }),
    handleDateHover(date) {
      this.hoverDate = date
    },
    handleIsHovering(hover) {
      this.isHovering = hover
    },
    handleQueryChange(query) {
      this.$router.push({
        params: { region: this.regionId },
        query
      })

      this.setQuery(query)
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
