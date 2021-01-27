import subDays from 'date-fns/subDays'

export default {
  getEnergyUrls(region, range, useV3Paths) {
    const prepend =
      region === 'wem' || region === 'nem' || region === 'au' ? '' : '/NEM'
    const regionId = region.toUpperCase()
    const thisFullYear = new Date().getFullYear()
    let lastFullYear = null
    const urls = []

    switch (range) {
      case '1D':
      case '3D':
      case '7D':
        if (useV3Paths || region === 'wem') {
          urls.push(`v3/stats/au${prepend}/${regionId}/power/7d.json`)
        } else {
          urls.push(`power/${region}.json`)
        }
        break
      case '30D':
        const thirtyDaysAgo = subDays(new Date(), 30)
        lastFullYear = thirtyDaysAgo.getFullYear()

        if (thisFullYear !== lastFullYear) {
          if (useV3Paths || region === 'wem') {
            urls.push(
              `v3/stats/au${prepend}/${regionId}/energy/${lastFullYear}.json`
            )
          } else {
            urls.push(`${region}/energy/daily/${lastFullYear}.json`)
          }
        }

        if (useV3Paths || region === 'wem') {
          urls.push(
            `v3/stats/au${prepend}/${regionId}/energy/${thisFullYear}.json`
          )
        } else {
          urls.push(`${region}/energy/daily/${thisFullYear}.json`)
        }
        break
      case '1Y':
        const now = new Date().getTime()
        const aYearAgo = now - 31557600000
        lastFullYear = new Date(aYearAgo).getFullYear()

        if (thisFullYear !== lastFullYear) {
          if (useV3Paths || region === 'wem') {
            urls.push(
              `v3/stats/au${prepend}/${regionId}/energy/${lastFullYear}.json`
            )
          } else {
            urls.push(`${region}/energy/daily/${lastFullYear}.json`)
          }
        }

        if (useV3Paths || region === 'wem') {
          urls.push(
            `v3/stats/au${prepend}/${regionId}/energy/${thisFullYear}.json`
          )
        } else {
          urls.push(`${region}/energy/daily/${thisFullYear}.json`)
        }

        break
      case 'ALL':
        if (useV3Paths || region === 'wem') {
          urls.push(`v3/stats/au${prepend}/${regionId}/energy/all.json`)
        } else {
          urls.push(`${region}/energy/monthly/all.json`)
        }
        break
      default:
    }
    return urls
  },

  getYearDailyPath(region, year, useV3Paths) {
    const prepend =
      region === 'wem' || region === 'nem' || region === 'au' ? '' : '/NEM'
    const regionId = region.toUpperCase()

    if (useV3Paths || region === 'wem') {
      return `v3/stats/au${prepend}/${regionId}/energy/${year}.json`
    }
    return `${region}/energy/daily/${year}.json`
  },

  getRegionAllDailyPath(region) {
    // const prepend =
    //   region === 'wem' || region === 'nem' || region === 'au' ? '' : '/NEM'
    const regionId = region.toUpperCase()
    return `v3/stats/au/${regionId}/daily.json`
  },

  getAllMonthlyPath() {
    return 'v3/stats/au/all/monthly.json'
  }
}
