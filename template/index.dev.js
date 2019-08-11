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
} else if (type === 'connect_failed') {
  child = new Channel({
    target: 'fake',
    targetOrigin: 'http://localhost:9876'
  })
} else if (type === 'post_message') {
  child = new Channel({
    targetOrigin: 'http://localhost:9876'
  })
  child.subscribe('xx', (data, message, event) => {
    return 'hi'
  })
} else if (type === 'post_message_return_error') {
  child = new Channel({
    targetOrigin: 'http://localhost:9876'
  })
  child.subscribe('xx', (data, message, event) => {
    throw new Error('error')
  })
} else if (type === 'handle_message') {
  child = new Channel({
    target: window.parent,
    targetOrigin: 'http://localhost:9876'
  })
  child.connect()
} else if (type === 'handle_connect') {
  child = new Channel({
    target: window.parent,
    targetOrigin: 'http://localhost:9876'
  })
  child.connect()
} else if (type === 'demo_parent_request_connect') {
  const channel = new Channel({
    targetOrigin: 'http://localhost:9876' // only accept targetOrigin's message
  })
  channel.subscribe('xx', (data, message, event) => {
    // data === 'hello'
    // message == { type: 'xx', data: 'hello' }
    return `${data}_hi`
  })
} else if (type === 'demo_child_request_connect') {
  const channel = new Channel({
    targetOrigin: 'http://localhost:9876', // only accept targetOrigin's message
    target: window.parent // parent window
  })
  channel.subscribe('xx', (data, message, event) => {
    // data === 'hello'
    // message == { type: 'xx', data: 'hello' }
    return `${data}_hi`
  })
  channel.connect()
} else if (type === 'demo_post_message_before_connect') {
  const channel = new Channel({
    targetOrigin: 'http://localhost:9876' // only accept targetOrigin's message
  })
  channel.subscribe('xx', (data, message, event) => {
    // data === 'hello'
    // message == { type: 'xx', data: 'hello' }
    return `${data}_hi`
  })
}
