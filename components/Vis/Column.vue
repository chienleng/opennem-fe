<template>
  <div class="vis column-vis">
    <svg
      :width="svgWidth"
      :height="svgHeight"
      :id="id"
      class="column-chart">
      <g
        :transform="gTransform"
        class="axis-line-group">
        <g
          :transform="xAxisTransform"
          :class="xAxisClass" />

        <g :class="yAxisClass" />
      </g>
      <g
        :transform="columnTransform"
        class="column-group" />
      <g
        :transform="columnTransform"
        class="column-label-group" />
    </svg>
  </div>
</template>

<script>
import _debounce from 'lodash.debounce'
import { scaleOrdinal, scaleLinear, scaleBand } from 'd3-scale'
import { schemeCategory10 } from 'd3-scale-chromatic'
import { axisBottom, axisLeft } from 'd3-axis'
import { format as d3Format } from 'd3-format'
import { select as d3Select } from 'd3-selection'
import { extent as d3Extent } from 'd3-array'

import * as CONFIG from './shared/config.js'

export default {
  props: {
    dataset: {
      type: Object,
      default: () => {}
    },
    datasetPercent: {
      type: Object,
      default: () => {}
    },
    domains: {
      type: Array,
      default: () => []
    },
    // OPTIONAL: height for the chart
    visHeight: {
      type: Number,
      default: () => 200
    },
    displayPrefix: {
      type: String,
      default: () => ''
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
      x: null,
      y: null,
      z: null,
      xAxis: null,
      yAxis: null,
      column: null,
      colours: schemeCategory10,
      margin: CONFIG.DEFAULT_MARGINS,
      columnGroupClass: 'column-group',
      columnLabelGroupClass: 'column-label-group',
      xAxisClass: CONFIG.X_AXIS_CLASS,
      yAxisClass: CONFIG.Y_AXIS_CLASS,
      $columnGroup: null,
      $columnLabelGroup: null,
      $xAxisGroup: null,
      $yAxisGroup: null
    }
  },

  computed: {
    id() {
      return `column-${this._uid}`
    },
    gTransform() {
      return `translate(0,20)`
    },
    columnTransform() {
      return `translate(0,20)`
    },
    xAxisTransform() {
      return `translate(0, ${this.height})`
    },
    columnData() {
      return this.domains.map(domain => {
        const id = domain.id
        return {
          name: id,
          label: domain.label,
          value: this.dataset[id]
        }
      })
    }
  },

  watch: {
    dataset(updated) {
      if (updated) {
        this.update()
      }
    },
    domains() {
      this.setup()
      this.update()
    },
    displayPrefix() {
      this.update()
    },
    highlightDomain(domain) {
      if (domain && domain !== '') {
        this.$columnGroup
          .selectAll('rect')
          .attr('opacity', d => (d.name === domain ? 1 : 0.2))
      } else {
        this.$columnGroup.selectAll('rect').attr('opacity', 1)
      }
    }
  },

  created() {
    this.svgHeight = this.visHeight
  },

  mounted() {
    window.addEventListener(
      'resize',
      _debounce(this.handleResize, CONFIG.DEBOUNCE_MILLISECONDS)
    )
    this.setupWidthHeight()
    this.setup()
    if (this.dataset) {
      this.update()
    }
  },

  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize)
  },

  methods: {
    setupWidthHeight() {
      const chartWidth = this.$el.offsetWidth
      const width = chartWidth - this.margin.left - this.margin.right
      const height = this.svgHeight
      this.svgWidth = chartWidth
      this.width = width < 0 ? 0 : width
      this.height = height < 0 ? 0 : height - 33
    },

    setup() {
      // Select the svg groups for this vis instance
      const self = this
      const $svg = d3Select(`#${this.id}`)

      // Axis
      this.$xAxisGroup = $svg.select(`.${this.xAxisClass}`)
      this.$yAxisGroup = $svg.select(`.${this.yAxisClass}`)

      // Define x, y, z scale types
      this.x = scaleBand()
        .range([60, this.width - 30])
        .padding(0.1)
      this.y = scaleLinear().range([this.height, 0])
      this.z = scaleOrdinal() // Colour

      // Set up where x, y axis appears
      this.xAxis = axisBottom(this.x).tickSize(-this.height)
      this.yAxis = axisLeft(this.y)
        .tickSize(-this.width)
        .ticks(5)
        .tickFormat(d => d3Format(CONFIG.Y_AXIS_FORMAT_STRING)(d))
    },

    update() {
      const self = this
      this.$columnGroup = d3Select(`#${this.id} .${this.columnGroupClass}`)
      this.$columnLabelGroup = d3Select(
        `#${this.id} .${this.columnLabelGroupClass}`
      )

      const xDomains = this.domains.map(d => d.id)
      const zColours = this.domains.map(d => d.colour)

      const data = this.columnData
      const yValues = data.map(d => d.value)
      const yExtent = d3Extent(yValues)
      if (yExtent[0] > 0) {
        yExtent[0] = 0
      }
      if (yExtent[1] < 0) {
        yExtent[1] = 0
      }

      this.x.domain(xDomains)
      this.y.domain(yExtent).nice()
      this.z.range(zColours).domain(xDomains)

      // this.$xAxisGroup.call(this.xAxis)
      this.$yAxisGroup.call(this.customYAxis)
      this.drawColumns()
      this.drawColumnLabels()
    },

    customYAxis(g) {
      g.call(this.yAxis)
      g.selectAll('.tick text')
        .text(t => this.convertValue(t))
        .attr('x', 4)
        .attr('dy', -4)
      g.selectAll('.tick line').attr('class', d => (d === 0 ? 'base' : ''))
    },

    drawColumns() {
      this.$columnGroup
        .selectAll('rect')
        .data(this.columnData)
        .join('rect')
        .attr('x', d => this.x(d.name))
        .attr('y', d => (d.value > 0 ? this.y(d.value) : this.y(0)))
        .attr('height', d => Math.abs(this.y(0) - this.y(d.value)))
        .attr('width', this.x.bandwidth())
        .attr('fill', d => this.z(d.name))
        .attr('class', d => `${d.name}`)
    },

    drawColumnLabels() {
      this.$columnLabelGroup
        .selectAll('text')
        .data(this.columnData)
        .join('text')
        .attr('x', d => this.x(d.name))
        .attr('y', d => (d.value > 0 ? this.y(d.value) : this.y(0)))
        .attr(
          'dy',
          d => (d.value > 0 ? -2 : Math.abs(this.y(0) - this.y(d.value)) + 11)
        )
        // .attr('transform', 'rotate(-1)')
        // .text(d => d.label)
        .text(d => {
          const percent = this.datasetPercent[d.name]
          const value = this.$options.filters.formatValue(
            this.convertValue(d.value)
          )
          let string = value

          return string
        })

      this.$columnLabelGroup
        .selectAll('text')
        .data(this.columnData)
        .append('tspan')
        .style('fill', '#444')
        .style('font-size', '9px')
        .text(d => {
          const bandwidth = this.x.bandwidth()
          const percent = this.datasetPercent[d.name]
          let string = ''
          if (percent && bandwidth > 60) {
            string += ` (${this.$options.filters.formatValue(percent)}%)`
          }
          return string
        })
    },

    resizeRedraw() {
      this.x.range([60, this.width - 30])
      this.y.range([this.height, 0])
      this.yAxis.tickSize(-this.width)

      this.$yAxisGroup.call(this.customYAxis)
      this.drawColumns()
      this.drawColumnLabels()
    },

    handleResize() {
      this.setupWidthHeight()
      this.resizeRedraw()
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
