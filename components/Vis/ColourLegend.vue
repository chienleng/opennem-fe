<template>
  <svg
    :id="id"
    :height="svgHeight"
    :width="svgWidth"
    class="colour-legend" />
</template>

<script>
import { select, mouse } from 'd3-selection'
import { axisBottom } from 'd3-axis'
import { scaleLinear, scaleOrdinal, scaleBand } from 'd3-scale'
import { format as numFormat } from 'd3-format'

function rampHorizontal(x, color, height) {
  const size = height

  function ramp(g) {
    var image = g.selectAll('image').data([null]),
      xz = x.range(),
      x0 = xz[0],
      x1 = xz[xz.length - 1],
      canvas = document.createElement('canvas'),
      context = ((canvas.width = x1 - x0 + 1),
      (canvas.height = 1),
      canvas).getContext('2d')

    for (var i = x0; i <= x1; ++i) {
      context.fillStyle = color(x.invert(i))
      context.fillRect(i - x0, 0, 1, 1)
    }

    image = image
      .enter()
      .append('image')
      .merge(image)
      .attr('x', x0)
      .attr('y', -size)
      .attr('width', x1 - x0 + 1)
      .attr('height', size)
      .attr('preserveAspectRatio', 'none')
      .attr('xlink:href', canvas.toDataURL())
  }

  ramp.position = function(_) {
    return arguments.length ? ((x = _), ramp) : x
  }

  ramp.color = function(_) {
    return arguments.length ? ((color = _), ramp) : color
  }

  ramp.size = function(_) {
    return arguments.length ? ((size = +_), ramp) : size
  }

  return ramp
}

export default {
  props: {
    type: {
      type: String,
      default: 'ramp' // swatch, ramp
    },
    svgWidth: {
      type: Number,
      default: 350
    },
    svgHeight: {
      type: Number,
      default: 50
    },
    fontSize: {
      type: Number,
      default: 10
    },
    unit: {
      type: String,
      default: ''
    },
    multiplier: {
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
    colourDomainLabel: {
      type: Array,
      default: () => []
    },
    zeroBlock: {
      type: Boolean,
      default: false
    },
    tooltipFormat: {
      type: String,
      default: '.0f'
    }
  },

  data() {
    return {
      margin: {
        top: 0,
        right: 1,
        bottom: 20,
        left: 20
      }
    }
  },

  computed: {
    id() {
      return `colour-legend-${this._uid}`
    }
  },

  watch: {
    colourDomain() {
      this.update()
    },
    type() {
      this.update()
    },
    svgWidth() {
      this.update()
    }
  },

  mounted() {
    this.update()
  },

  methods: {
    update() {
      const svg = select(`#${this.id}`)

      const colour = scaleLinear()
        .domain(this.colourDomain)
        .range(this.colourRange)

      const xMin = this.zeroBlock ? this.margin.left : 0

      const x = scaleLinear().range([xMin, this.svgWidth - this.margin.right])

      svg.select('.zero-rect').remove()
      svg.select('.ramp-group').remove()
      svg.select('.swatch-group').remove()

      if (this.type === 'ramp') {
        this.drawRamp(svg, colour, x)
      } else if (this.type === 'swatch') {
        this.drawSwatch(svg, colour)
      }
    },

    drawRamp(svg, colour, x) {
      const self = this
      const value = d => {
        return typeof this.multiplier === 'string'
          ? d
          : d * this.multiplier - this.offset
      }
      const label = d => {
        return this.colourDomainLabel.length > 0
          ? this.colourDomainLabel[d]
          : `${value(d)}${this.unit}`
      }

      if (this.zeroBlock) {
        svg
          .append('rect')
          .attr('class', 'zero-rect')
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', this.margin.left)
          .attr('height', this.svgHeight - this.margin.bottom)
          .style('fill', colour(0))
      }

      svg
        .append('g')
        .attr('class', 'ramp-group')
        .attr(
          'transform',
          `translate(0,${this.svgHeight - this.margin.bottom})`
        )
        .call(rampHorizontal(x, colour, this.svgHeight))
        .on('mousemove touchmove', function() {
          const m = mouse(this)
          const xValue = x.invert(m[0])
          const text = numFormat(self.tooltipFormat)(value(xValue))
          const xTextPos = xValue < 0.5 ? m[0] + 10 : m[0] - 5

          $tooltipText
            .attr('x', xTextPos)
            .style('text-anchor', xValue < 0.5 ? 'start' : 'end')
            .text(text)

          const textWidth = $tooltipText.node().getComputedTextLength()
          const xRectPos = xValue < 0.5 ? m[0] + 5 : m[0] - textWidth - 10

          $tooltipRect.attr('x', xRectPos).attr('width', textWidth + 10)
          $tooltip.style('opacity', 1)
        })
        .on('mouseleave touchend', () => {
          $tooltip.style('opacity', 0)
        })
        .append('g')
        .attr('class', 'tick-group')
        .call(
          axisBottom(x)
            .ticks(2)
            .tickFormat(d => label(d))
        )
      svg.select('path.domain').remove()

      const $tooltip = svg
        .append('g')
        .attr('class', 'tooltip')
        .attr(
          'transform',
          `translate(0,${this.svgHeight - this.margin.bottom})`
        )
      const $tooltipRect = $tooltip
        .append('rect')
        .attr('class', 'tooltip-rect')
        .attr('x', 0)
        .attr('y', 5)
        .attr('rx', 3)
        .attr('height', 14)
        .style('fill', '#c74523')

      const $tooltipText = $tooltip
        .append('text')
        .attr('class', 'tooltip-text')
        .attr('x', 0)
        .attr('y', 16)
    },

    drawSwatch(svg, colour) {
      const marginLeft = 1
      const width = this.svgWidth - this.margin.right - marginLeft
      const height = this.svgHeight - this.margin.bottom - this.margin.top
      const length = this.colourDomain.length
      const x = scaleBand()
        .range([marginLeft, this.svgWidth - this.margin.right])
        .domain(this.colourDomain)
      const label = d => {
        return this.colourDomainLabel ? this.colourDomainLabel[d] : d
      }

      const $swatchGroup = svg
        .append('g')
        .attr('class', 'swatch-group')
        .selectAll('rect')
        .data(this.colourDomain)

      $swatchGroup
        .enter()
        .append('rect')
        .attr('x', d => x(d))
        .attr('y', 0)
        .attr('width', width / length)
        .attr('height', height)
        .style('fill', d => colour(d))

      $swatchGroup
        .enter()
        .append('text')
        .attr('x', d => x(d) + width / length / 2)
        .attr('y', height * 2)
        .text((d, i) => label(i))
        .style('font-size', `${this.fontSize}px`)
        .style('text-anchor', 'middle')
    }
  }
}
</script>

<style lang="scss">
.colour-legend {
  .tick-group .tick {
    &:first-child {
      text {
        text-anchor: start;
      }
    }
    &:last-child {
      text {
        text-anchor: end;
      }
    }
  }

  .tooltip-text {
    font-size: 11px;
    fill: #fff;
  }
}
</style>
