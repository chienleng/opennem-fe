export function getStripesTableData({
  dataset,
  selectedMetricObject,
  dateFormatString
}) {
  const selectedMetric = selectedMetricObject.value
  const columns = [
    {
      label: 'Date',
      field: 'date',
      type: 'date',
      formatString: dateFormatString
    },
    ...dataset.map(d => {
      return {
        label: d.region,
        field: d.regionId,
        formatString: selectedMetricObject.numberFormatString
      }
    })
  ]
  const rows = dataset[0].data.map(d => {
    return {
      date: d.date,
      time: d.time
    }
  })

  dataset.forEach(regionData => {
    rows.forEach((d, i) => {
      d[regionData.regionId] = regionData.data[i][selectedMetric]
    })
  })

  return {
    rows,
    columns
  }
}

export function getEnergyTableData({ datasets }) {
  const regions = datasets.map(d => d.region)

  const columns = [
    {
      label: 'Date',
      field: 'date',
      type: 'date',
      formatString: 'Pp'
    },
    ...regions.map(d => {
      return {
        label: d,
        field: d
      }
    })
  ]

  const rows = datasets[0].dataset.map(d => {
    return {
      date: d.date,
      time: d.time
    }
  })

  datasets.forEach(regionData => {
    rows.forEach((d, i) => {
      d[regionData.region] = regionData.dataset[i]._total
    })
  })

  return {
    rows,
    columns
  }
}

export function getOptionId(options, selectedLabel) {
  const find = options.find(d => d.label === selectedLabel)
  return find ? find.value : null
}

export function getOptionLabel(options, selectedValue) {
  const find = options.find(d => d.value === selectedValue)
  return find ? find.label : null
}
