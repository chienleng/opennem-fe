<template>
  <div class="">
    <table
      v-if="show"
      class="table is-striped is-narrow is-fullwidth is-hoverable"
    >
      <thead>
        <tr>
          <th>Row</th>
          <th
            v-for="(col, colIndex) in columns"
            :key="`column-header-${colIndex}`"
          >
            {{ col.label }}
          </th>
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="(row, rowIndex) in rows"
          :key="`row-${rowIndex}`"
        >
          <td>{{ rowIndex + 1 }}</td>
          <td
            v-for="(col, colIndex) in columns"
            :key="`column-${rowIndex}-${colIndex}`"
          >
            <span v-if="col.type === 'date'">{{ dateFormat(row[col.field]) }}</span>
            <span v-else>{{ valueFormat(row[col.field], col.formatString) }}</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import { format as numFormat } from 'd3-format'
import format from 'date-fns/format'

export default {
  props: {
    columns: {
      type: Array,
      default: () => null
    },
    rows: {
      type: Array,
      default: () => null
    }
  },

  computed: {
    show() {
      return this.columns && this.rows
    }
  },

  methods: {
    valueFormat(value, numberFormatString) {
      return numFormat(numberFormatString || ',.0f')(value)
    },
    dateFormat(date) {
      return format(date, 'dd/MM/YYY, h:mma')
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
