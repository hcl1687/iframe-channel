import Channel from '../../src/index'

const { expect } = TEST_UTILS

describe('Channel demo', function () {
  it('Parent request connect', function (done) {
    const testIframe = document.createElement('iframe')
    testIframe.id = 'test-iframe'

    testIframe.onload = () => {
      const channel = new Channel({
        targetOrigin: 'http://localhost:3000', // only accept targetOrigin's message.
        target: testIframe && testIframe.contentWindow
      })
      channel.connect().then(() => {
        // have connected
        // now send a message, whose type is 'xx' and data is 'hello'
        channel.postMessage('xx', 'hello').then((data) => {
          // will receive 'hello_hi' from child
          expect(data).to.be.equal('hello_hi')

          // destory channel
          // Each Channel instance will add 'message' and 'beforeunload' event listener to window
          // object. So make sure destory the instance once it's unused.
          channel.destory()
          // destory iframe
          testIframe.parentNode.removeChild(testIframe)
          done()
        })
      })
    }

    testIframe.src = 'http://localhost:3000?type=demo_parent_request_connect'
    document.body.appendChild(testIframe)
  })

  it('Child request connect', function (done) {
    const testIframe = document.createElement('iframe')
    testIframe.id = 'test-iframe'

    const channel = new Channel({
      targetOrigin: 'http://localhost:3000'
    })

    channel.subscribe('connect', () => {
      // have connected
      // now send a message, whose type is 'xx' and data is 'hello'
      channel.postMessage('xx', 'hello').then((data) => {
        // will receive 'hello_hi' from child
        expect(data).to.be.equal('hello_hi')

        // destory channel
        // Each Channel instance will add 'message' and 'beforeunload' event listener to window
        // object. So make sure destory the instance once it's unused.
        channel.destory()
        // destory iframe
        testIframe.parentNode.removeChild(testIframe)
        done()
      })
    })

    testIframe.src = 'http://localhost:3000?type=demo_child_request_connect'
    document.body.appendChild(testIframe)
  })

  it('Post message before connect', function (done) {
    const testIframe = document.createElement('iframe')
    testIframe.id = 'test-iframe'

    testIframe.onload = () => {
      const channel = new Channel({
        targetOrigin: 'http://localhost:3000', // only accept targetOrigin's message.
        target: testIframe && testIframe.contentWindow
      })
      // not connect yet
      // now send a message, whose type is 'xx' and data is 'hello'
      channel.postMessage('xx', 'hello').then((data) => {
        // will receive 'hello_hi' from child
        expect(data).to.be.equal('hello_hi')

        // destory channel
        // Each Channel instance will add 'message' and 'beforeunload' event listener to window
        // object. So make sure destory the instance once it's unused.
        channel.destory()
        // destory iframe
        testIframe.parentNode.removeChild(testIframe)
        done()
      })
      channel.connect()
    }

    testIframe.src = 'http://localhost:3000?type=demo_post_message_before_connect'
    document.body.appendChild(testIframe)
  })

  it('Post function', function (done) {
    const testIframe = document.createElement('iframe')
    testIframe.id = 'test-iframe'

    testIframe.onload = () => {
      const channel = new Channel({
        targetOrigin: 'http://localhost:3000', // only accept targetOrigin's message.
        target: testIframe && testIframe.contentWindow
      })
      channel.connect().then(() => {
        // data can be a function, or an object or an array which contains function.
        const data = {
          add: function (num) {
            return new Promise(resolve => {
              setTimeout(() => {
                resolve(num + 1)
              }, 1000)
            })
          },
          a: [1, 2, function (num) {
            return num * 2
          }],
          initData: 1
        }

        channel.postMessage('xx', data, {
          hasFunction: true,
          functionKeys: ['add', 'a[2]']
        }).then((data) => {
          // will receive 4 from child
          expect(data).to.be.equal(4)

          channel.destory()
          testIframe.parentNode.removeChild(testIframe)
          done()
        })
      })
    }

    testIframe.src = 'http://localhost:3000?type=demo_post_function'
    document.body.appendChild(testIframe)
  })
})
