<template>
  <div>
    <Dropdown
      :options="rangeOptions"
      class="dropdown"
      @change="handleChange"
    />
    <Dropdown
      :options="intervalOptions"
      class="dropdown"
      @change="handleChange"
    />
  </div>
</template>

<script>
import { mapActions } from 'vuex'

import {
  getTableData,
  getOptionId,
  getOptionLabel
} from '@/data/pages/page-data-check.js'

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
      rangeOptions: [
        {
          label: '30D',
          value: '30D'
        }
      ],
      intervalOptions: [
        {
          label: 'Day',
          value: 'day'
        }
      ],
      selectedRange: null,
      selectedInterval: null
    }
  },

  watch: {
    region(val) {
      this.dataset = []
    }
  },

  methods: {
    ...mapActions({
      // doGetRegionData: 'regionEnergy/doGetRegionData',
      // doGetAllData: 'regionEnergy/doGetAllData'
    }),

    handleChange() {},

    reset() {
      this.dataset = []

      this.$emit('dataset', {
        dataset: [],
        columns: [],
        rows: []
      })
      this.$emit('title', '')
    },

    fetch() {
      console.log('fetch')
    },

    //     getCombinedRegionsData(dataset, selectedMetric) {
    //       if (dataset && dataset.length > 0) {
    //         const { columns, rows } = getTableData({
    //           dataset,
    //           dateFormatString: this.isGroupedRegion ? 'MMM yyyy' : 'dd/MM/yyyy',
    //           selectedMetricObject: this.metricOptions.find(
    //             d => d.value === selectedMetric
    //           )
    //         })
    //
    //         this.$emit('dataset', {
    //           dataset,
    //           columns,
    //           rows
    //         })
    //       }
    //     },

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
