<template>
  <div class="data-table">
    <table
      v-if="show"
      class="table is-striped is-narrow is-fullwidth is-hoverable"
    >
      <thead>
        <tr>
          <th v-if="showRowNum" />
          <th
            v-for="(col, colIndex) in columns"
            :key="`column-header-${colIndex}`"
            :class="{
              'has-text-left': col.textAlign === 'left'
            }"
          >
            {{ col.label }}
          </th>
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="(row, rowIndex) in rows"
          :key="`row-${rowIndex}`"
          :class="{
            highlight: rowIndex === rowHighlightIndex
          }"
        >
          <td
            v-if="showRowNum"
            class="num-col"
          >{{ rowIndex + 1 }}</td>
          <td
            v-for="(col, colIndex) in columns"
            :key="`column-${rowIndex}-${colIndex}`"
            :class="{
              'has-text-left': col.textAlign === 'left',
              highlight: colIndex === colHighlightIndex,
              focus: colIndex === colHighlightIndex && rowIndex === rowHighlightIndex
            }"
            @click="handleCellClick(col, colIndex, row, rowIndex)"
          >
            <span v-if="col.type === 'date'">
              {{ dateFormat(row[col.field], col.formatString) }}
            </span>
            <span v-else-if="col.type === 'string'">
              {{ row[col.field] }}
            </span>
            <span v-else>
              {{ valueFormat(row[col.field], col.formatString) }}
              <!-- {{ (row[col.field]) }} -->
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import { format as numFormat } from 'd3-format'
import parseISO from 'date-fns/parseISO'
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
    },
    colHighlightIndex: {
      type: Number,
      default: () => null
    },
    rowHighlightIndex: {
      type: Number,
      default: () => null
    },
    showRowNum: {
      type: Boolean,
      default: false
    }
  },

  computed: {
    show() {
      return this.columns && this.rows
    }
  },

  methods: {
    valueFormat(value, formatString) {
      return formatString ? numFormat(formatString)(value) : value
    },
    dateFormat(dateValue, formatString) {
      const date = typeof date === 'string' ? parseISO(dateValue) : dateValue
      return format(date, formatString || 'dd/MM/YYY, h:mma')
    },

    handleCellClick(col, colIndex, row, rowIndex) {
      this.$emit('cell-click', { col, colIndex, row, rowIndex })
    }
  }
}
</script>

<style lang="scss" scoped>
.data-table {
  th,
  td {
    text-align: right;
    vertical-align: middle;

    &.highlight {
      background-color: #eee;
    }

    &.focus {
      background-color: #e34a33 !important;
      color: white;
    }
  }

  .highlight {
    td,
    th {
      background-color: #eee;
    }
  }

  .num-col {
    font-size: 0.8em;
    font-weight: 700;
    color: #999;
  }
}
</style>
