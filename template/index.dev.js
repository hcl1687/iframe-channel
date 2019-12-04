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
} else if (type === 'post_a_function') {
  const channel = new Channel({
    targetOrigin: 'http://localhost:9876' // only accept targetOrigin's message
  })
  channel.subscribe('xx', (data, message, event) => {
    return data(1)
  })
} else if (type === 'post_a_functions_object') {
  const channel = new Channel({
    targetOrigin: 'http://localhost:9876' // only accept targetOrigin's message
  })
  channel.subscribe('xx', (data, message, event) => {
    const { add, multiply, initData } = data
    return add(initData).then(res => {
      return multiply(res)
    })
  })
} else if (type === 'post_a_functions_array') {
  const channel = new Channel({
    targetOrigin: 'http://localhost:9876' // only accept targetOrigin's message
  })
  channel.subscribe('xx', (data, message, event) => {
    const [add, multiply, initData] = data
    return add(initData).then(res => {
      return multiply(res)
    })
  })
} else if (type === 'post_a_functions_object_with_keys') {
  const channel = new Channel({
    targetOrigin: 'http://localhost:9876' // only accept targetOrigin's message
  })
  channel.subscribe('xx', (data, message, event) => {
    const { add, a = [], initData } = data
    const multiply = a[2]
    return add(initData).then(res => {
      return multiply(res)
    })
  })
} else if (type === 'child_post_a_function') {
  const channel = new Channel({
    target: window.parent,
    targetOrigin: 'http://localhost:9876' // only accept targetOrigin's message
  })
  channel.connect().then(() => {
    const a = function (num) {
      return num + 1
    }

    channel.postMessage('xx', a, {
      hasFunction: true
    })
  })
} else if (type === 'child_post_a_functions_object') {
  const channel = new Channel({
    target: window.parent,
    targetOrigin: 'http://localhost:9876' // only accept targetOrigin's message
  })
  channel.connect().then(() => {
    const funObj = {
      add: function (num) {
        return num + 1
      },
      multiply: function (num) {
        return num * 2
      },
      initData: 1
    }

    channel.postMessage('xx', funObj, {
      hasFunction: true
    })
  })
} else if (type === 'demo_post_function') {
  const channel = new Channel({
    targetOrigin: 'http://localhost:9876' // only accept targetOrigin's message
  })
  channel.subscribe('xx', (data, message, event) => {
    const childData = 1
    const { add, a = [], parentData } = data
    const multiply = a[1]
    return add(parentData, childData).then(res => {
      return multiply(res, a[0])
    })
  })
}
