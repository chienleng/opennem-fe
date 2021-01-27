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
  getEnergyTableData,
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
    regionObj: {
      type: Object,
      default: () => null
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
          value: 'Day'
        }
      ],
      selectedRange: null,
      selectedInterval: null,
      selectedPeriod: 'All',
      selectedGroup: 'Default'
    }
  },

  watch: {
    region(val) {
      this.dataset = []
    }
  },

  created() {
    this.selectedRange = this.rangeOptions[0].value
    this.selectedInterval = this.intervalOptions[0].value
  },

  methods: {
    ...mapActions({
      doGetRegionsData: 'regionEnergy/doGetRegionsData'
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

    async fetch() {
      const datasets = await this.doGetRegionsData({
        regions: this.regionObj.regions,
        range: this.selectedRange,
        interval: this.selectedInterval,
        period: this.selectedPeriod,
        groupName: this.selectedGroup
      })

      const { columns, rows } = getEnergyTableData({ datasets })

      this.$emit('dataset', {
        dataset: datasets,
        columns,
        rows
      })
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
