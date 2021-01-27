export default function(dataAll, datasetAll) {
  dataAll.forEach(d => {
    const updateDataset = () => {
      const historyData = [...d.history.data]
      datasetAll.forEach((h, i) => {
        h[d.id] = historyData[i]
      })
    }

    updateDataset()
  })
}
