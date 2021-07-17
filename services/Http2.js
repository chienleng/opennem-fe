import axios from 'axios'

const http = axios.create({
  withCredentials: false,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
})

function fetchJSON(ref) {
  return new Promise((resolve, reject) => {
    http
      .get(ref)
      .then(data => {
        resolve(data)
      })
      .catch(e => {
        const error = e.toJSON()
        const message = `fetch ${error.config.url} error: ${error.message}`
        if (client) {
          client.captureException(message)
        }
        console.error(message, e.toJSON())
        reject(e)
      })
  })
}

export default function(ref) {
  return new Promise((resolve, reject) => {
    const calls = ref.map(r => fetchJSON(r))
    axios
      .all(calls)
      .then(
        axios.spread((...args) => {
          const updated = []
          args.forEach(a => {
            if (a.status !== 200) {
              reject(a.originalError)
            } else {
              updated.push(a.data)
            }
          })
          resolve(updated)
        })
      )
      .catch(e => {
        reject(e)
      })
  })
}
