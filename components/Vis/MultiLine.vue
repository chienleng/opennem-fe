<template>
  <div class="vis multi-line-vis">
    <svg
      :width="svgWidth"
      :height="svgHeight"
      :id="id">

      <defs>
        <!-- where to clip -->
        <clipPath :id="`${id}-clip`">
          <rect
            :width="width"
            :height="height"/>
        </clipPath>
        <filter id="shadow">
          <feDropShadow
            dx="0"
            dy="1"
            stdDeviation="1"
            flood-color="rgba(0, 0, 0, 0.2)" />
        </filter>
      </defs>

      <g
        :transform="axisTransform"
        class="x-axis" />
      <g
        :transform="axisTransform"
        class="y-axis" />
      <g
        :transform="axisTransform"
        class="x-shades" />
      <g
        :transform="axisTransform"
        class="cursor-line-group" />
      <g
        :transform="axisTransform"
        class="hover-group" />
      <g
        :transform="axisTransform"
        class="vis1-group" />
      <g
        :transform="axisTransform"
        class="vis2-group" />
      <g
        :transform="axisTransform"
        class="y-axis-left-text" />
      <g
        :transform="axisTransform"
        class="y-axis-right-text" />

    </svg>
  </div>
</template>

<script>
import _cloneDeep from 'lodash.clonedeep'
import { select, mouse } from 'd3-selection'
import { scaleOrdinal, scaleLinear, scaleTime, scaleSymlog } from 'd3-scale'
import { axisBottom, axisLeft, axisRight } from 'd3-axis'
import {
  area as d3Area,
  line as d3Line,
  stack,
  curveStepAfter,
  curveLinear,
  curveMonotoneX
} from 'd3-shape'
import { extent } from 'd3-array'

export default {
  props: {
    svgHeight: {
      type: Number,
      default: () => 200
    },
    marginTop: {
      type: Number,
      default: () => 0
    },
    marginRight: {
      type: Number,
      default: () => 1
    },
    marginBottom: {
      type: Number,
      default: () => 1
    },
    marginLeft: {
      type: Number,
      default: () => 10
    },
    domains1: {
      type: Array,
      default: () => []
    },
    domains2: {
      type: Array,
      default: () => []
    },
    highlightDomain: {
      type: String,
      default: () => null
    },
    dataset1: {
      type: Array,
      default: () => []
    },
    dataset2: {
      type: Array,
      default: () => []
    },
    curve: {
      type: String,
      default: () => 'smooth'
    },
    dateHovered: {
      type: Date,
      default: () => null
    },
    zoomRange: {
      type: Array,
      default: () => []
    },
    xTicks: {
      type: Function,
      default: () => null
    },
    xShades: {
      type: Array,
      default: () => []
    },
    y1Min: {
      type: Number,
      default: () => 0
    },
    y1Max: {
      type: Number,
      default: () => 300
    },
    y1Ticks: {
      type: Array,
      default: () => []
    },
    y1Log: {
      type: Boolean,
      default: () => false
    },
    y1Invert: {
      type: Boolean,
      default: () => false
    },
    y1TickText: {
      type: Boolean,
      default: () => true
    },
    y1AxisUnit: {
      type: String,
      default: () => ''
    },
    showY2: {
      type: Boolean,
      default: () => false
    },
    y2Min: {
      type: Number,
      default: () => 0
    },
    y2Max: {
      type: Number,
      default: () => 300
    },
    y2AxisUnit: {
      type: String,
      default: () => ''
    },
    pathStrokeWidth: {
      type: Number,
      default: () => 1.5
    },
    showCursorDots: {
      type: Boolean,
      default: () => true
    },
    cursorAnchor: {
      type: String,
      default: () => 'start' // like text-anchor: start, middle, end
    },
    drawIncompleteBucket: {
      type: Boolean,
      default: () => true
    },
    stacked: {
      type: Boolean,
      default: () => false
    },
    toggled: {
      type: Boolean,
      default: () => false
    },
    displayPrefix: {
      type: String,
      default: () => ''
    },
    shouldConvertValue: {
      type: Boolean,
      default: () => false
    },
    convertValue: {
      type: Function,
      default: () => function() {}
    }
  },

  data() {
    return {
      svgWidth: 0,
      width: 0,
      height: 0,
      x: null,
      y1: null,
      y2: null,
      z: null,
      xAxis: null,
      yAxisLeft: null,
      yAxisRight: null,
      y1Range: null,
      y2Range: null,
      area: null,
      stack: null,
      vis1: null,
      lineRight: null,
      $xAxisGroup: null,
      $yAxisGroup: null,
      $yAxisLeftTextGroup: null,
      $yAxisRightTextGroup: null,
      $vis1Group: null,
      $vis2Group: null,
      $cursorLineGroup: null,
      $cursorRect: null,
      $cursorLine: null,
      $cursorDotsGroup: null,
      $hoverGroup: null,
      $xShadesGroup: null
    }
  },

  computed: {
    id() {
      return `multi-line-${this.uuid}`
    },
    clipPathUrl() {
      return `url(#${this.id}-clip)`
    },
    axisTransform() {
      return `translate(${this.marginLeft},0)`
    },
    curveType() {
      switch (this.curve) {
        case 'step':
          return curveStepAfter
        case 'straight':
          return curveLinear
        case 'smooth':
        default:
          return curveMonotoneX
      }
    },
    keys1() {
      return this.domains1 ? this.domains1.map(d => d.domain) : []
    },
    colours1() {
      const dict = {}
      this.domains1.forEach(d => {
        dict[d.domain] = d.colour
      })
      return dict
    },
    keys2() {
      return this.domains2.map(d => d.domain)
    },
    colours2() {
      const dict = {}
      this.domains2.forEach(d => {
        dict[d.domain] = d.colour
      })
      return dict
    },
    xExtent() {
      return extent(this.updatedDataset1, d => new Date(d.date))
    },
    hasHighlight() {
      return this.highlightDomain ? true : false
    },
    updatedDataset1() {
      if (this.dataset1.length > 0) {
        const updated = _cloneDeep(this.dataset1)
        const lastSecondItem = _cloneDeep(updated[updated.length - 2])
        const lastItem = _cloneDeep(updated[updated.length - 1])
        const intervalTime = lastItem.time - lastSecondItem.time
        lastItem.time = lastItem.time + intervalTime
        lastItem.date = new Date(lastItem.time)
        updated.push(lastItem)
        return updated
      }
      return []
    }
  },

  watch: {
    toggled(isToggle) {
      if (isToggle) {
        this.setupWidthHeight()
        this.setup()
        this.draw()
      }
    },
    showY2(show) {
      if (show) {
        this.drawDataset2()
      } else {
        this.removeDataset2()
      }
    },
    domains1(updated) {
      this.clearCursorLine()
      this.draw()
    },
    dataset1() {
      this.setupWidthHeight()
      this.setup()
      this.draw()
    },
    dateHovered(newValue) {
      if (newValue) {
        this.drawCursor(newValue)
      } else {
        this.clearCursorLine()
      }
    },
    zoomRange(newRange) {
      if (newRange.length > 0) {
        this.x.domain(newRange)
      } else {
        this.x.domain(this.xExtent)
      }
      this.redraw()
    },
    xTicks(newTicks) {
      this.xAxis.ticks(newTicks)
      this.redraw()
    },
    highlightDomain(domain) {
      if (domain) {
        this.$vis1Group
          .selectAll('path')
          .attr('opacity', d => (d === domain ? 1 : 0.2))
      } else {
        this.$vis1Group.selectAll('path').attr('opacity', 1)
      }
    },
    curveType(type) {
      this.vis1.curve(type)
      this.redraw()
    },
    displayPrefix() {
      this.$yAxisLeftTextGroup.call(this.drawLeftYAxisText)
    }
  },

  mounted() {
    this.setupWidthHeight()
    this.setup()

    window.addEventListener('resize', this.handleResize)
  },

  updated() {
    this.setupWidthHeight()
    this.setup()
    this.draw()
  },

  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize)
  },

  methods: {
    handleResize() {
      this.setupWidthHeight()
      this.resize()
    },

    resize() {
      this.x.range([0, this.width])
      this.y1.range(this.y1Range)
      if (!this.y1Log) {
        this.y1.nice()
      }
      this.xAxis.tickSize(this.height)
      this.yAxisLeft.tickSize(-this.width)
      this.$xAxisGroup.call(this.drawXAxis)
      this.$yAxisGroup.call(this.drawLeftYAxis)
      this.$yAxisLeftTextGroup.call(this.drawLeftYAxisText)

      if (this.showY2) {
        this.y2.range(this.y2Range)
        this.yAxisRight.tickSize(this.width)
        this.$yAxisRightTextGroup.call(this.drawRightYAxisText)
      }

      this.$hoverGroup
        .select('rect')
        .attr('width', this.width)
        .attr('height', this.height)

      this.redrawLineShades()
    },

    setupWidthHeight() {
      const chartWidth = this.$el.offsetWidth
      const width = chartWidth - this.marginLeft - this.marginRight
      const height = this.svgHeight - this.marginTop - this.marginBottom

      this.svgWidth = chartWidth
      this.width = width < 0 ? 0 : width
      this.height = height < 0 ? 0 : height
    },

    setup() {
      const self = this
      const $svg = select(`#${this.id}`)
      // Axis DOM
      this.$xAxisGroup = $svg.select('.x-axis')
      this.$yAxisGroup = $svg.select('.y-axis')
      this.$yAxisLeftTextGroup = $svg.select('.y-axis-left-text')
      this.$yAxisRightTextGroup = $svg.select('.y-axis-right-text')

      // Define scales
      this.y1Range = this.y1Invert ? [0, this.height] : [this.height, 0]
      this.y2Range = [this.height, 0]
      this.x = scaleTime().range([0, this.width])
      this.y1 = this.y1Log
        ? scaleSymlog().range(this.y1Range)
        : scaleLinear()
            .range(this.y1Range)
            .nice()
      this.y2 = scaleLinear()
        .range(this.y2Range)
        .nice()
      this.z = scaleOrdinal()

      // Axis
      this.xAxis = axisBottom(this.x)
        .tickSize(this.height)
        .ticks(this.xTicks)
      this.yAxisLeft =
        this.y1Ticks.length > 0
          ? axisLeft(this.y1)
              .tickSize(-this.width)
              .tickValues(this.y1Ticks)
          : axisLeft(this.y1)
              .tickSize(-this.width)
              .ticks(5)
      this.yAxisRight = axisRight(this.y2)
        .tickSize(this.width)
        .ticks(5)

      // x axis shading
      this.$xShadesGroup = $svg.select('.x-shades')

      // Vis
      this.$vis1Group = $svg.select('.vis1-group')
      this.stack = stack()
      if (this.stacked) {
        this.vis1 = d3Area()
          .x(d => this.x(d.data.date))
          .y0(d => this.y1(d[0]))
          .y1(d => this.y1(d[1]))
          .curve(this.curveType)
      } else {
        this.vis1 = d3Line()
          .x(d => this.x(d.date))
          .y(d => this.y1(d.value))
          .curve(this.curveType)
        this.vis1.defined(d => d.value || d.value === 0)
      }

      this.$vis2Group = $svg.select('.vis2-group')
      this.lineRight = d3Line()
        .x(d => this.x(d.date))
        .y(d => this.y2(d.value))
        .curve(curveMonotoneX)
      this.lineRight.defined(d => d.value || d.value === 0)

      // Hover
      this.$hoverGroup = $svg.select('.hover-group')
      this.$hoverGroup.select('rect').remove()
      this.$hoverGroup
        .append('rect')
        .attr('width', this.width)
        .attr('height', this.height)

      this.$cursorLineGroup = $svg.select('.cursor-line-group')
      if (!this.$cursorRect) {
        this.$cursorRect = this.$cursorLineGroup.append('rect')
      }
      if (!this.$cursorLine) {
        this.$cursorLine = this.$cursorLineGroup.append('line')
      }
      if (!this.$cursorDotsGroup) {
        this.$cursorDotsGroup = this.$cursorLineGroup.append('g')
      }

      // Events
      this.$hoverGroup.on('touchmove mousemove', function() {
        const date = self.getXAxisDateByMouse(this)
        self.$emit('date-hover', this, date)
      })
      $svg.on('mouseenter', () => {
        this.handleSvgEnter()
      })
      $svg.on('mouseleave', () => {
        this.handleSvgLeave()
      })
    },

    handleSvgEnter() {
      this.$emit('enter')
    },
    handleSvgLeave() {
      this.$cursorDotsGroup.selectAll('circle').remove()
      this.$emit('date-hover', null, null)
      this.$emit('leave')
    },

    draw() {
      const self = this
      if (this.zoomRange.length > 0) {
        this.x.domain(this.zoomRange)
      } else {
        this.x.domain(this.xExtent)
      }
      this.y1.domain([this.y1Min, this.y1Max])
      this.y2.domain([this.y2Min, this.y2Max])
      if (!this.y1Log) {
        this.y1.nice()
      }

      this.$xAxisGroup.call(this.drawXAxis)
      this.$yAxisGroup.call(this.drawLeftYAxis)
      this.$yAxisLeftTextGroup.call(this.drawLeftYAxisText)

      this.$xShadesGroup.selectAll('rect').remove()
      this.$xShadesGroup
        .selectAll('rect')
        .data(this.xShades)
        .enter()
        .append('rect')
        .attr('opacity', 0.05)
        .attr('x', d => this.x(d.start))
        .attr('width', d => this.x(d.end) - this.x(d.start))
        .attr('height', this.height)

      this.$vis1Group.selectAll('path').remove()

      if (this.stacked) {
        this.stack.keys(this.keys1).value((d, key) => (d[key] ? d[key] : 0))
      }

      const vis1 = this.stacked
        ? this.$vis1Group
            .selectAll('path')
            .data(this.stack(this.updatedDataset1))
        : this.$vis1Group.selectAll('path').data(this.keys1)

      if (this.stacked) {
        vis1
          .enter()
          .append('path')
          .attr('class', key => `${key}-path`)
          .attr('d', this.vis1)
          .attr('stroke-opacity', 0)
          .attr('fill', d => this.colours1[d.key])
          .style('clip-path', this.clipPathUrl)
          .style('-webkit-clip-path', this.clipPathUrl)
          .style('pointer-events', 'auto')
      } else {
        vis1
          .enter()
          .append('path')
          .attr('class', key => `${key}-path`)
          .style('stroke', key => this.colours1[key])
          .style('stroke-width', this.pathStrokeWidth)
          .style('filter', 'url(#shadow)')
          .style('fill', 'transparent')
          .style('clip-path', this.clipPathUrl)
          .style('-webkit-clip-path', this.clipPathUrl)
          .attr('d', this.drawVis1Path)
      }

      this.$vis1Group.selectAll('path').on('mousemove touchmove', function(d) {
        const date = self.getXAxisDateByMouse(this)
        self.$emit('date-hover', this, date)
        self.$emit('domain-hover', d)
      })

      if (this.showY2) {
        this.drawDataset2()
      }
    },

    redraw() {
      this.$xAxisGroup.call(this.drawXAxis)
      this.redrawLineShades()
    },

    redrawLineShades() {
      if (this.stacked) {
        this.$vis1Group.selectAll('path').attr('d', this.vis1)
      } else {
        this.$vis1Group.selectAll('path').attr('d', this.drawVis1Path)
      }
      this.$vis2Group.selectAll('path').attr('d', this.drawLineRightPath)
      this.$xShadesGroup
        .selectAll('rect')
        .attr('x', d => this.x(d.start))
        .attr('width', d => this.x(d.end) - this.x(d.start))
    },

    drawDataset2() {
      let y2Height = this.y1(0)
      if (y2Height <= 0 || this.domains1.length === 0) {
        y2Height = this.height
      }
      this.y2
        .range([y2Height, 0])
        .domain([this.y2Min, this.y2Max])
        .nice()
      this.$yAxisRightTextGroup.call(this.drawRightYAxisText)
      this.$vis2Group.selectAll('path').remove()
      this.$vis2Group
        .selectAll('path')
        .data(this.keys2)
        .enter()
        .append('path')
        .attr('class', key => `${key}-path`)
        .style('stroke', key => this.colours2[key])
        .style('stroke-width', 2)
        .style('filter', 'url(#shadow)')
        .style('fill', 'transparent')
        .style('clip-path', this.clipPathUrl)
        .style('-webkit-clip-path', this.clipPathUrl)
        .attr('d', this.drawLineRightPath)
    },
    removeDataset2() {
      this.$vis2Group.selectAll('path').remove()
      this.$yAxisRightTextGroup.selectAll('path').remove()
      this.$yAxisRightTextGroup.selectAll('.tick').remove()
    },

    drawXAxis(g) {
      g.call(this.xAxis)
      g.selectAll('.x-axis .tick text').remove()
    },

    drawLeftYAxis(g) {
      g.call(this.yAxisLeft)
      g.selectAll('.y-axis .tick text').remove()
    },

    drawLeftYAxisText(g) {
      g.call(this.yAxisLeft)
      g.selectAll('.y-axis-left-text .tick line').remove()
      g.selectAll('.y-axis-left-text .tick text')
        .text(t => {
          const tickText = this.shouldConvertValue ? this.convertValue(t) : t
          return `${tickText}${this.y1AxisUnit}`
        })
        .attr('dx', 5)
        .attr('dy', -2)
        .attr('opacity', this.y1TickText ? 1 : 0)
    },

    drawRightYAxisText(g) {
      g.call(this.yAxisRight)
      g.selectAll('.y-axis-right-text .tick line').remove()
      g.selectAll('.y-axis-right-text .tick text')
        .text(t => `${t}${this.y2AxisUnit}`)
        .attr('dx', -5)
        .attr('dy', -2)
        .attr('opacity', this.y1TickText ? 1 : 0)
    },

    drawVis1Path(key) {
      const data = this.updatedDataset1.map(d => {
        if (this.drawIncompleteBucket) {
          return {
            date: d.date,
            value: d[key]
          }
        }
        return {
          date: d.date,
          value: d._isIncompleteBucket ? null : d[key]
        }
      })
      return this.vis1(data)
    },

    drawLineRightPath(key) {
      const data = this.dataset2.map(d => {
        if (this.drawIncompleteBucket) {
          return {
            date: d.date,
            value: d[key]
          }
        }
        return {
          date: d.date,
          value: d._isIncompleteBucket ? null : d[key]
        }
      })
      return this.lineRight(data)
    },

    drawCursor(date) {
      const xDate = this.x(date)
      let nextDate = null
      const dataPoint = this.updatedDataset1.find((d, i) => {
        const time = d.time || d.date
        const match = time === date.getTime()
        const nextDataPoint = this.updatedDataset1[i + 1]
        if (match && nextDataPoint) {
          nextDate = nextDataPoint.time || nextDataPoint.date
        }
        return match
      })

      const nextXDate = this.x(nextDate)
      const bandwidth = Math.abs(nextXDate - xDate)

      // Draw line
      this.$cursorLine
        .attr('x1', xDate)
        .attr('y1', 0)
        .attr('x2', xDate)
        .attr('y2', this.height)
        .style('stroke', 'transparent')

      if (this.showCursorDots) {
        if (dataPoint) {
          const dots = this.$cursorDotsGroup
            .selectAll('circle')
            .data(this.keys1)
          dots
            .enter()
            .append('circle')
            .merge(dots)
            .attr('cx', this.x(dataPoint.date))
            .attr('cy', key => this.y1(dataPoint[key]))
            .attr('r', 2)
            .attr('fill', key => this.colours1[key])
            .exit()
            .remove()
        } else {
          this.$cursorDotsGroup.selectAll('circle').remove()
        }
      }

      // Draw bucket
      if (bandwidth) {
        let xPos = xDate
        // if (this.cursorAnchor === 'middle') {
        //   xPos = xDate - bandwidth / 2
        // }
        this.$cursorRect
          .attr('x', xPos)
          .attr('width', bandwidth)
          .attr('height', this.height)
      } else {
        this.clearCursorLine()
      }
    },

    clearCursorLine() {
      this.$cursorRect.attr('width', 0).attr('height', 0)
    },

    getXAxisDateByMouse(evt) {
      const m = mouse(evt)
      const date = this.x.invert(m[0])
      return date
    }
  }
}
</script>

<style lang="scss" scoped>
.multi-line-vis ::v-deep svg {
  .y-axis-left-text .tick text {
    color: #000;
    text-anchor: start;
  }
  .y-axis-right-text .tick text {
    color: #000;
    text-anchor: end;
  }
  .hover-group rect {
    fill: transparent;
  }
  .cursor-line-group rect {
    fill: rgba(199, 69, 35, 0.1);
  }
}
</style>
