<template>
  <div class="vis donut-vis">
    <svg
      :width="svgWidth"
      :height="svgHeight"
      :id="id"
      :viewBox="viewBox"
      class="donut-chart">
      <g class="slices" />
      <g
        v-if="hoverOnSlice"
        class="total">
        <text
          class="total-label"
          dy="-10">{{ hoverOnSliceLabel }}</text>
        <text dy="12">{{ hoverOnSlicePercent | percentageFormatNumber }}</text>
      </g>
      <g
        v-else
        class="total">
        <text
          v-if="isTotalPower"
          class="total-label"
          dy="-10">Average</text>
        <text
          v-if="unit === ' TWh'"
          dy="10">{{ total | customFormatValue }}{{ unit }}</text>
        <text
          v-else
          dy="10">{{ total | formatValue }}{{ unit }}</text>
      </g>
    </svg>
  </div>
</template>

<script>
import _debounce from 'lodash.debounce'
import { scaleOrdinal as d3ScaleOrdinal } from 'd3-scale'
import { pie as d3Pie, arc as d3Arc } from 'd3-shape'
import { select as d3Select } from 'd3-selection'
import { mean as d3Mean } from 'd3-array'

export default {
  props: {
    unit: {
      type: String,
      default: () => ''
    },
    dataset: {
      type: Array,
      default: () => []
    },
    domains: {
      type: Array,
      default: () => []
    },
    dynamicExtent: {
      type: Array,
      default: () => []
    },
    hoverData: {
      type: Object,
      default: () => null
    },
    hoverOn: {
      type: Boolean,
      default: () => false
    },
    focusData: {
      type: Object,
      default: () => null
    },
    focusOn: {
      type: Boolean,
      default: () => false
    },
    convertValue: {
      type: Function,
      default: () => function() {}
    },
    highlightDomain: {
      type: String,
      default: null
    }
  },

  data() {
    return {
      svgWidth: 0,
      svgHeight: 0,
      width: 0,
      height: 0,
      radius: 0,
      pie: null,
      arc: null,
      colour: null,
      hoverOnSlice: false,
      hoverOnSliceData: null,
      $donut: null
    }
  },

  computed: {
    id() {
      return `donut-${this._uid}`
    },
    donutDataset() {
      const domains = this.domains
      const dataset = this.dataset

      if (this.hoverOn && this.hoverData) {
        return domains.map(domain => {
          const id = domain.id
          return {
            name: id,
            value: this.hoverData[id]
          }
        })
      } else if (this.focusOn && this.focusData) {
        return domains.map(domain => {
          const id = domain.id
          return {
            name: id,
            value: this.focusData[id]
          }
        })
      }

      return domains.map(domain => {
        const id = domain.id
        return {
          name: id,
          value: dataset.reduce((a, b) => a + (b[id] || 0), 0)
        }
      })
    },

    updatedDataset() {
      const domains = this.domains
      const dataset = this.dataset
      return dataset.map(d => {
        let total = null
        domains.forEach(domain => {
          total += d[domain.id]
        })
        return {
          _totalSources: total
        }
      })
    },

    isTotalPower() {
      return this.unit === ' MW' && (!this.hoverOn && !this.focusOn)
    },

    total() {
      let total = 0
      if (this.isTotalPower) {
        total = d3Mean(this.updatedDataset, d => d._totalSources)
      } else {
        total = this.donutDataset.reduce((a, b) => a + b.value, 0)
      }
      return this.convertValue(total)
    },

    domainIds() {
      return this.domains.map(d => d.id).reverse()
    },

    domainColours() {
      return this.domains.map(d => d.colour).reverse()
    },

    viewBox() {
      return `${-this.width / 2},${-this.height / 2},${this.width},
        ${this.height}
      `
    },

    hoverOnSliceLabel() {
      return this.hoverOnSliceData ? this.hoverOnSliceData.label : ''
    },
    hoverOnSliceValue() {
      return this.hoverOnSliceData ? this.hoverOnSliceData.value : ''
    },
    hoverOnSlicePercent() {
      const total = this.donutDataset.reduce((a, b) => a + b.value, 0)
      return this.hoverOnSliceData
        ? (this.hoverOnSliceData.value / total) * 100
        : ''
    }
  },

  watch: {
    donutDataset() {
      this.update()
    },
    highlightDomain(domain) {
      if (domain && domain !== '') {
        this.$donut
          .selectAll('path')
          .attr('opacity', d => (d.data.name === domain ? 1 : 0.2))
      } else {
        this.$donut.selectAll('path').attr('opacity', 1)
      }
    }
  },

  mounted() {
    window.addEventListener('resize', _debounce(this.handleResize, 10))
    this.setupWidthHeight()
    this.setup()
    this.update()
  },

  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize)
  },

  methods: {
    setupWidthHeight() {
      const chartWidth = 300
      this.svgWidth = chartWidth
      this.svgHeight = chartWidth
      this.width = chartWidth
      this.height = chartWidth
      this.radius = Math.min(this.width, this.height) / 2
    },

    handleResize() {
      this.setupWidthHeight()
      // this.resizeRedraw()
    },

    setup() {
      this.$donut = d3Select(`#${this.id} .slices`)

      this.pie = d3Pie()
        .padAngle(0.005)
        .sort(null)
        .value(d => d.value)
      this.arc = d3Arc()
        .innerRadius(this.radius * 0.5)
        .outerRadius(this.radius - 1)
      this.colour = d3ScaleOrdinal()
    },

    update() {
      this.colour.range(this.domainColours).domain(this.domainIds)

      const arcs = this.pie(this.donutDataset)
      this.$donut
        .selectAll('path')
        .data(arcs)
        .join('path')
        .attr('d', this.arc)
        .attr('fill', d => this.colour(d.data.name))
        .on('mouseover', slice => {
          const id = slice.data.name
          const find = this.domains.find(d => d.id === id)
          find.value = slice.data.value
          this.hoverOnSliceData = find
          this.hoverOnSlice = true
        })
        .on('mouseout', () => {
          this.hoverOnSliceData = null
          this.hoverOnSlice = false
        })
    }
  }
}
</script>
<style lang="scss" scoped>
@import '~/assets/scss/variables.scss';
.donut-vis {
  text-align: center;
}
.total text {
  fill: #444;
  font-size: 17px;

  &.total-label {
    fill: #666;
    font-size: 12px;
  }
}
</style>
