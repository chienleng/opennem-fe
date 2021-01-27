<template>
  <div class="hover-date-value">
    <span class="date">{{ hoverObj.date }}</span>
    <span class="value">{{ hoverObj.value }}</span>
  </div>
</template>

<script>
import { format as numFormat } from 'd3-format'
import format from 'date-fns/format'

export default {
  props: {
    isYearly: {
      type: Boolean,
      default: false
    },
    hoverDate: {
      type: Date,
      default: null
    },
    data: {
      type: Array,
      default: () => []
    },
    hoverValue: {
      type: Number,
      default: null
    },
    metricData: {
      type: Object,
      default: () => {}
    },
    selectedMetric: {
      type: String,
      default: null
    },
    selectedMetricObject: {
      type: Object,
      default: () => {}
    },
    selectedPeriod: {
      type: Object,
      default: () => {}
    },
    hoverDisplay: {
      type: Object,
      default: null
    }
  },

  computed: {
    hoverObj() {
      if (this.hoverDisplay) {
        return this.hoverDisplay
      }

      const obj = {
        date: '',
        value: '—'
      }

      if (this.hoverDate) {
        obj.date = this.getHoverDate(this.hoverDate)
        if (this.isYearly) {
          if (this.hoverValue || this.hoverValue === 0) {
            obj.value = `${this.valueFormat(this.hoverValue)}${
              this.selectedMetricObject.unit
            }`
          }
        } else {
          obj.value = this.getHoverValue(
            this.data,
            this.hoverDate,
            this.selectedMetric
          )
        }
      }
      return obj
    }
  },

  watch: {
    hoverObj(obj) {
      this.$emit('hover-obj', obj)
    }
  },

  methods: {
    getHoverDate(date) {
      return format(date, this.selectedPeriod.dateFormatString)
    },

    getHoverValue(data, date, selectedMetric) {
      const find = data.find(d => d.time === date.getTime())
      return find && (find[selectedMetric] || find[selectedMetric] === 0)
        ? `${this.valueFormat(find[selectedMetric])}${
            this.selectedMetricObject.unit
          }`
        : '—'
    },

    valueFormat(value) {
      const numberFormatString =
        this.selectedMetricObject.numberFormatString || ',.0f'
      return numFormat(numberFormatString)(value)
    }
  }
}
</script>

<style lang="scss" scoped>
.hover-date-value {
  font-size: 0.8em;
  display: flex;
  align-items: flex-end;
  position: absolute;
  right: 0;
  top: -25px;
  span {
    padding: 3px 12px 2px;
    white-space: nowrap;
  }
  .date {
    background-color: rgba(199, 69, 35, 0.1);
    color: #444;
    font-weight: 600;
    border-radius: 20px 0 0 20px;
  }
  .value {
    border-radius: 0 20px 20px 0;
    background-color: rgba(255, 255, 255, 0.5);
  }
}
</style>
