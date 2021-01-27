<template>
  <section>
    <!-- <div
      :id="tooltipId"
      class="tooltip">tooltip</div> -->

    <div
      :id="tooltipId"
      class="tooltip"/>

    <svg
      :id="id"
      :height="height"
      :width="width"
      class="heatmap" />
  </section>
</template>

<script>
import format from 'date-fns/format'
import { format as numFormat } from 'd3-format'
import { select, mouse, event } from 'd3-selection'
import { scaleSequential, scaleLinear, scaleBand } from 'd3-scale'

export default {
  props: {
    dataset: {
      type: Array,
      default: () => []
    },
    valueProp: {
      type: String,
      default: ''
    },
    tooltipValueProp: {
      type: String,
      default: ''
    },
    svgWidth: {
      type: Number,
      default: 500
    },
    svgHeight: {
      type: Number,
      default: 50
    },
    cellHeight: {
      type: Number,
      default: null
    },
    radius: {
      type: Number,
      default: 0
    },
    divisor: {
      type: [String, Number],
      default: 100
    },
    offset: {
      type: Number,
      default: 0
    },
    colourRange: {
      type: Array,
      default: () => []
    },
    colourDomain: {
      type: Array,
      default: () => []
    },
    // dateFormatString: {
    //   type: String,
    //   default: 'd MMM y'
    // },
    // numberFormatString: {
    //   type: String,
    //   default: ',.0f'
    // },
    // unit: {
    //   type: String,
    //   default: ''
    // },
    hoverDate: {
      type: Date,
      default: null
    }
  },

  data() {
    return {
      width: null,
      height: null,
      bandScale: null
    }
  },

  computed: {
    id() {
      return `heatmap-${this._uid}`
    },
    tooltipId() {
      return `tooltip-${this._uid}`
    }
  },

  watch: {
    dataset(d) {
      this.update(d)
    },
    valueProp() {
      this.update(this.dataset)
    },
    svgWidth() {
      this.setupWidthHeight(this.dataset)
      this.update(this.dataset)
    },
    hoverDate(date) {
      if (date) {
        this.$tooltip
          .style('left', this.bandScale(date.getTime()) + 'px')
          .style('pointer-events', 'none')
          .style('opacity', 1)
      } else {
        this.$tooltip.style('opacity', 0)
      }
    }
  },

  mounted() {
    this.setupWidthHeight(this.dataset)
    this.setup()
    this.update(this.dataset)
  },

  methods: {
    setupWidthHeight(data) {
      const chartWidth = this.svgWidth
      const bWidth = chartWidth / data.length

      // this.cellWidth = bWidth
      // if (this.cellWidth === 0) {
      //   this.cellWidth = 1
      // }

      const width = chartWidth
      const height = this.cellHeight || this.height

      this.width = width < 0 ? 0 : width
      this.height = height < 0 ? 0 : height
    },

    setup() {
      this.$svg = select(`#${this.id}`)
      this.$tooltip = select(`#${this.tooltipId}`)
    },

    update(data) {
      const self = this
      const cellWidth = this.width / data.length
      // const barWidth = Math.floor(cellWidth)
      const barWidth = cellWidth
      const barHeight = this.height
      const colourScale = scaleLinear()
        .domain(this.colourDomain)
        .range(this.colourRange)
      this.bandScale = scaleBand()
        .domain(data.map(d => d.time))
        .range([0, this.width])

      // const dataLength = this.expectedDataLength || data.length
      // this.$emit('svg-width', barWidth * dataLength)

      this.$tooltip
        .style('width', `${barWidth}px`)
        .style('height', `${barHeight}px`)

      this.$svg.selectAll('.cell').remove()

      const $rectGroup = this.$svg.append('g').attr('class', 'rect-group')
      const g = $rectGroup.selectAll('.cell').data(data)

      const rect = g
        .enter()
        .append('rect')
        .attr('class', 'cell')
        .attr('x', (d, i) => this.bandScale(d.time))
        .attr('width', this.bandScale.bandwidth())
        .attr('height', barHeight)
        .attr('rx', this.radius)
        .style('shape-rendering', 'crispEdges')
        .style('fill', d => {
          const divisor =
            typeof this.divisor === 'string' ? d[this.valueProp] : this.divisor
          let value =
            d[this.valueProp] || d[this.valueProp] === 0
              ? (d[this.valueProp] + this.offset) / divisor
              : null

          if (typeof this.divisor === 'string') {
            value = d[this.valueProp]
          }
          return value || value === 0
            ? colourScale(value > 1 ? 1 : value)
            : 'rgba(255, 255, 255, 0.3)'
        })

      const hoverLayer = this.$svg
        .append('g')
        .attr('class', 'hover-layer')
        .append('rect')
        .attr('width', this.width)
        .attr('height', this.height)
        .on('touchenter mouseenter mousemove touchmove', function() {
          const m = mouse(this)
          const index = Math.round(m[0] / self.bandScale.step())
          let time = self.bandScale.domain()[index]
          let point = data.find(d => d.time === time)

          if (index === data.length) {
            point = data[index - 1]
            time = data[index - 1].time
          }

          self.$emit('rect-mousemove', {
            id: self._uid,
            date: time ? new Date(time) : null,
            value:
              point &&
              (point[self.tooltipValueProp] ||
                point[self.tooltipValueProp] === 0)
                ? point[self.tooltipValueProp]
                : null
          })
          self.$tooltip
            .style('left', self.bandScale(time) + 'px')
            .style('pointer-events', 'none')
            .style('opacity', 1)
        })
        .on('mouseleave touchend', function() {
          self.$tooltip.style('opacity', 0)
          self.$emit('rect-mouseout')
        })

      //       rect
      //         .on('mouseenter', function(d) {
      //           self.$emit('rect-mousemove', {
      //             id: self._uid,
      //             date: d.date,
      //             value: d[self.tooltipValueProp]
      //           })
      //
      //           self.$tooltip
      //             .style('left', self.bandScale(d.time) + 'px')
      //             .style('pointer-events', 'none')
      //             .style('opacity', 1)
      //         })
      //         .on('mouseout', function() {
      //           self.$tooltip.style('opacity', 0)
      //           self.$emit('rect-mouseout')
      //         })
    }
  }
}
</script>

<style lang="scss" scoped>
section {
  position: relative;
}
// .tooltip {
//   background: white;
//   position: absolute;
//   top: 0;
//   padding: 2px 4px;
//   border-radius: 2px;
//   opacity: 0;
// }
.tooltip {
  background: transparent;
  position: absolute;
  top: 0;
  opacity: 0;
  border: 1px solid #e34a33;
  z-index: 9;
}
</style>
