<template>
  <div>
    <Dropdown
      :options="metricOptions"
      class="dropdown"
      @change="handleMetricChange"
    />
    <Dropdown
      v-if="!isGroupedRegion"
      :options="metricYearOptions"
      class="dropdown"
      @change="handleMetricYearChange"
    />
  </div>
</template>

<script>
import { mapActions } from 'vuex'

import { metrics } from '@/constants/stripes/index.js'
import { getEachYearOfInterval } from '@/constants/stripes/dates.js'
import {
  getTableData,
  getOptionId,
  getOptionLabel
} from '@/data/pages/page-data-check.js'
import {
  getRegionStripesData,
  getYearlyStripesData,
  getStripesRegion,
  dateFormatString
} from '@/data/pages/page-stripes.js'

import Dropdown from '@/components/ui/Dropdown'

export default {
  components: {
    Dropdown
  },

  props: {
    region: {
      type: String,
      default: null
    },
    isGroupedRegion: {
      type: Boolean,
      default: false
    }
  },

  data() {
    return {
      dataset: [],
      metricOptions: metrics,
      metricYearOptions: getEachYearOfInterval.map(d => {
        return {
          label: d + '',
          value: d
        }
      }),
      selectedMetric: null,
      selectedYear: null
    }
  },

  watch: {
    region(val) {
      this.dataset = []
    },

    selectedMetric(val) {
      this.setTitle(val, this.selectedYear)
      this.getCombinedRegionsData(this.dataset, val)
    },

    selectedYear(val) {
      this.setTitle(this.selectedMetric, val)

      if (this.dataset && this.dataset.length > 0) {
        this.dataset[0].data = this.dataset[0].yearlyData.find(
          d => d.year + '' === val
        ).data
      }

      this.getCombinedRegionsData(this.dataset, this.selectedMetric)
    }
  },

  methods: {
    ...mapActions({
      doGetRegionData: 'regionEnergy/doGetRegionData',
      doGetAllData: 'regionEnergy/doGetAllData'
    }),

    handleMetricChange(metric) {
      this.selectedMetric = getOptionId(this.metricOptions, metric)
    },

    handleMetricYearChange(year) {
      this.selectedYear = year
    },

    reset() {
      this.selectedMetric = ''
      this.selectedYear = ''
      this.dataset = []
      this.$emit('dataset', {
        dataset: [],
        columns: [],
        rows: []
      })
      this.$emit('title', '')
    },

    fetch() {
      const regions = getStripesRegion(this.region)

      if (this.isGroupedRegion) {
        getRegionStripesData(this.doGetAllData, regions).then(dataset => {
          this.dataset = dataset
          this.setTitle(this.selectedMetric)
          this.getCombinedRegionsData(dataset, this.selectedMetric)
        })
      } else {
        getYearlyStripesData(this.doGetRegionData, regions).then(dataset => {
          this.dataset = dataset

          this.setTitle(this.selectedMetric, this.selectedYear)

          if (this.dataset && this.dataset.length > 0) {
            const find = this.dataset[0].yearlyData.find(
              d => d.year + '' === this.selectedYear
            )
            this.dataset[0].data = find.data
            this.dataset[0].originalDataset = find.originalDataset
          }

          this.getCombinedRegionsData(this.dataset, this.selectedMetric)
        })
      }
    },

    getCombinedRegionsData(dataset, selectedMetric) {
      if (dataset && dataset.length > 0) {
        const { columns, rows } = getTableData({
          dataset,
          dateFormatString: this.isGroupedRegion ? 'MMM yyyy' : 'dd/MM/yyyy',
          selectedMetricObject: this.metricOptions.find(
            d => d.value === selectedMetric
          )
        })

        this.$emit('dataset', {
          dataset,
          columns,
          rows
        })
      }
    },

    setTitle(metric, year) {
      const metricLabel = getOptionLabel(this.metricOptions, metric)
      let title = `— ${metricLabel}`

      if (!this.isGroupedRegion) {
        title += ` — ${year}`
      }

      this.$emit('title', title)
    }
  }
}
</script>
