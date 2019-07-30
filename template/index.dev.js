import Channel from '../src/index'
import urlParse from 'url-parse'

const { query = {} } = urlParse(location.href, true)
const { type } = query

let child

if (type === 'connect_iframe') {
  child = new Channel({
    targetOrigin: 'http://localhost:9876'
  })

  child.subscribe('connect', () => {
    console.log('child: has connected.')
  })
}
