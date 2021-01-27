export default function(domains, data, rollUp) {
  const coeff = 1000 * 60 * 30
  data.forEach((d, i) => {
    data[i]._rollUpDate = Math.round(d.time / coeff) * coeff
  })
  return rollUp(domains, data)
}
