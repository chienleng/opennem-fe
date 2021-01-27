<template>
  <div class="data-viewer-container">
    <nav>
      <Dropdown
        :options="viewOptions"
        class="dropdown"
        @change="handleViewChange"
      />
      <Dropdown
        :options="regionOptions"
        class="dropdown"
        @change="handleRegionChange"
      />

      <hr>

      <EnergyFilters
        v-if="selectedView === 'energy'"
        ref="energyFilters"
        :is-grouped-region="isGroupedRegion"
        :region="selectedRegion"
        @title="handleTitleChange"
        @dataset="handleDataChange"
      />

      <StripesFilters
        v-if="selectedView === 'stripes'"
        ref="stripesFilters"
        :is-grouped-region="isGroupedRegion"
        :region="selectedRegion"
        @title="handleTitleChange"
        @dataset="handleDataChange"
      />

      <hr>

      <div class="buttons">
        <button
          class="button is-primary is-rounded is-fullwidth"
          @click="handleFetchClick">Fetch</button>
        <button
          class="button is-outlined is-rounded is-fullwidth"
          @click="handleResetClick">Reset</button>
      </div>

      <!-- <button class="button is-outlined is-rounded is-fullwidth">download as csv</button> -->
    </nav>

    <section>
      <header>
        <h3>{{ tableTitle }}</h3>
      </header>
      <DataTable
        :columns="columns"
        :rows="rows"
        :show-row-num="true"
        :col-highlight-index="colHighlightIndex"
        :row-highlight-index="rowHighlightIndex"
        class="is-size-7"
        @cell-click="handleCellClick"
      />
    </section>

    <section class="detail">
      <header>
        <h3>{{ headerDetailTitle }}</h3>
      </header>
      <DataTable
        :columns="colsDetail"
        :rows="rowsDetail"
        class="is-size-7"
      />
    </section>


  </div>
</template>

<script>
import format from 'date-fns/format'

import { getEnergyRegions } from '@/constants/energy-regions.js'
import { dateFormatString } from '@/data/pages/page-stripes.js'
import { getOptionId, getOptionLabel } from '@/data/pages/page-data-check.js'

import StripesFilters from '@/components/Data/StripesFilters'
import EnergyFilters from '@/components/Data/EnergyFilters'
import Dropdown from '@/components/ui/Dropdown'
import DataTable from '@/components/Vis/DataTable'

export default {
  layout: 'no-container',
  head: {
    titleTemplate: 'OpenNEM Experiments: Data viewer'
  },

  components: {
    EnergyFilters,
    StripesFilters,
    Dropdown,
    DataTable
  },

  data() {
    return {
      regionOptions: getEnergyRegions().map(d => {
        d.value = d.id
        return d
      }),
      dataset: null,
      selectedView: null,
      selectedRegion: null,
      tableTitle: '',
      columns: null,
      rows: null,
      headerDetailTitle: '',
      colsDetail: null,
      rowsDetail: null,
      colHighlightIndex: null,
      rowHighlightIndex: null
    }
  },

  computed: {
    isGroupedRegion() {
      return this.selectedRegion === 'au' || this.selectedRegion === 'nem'
    },
    selectedRegionLabel() {
      return getOptionLabel(this.regionOptions, this.selectedRegion)
    }
  },

  created() {
    this.viewOptions = [
      {
        label: 'Energy',
        value: 'energy'
      },
      {
        label: 'Stripes',
        value: 'stripes'
      }
    ]
  },

  methods: {
    setTableTitle(region, metric, year) {
      const regionLabel = getOptionLabel(this.regionOptions, region)
      this.tableTitle = `${regionLabel}`
    },

    resetFilters() {
      if (this.selectedView === 'energy') {
        this.$refs.energyFilters.reset()
      }
      if (this.selectedView === 'stripes') {
        this.$refs.stripesFilters.reset()
      }
    },

    handleViewChange(view) {
      this.selectedView = getOptionId(this.viewOptions, view)
    },
    handleRegionChange(region) {
      this.selectedRegion = getOptionId(this.regionOptions, region)
    },

    handleDataChange(data) {
      console.log(data)
      this.dataset = data.dataset
      this.columns = data.columns
      this.rows = data.rows
    },
    handleTitleChange(title) {
      console.log(title)
      this.tableTitle = `${this.selectedRegionLabel} ${title}`
    },

    handleCellClick({ col, colIndex, row, rowIndex }) {
      console.log(col, colIndex, row, rowIndex)
      const title = `${col.label} — ${format(row.date, dateFormatString)}`
      const regionData = this.dataset.find(d => d.regionId === col.field)
      // const data = regionData
      //   ? regionData.data.find(d => d.time === row.time)
      //   : null

      const originalData = regionData
        ? regionData.originalDataset.find(d => d.time === row.time)
        : null

      console.log(regionData, regionData.originalDataset, originalData)

      if (originalData) {
        const cols = [
          {
            label: 'Key',
            textAlign: 'left',
            field: 'key',
            type: 'string'
          },
          {
            label: 'Value',
            field: 'value'
          }
        ]
        const rows = []

        // Object.keys(data).forEach(key => {
        //   rows.push({
        //     key,
        //     value: data[key]
        //   })
        // })

        Object.keys(originalData).forEach(key => {
          const type = key === 'date' ? 'date' : 'number'
          rows.push({
            key,
            value: originalData[key],
            type
          })
        })

        console.log(title, cols, rows, colIndex, rowIndex)

        this.headerDetailTitle = title
        this.colsDetail = cols
        this.rowsDetail = rows
        this.colHighlightIndex = colIndex
        this.rowHighlightIndex = rowIndex
      }
    },

    handleResetClick() {
      this.dataset = null
      this.tableTitle = ''
      this.columns = null
      this.rows = null
      this.headerDetailTitle = ''
      this.colsDetail = null
      this.rowsDetail = null
      this.colHighlightIndex = null
      this.rowHighlightIndex = null

      this.resetFilters()
    },

    handleFetchClick() {
      if (this.selectedView === 'energy') {
        this.$refs.energyFilters.fetch()
      }
      if (this.selectedView === 'stripes') {
        this.$refs.stripesFilters.fetch()
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@import '~/assets/scss/variables.scss';
@import '~/assets/scss/responsive-mixins.scss';

.data-viewer-container {
  display: flex;

  & > nav {
    width: 400px;
    padding: 2rem;
    position: -webkit-sticky;
    position: sticky;
    top: 0;
    align-self: flex-start;
  }
  & > section {
    // background: #eee;
    padding: 2rem 1rem;
    width: calc(100% - 400px);
    align-self: flex-start;

    h3 {
      font-size: 21px;
      font-family: $header-font-family;
      font-weight: 700;
    }
  }
  & > section.detail {
    width: 640px;
    padding: 2rem 2rem 2rem 1rem;
    align-self: flex-start;
  }
}

.buttons {
  button {
    margin-bottom: 0.5rem;
  }
}
</style>
