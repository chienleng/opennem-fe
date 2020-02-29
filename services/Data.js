export default {
  getEnergyUrls(region, range, hostEnv) {
    const prepend = hostEnv === 'dev' ? '/testing' : ''
    const thisFullYear = new Date().getFullYear()
    const urls = []
    switch (range) {
      case '1D':
      case '3D':
      case '7D':
        urls.push(`${prepend}/power/${region}.json`)
        break
      case '30D':
        // urls.push(`${prepend}/energy/history/daily/${region}.json`)
        urls.push(`/testing/${region}/energy/daily/${thisFullYear}.json`)
        break
      case '1Y':
        const now = new Date().getTime()
        const aYearAgo = now - 31557600000
        const lastFullYear = new Date(aYearAgo).getFullYear()
        if (thisFullYear !== lastFullYear) {
          urls.push(`/testing/${region}/energy/daily/${lastFullYear}.json`)
        }
        urls.push(`/testing/${region}/energy/daily/${thisFullYear}.json`)
        break
      case 'ALL':
        urls.push(`${prepend}/${region}/energy/monthly/all.json`)
        break
      default:
    }
    return urls
  },

  siCalculationFromBase(prefix, currentValue) {
    switch (prefix) {
      case 'k':
        return currentValue / Math.pow(10, 3)
      case 'M':
        return currentValue / Math.pow(10, 6)
      case 'G':
        return currentValue / Math.pow(10, 9)
      case 'T':
        return currentValue / Math.pow(10, 12)
      default:
        return currentValue
    }
  },

  siCalculationToBase(prefix, currentValue) {
    switch (prefix) {
      case 'k':
        return currentValue * Math.pow(10, 3)
      case 'M':
        return currentValue * Math.pow(10, 6)
      case 'G':
        return currentValue * Math.pow(10, 9)
      case 'T':
        return currentValue * Math.pow(10, 12)
      default:
        return currentValue
    }
  }
}
