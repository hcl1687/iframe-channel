import Channel from '../../src/index'

const { expect } = TEST_UTILS

let testIframe
let channel
describe('Channel', function () {
  beforeEach(() => {
    testIframe = document.createElement('iframe')
    testIframe.id = 'test-iframe'
    document.body.appendChild(testIframe)
  })
  afterEach(() => {
    if (channel) {
      channel.destory && channel.destory()
      channel = undefined
    }
    if (testIframe) {
      testIframe.parentNode.removeChild(testIframe)
      testIframe = undefined
    }
  })

  describe('test constructor', () => {
    it('no options', () => {
      channel = new Channel()
      const connect = channel._subscribers.connect
      expect(connect.length).to.be.equal(1)
      expect(channel._targetOrigin).to.be.equal('')
      expect(channel._target).to.be.equal(undefined)
      expect(channel._queue.length).to.be.equal(0)
      expect(channel._isTargetReady).to.be.equal(false)
    })
    it('with options', () => {
      channel = new Channel({
        targetOrigin: '*',
        target: testIframe && testIframe.contentWindow,
        subscribers: {
          test: [function () {}]
        }
      })
      const test = channel._subscribers.test
      expect(test.length).to.be.equal(1)
      expect(channel._targetOrigin).to.be.equal('*')
      expect(channel._target).to.be.equal(testIframe.contentWindow)
      expect(channel._queue.length).to.be.equal(0)
      expect(channel._isTargetReady).to.be.equal(false)
    })
    it('target can not be current window', () => {
      try {
        channel = new Channel({
          target: window
        })
      } catch (e) {
        expect(e.message).to.be.equal('The target can not be current window.')
      }
    })
  })

  describe('test connect', () => {
    it('no target', () => {
      channel = new Channel()
      try {
        channel.connect()
      } catch (e) {
        expect(e.message).to.be.equal('Target is not exist.')
      }
    })
    it('connect iframe', function (done) {
      testIframe.src = 'http://localhost:3000?type=connect_iframe'
      testIframe.onload = () => {
        channel = new Channel({
          targetOrigin: 'http://localhost:3000',
          target: testIframe && testIframe.contentWindow
        })
        channel.connect().then(() => {
          expect(1).to.be.equal(1)
          done()
        })
      }
    })
    it('connect is ready', function (done) {
      testIframe.src = 'http://localhost:3000?type=connect_iframe'
      testIframe.onload = () => {
        channel = new Channel({
          targetOrigin: 'http://localhost:3000',
          target: testIframe && testIframe.contentWindow
        })
        channel.connect().then(() => {
          channel.connect().then(msg => {
            expect(msg).to.be.equal('Target has already connected.')
            done()
          })
        })
      }
    })
    it('connect failed', function (done) {
      testIframe.src = 'http://localhost:3000?type=connect_failed'
      testIframe.onload = () => {
        channel = new Channel({
          targetOrigin: 'http://localhost:3000',
          target: testIframe && testIframe.contentWindow
        })
        channel.connect().catch(() => {
          expect(channel._isTargetReady).to.be.equal(false)
          done()
        })
      }
    })
  })

  describe('test post message', () => {
    it('post message before connect', function (done) {
      testIframe.src = 'http://localhost:3000?type=post_message'
      testIframe.onload = () => {
        channel = new Channel({
          targetOrigin: 'http://localhost:3000',
          target: testIframe && testIframe.contentWindow
        })
        channel.connect()
        channel.postMessage('xx', 'hello').then((data) => {
          expect(data).to.be.equal('hi')
          done()
        })
      }
    })
    it('post message after connect', function (done) {
      testIframe.src = 'http://localhost:3000?type=post_message'
      testIframe.onload = () => {
        channel = new Channel({
          targetOrigin: 'http://localhost:3000',
          target: testIframe && testIframe.contentWindow
        })
        channel.connect().then(() => {
          channel.postMessage('xx', 'hello').then((data) => {
            expect(data).to.be.equal('hi')
            done()
          })
        })
      }
    })
    it('post message return error', function (done) {
      testIframe.src = 'http://localhost:3000?type=post_message_return_error'
      testIframe.onload = () => {
        channel = new Channel({
          targetOrigin: 'http://localhost:3000',
          target: testIframe && testIframe.contentWindow
        })
        channel.connect().then(() => {
          channel.postMessage('xx', 'hello').catch((err) => {
            expect(err).to.be.equal('error')
            done()
          })
        })
      }
    })
  })

  describe('test queue', () => {
    it('post message before connect', function (done) {
      testIframe.src = 'http://localhost:3000?type=post_message'
      testIframe.onload = () => {
        channel = new Channel({
          targetOrigin: 'http://localhost:3000',
          target: testIframe && testIframe.contentWindow
        })
        channel.postMessage('xx', 'hello1')
        channel.postMessage('xx', 'hello2')

        expect(channel._queue.length).to.be.equal(2)

        channel.connect().then(() => {
          expect(channel._queue.length).to.be.equal(0)
          done()
        })
      }
    })
    it('clean queue', function () {
      testIframe.src = 'http://localhost:3000?type=post_message'
      testIframe.onload = () => {
        channel = new Channel({
          targetOrigin: 'http://localhost:3000',
          target: testIframe && testIframe.contentWindow
        })
        channel.postMessage('xx', 'hello1')
        channel.postMessage('xx', 'hello2')
        expect(channel._queue.length).to.be.equal(2)
        channel.clearQueue()
        expect(channel._queue.length).to.be.equal(0)
      }
    })
  })

  describe('test handle message', () => {
    it('reject other origin message', function (done) {
      channel = new Channel({
        targetOrigin: 'abc',
        target: testIframe && testIframe.contentWindow
      })
      window.removeEventListener('message', channel._handleMessage)
      sinon.spy(channel, '_handleMessage')
      sinon.spy(channel, '_publish')

      window.addEventListener('message', channel._handleMessage, false)

      testIframe.src = 'http://localhost:3000?type=handle_message'
      testIframe.onload = () => {
        setTimeout(() => {
          expect(channel._handleMessage.called).to.be.equal(true)
          expect(channel._publish.called).to.be.equal(false)
          channel._handleMessage.restore()
          channel._publish.restore()
          window.removeEventListener('message', channel._handleMessage)
          done()
        }, 1000)
      }
    })
    it('accept target origin message', function (done) {
      channel = new Channel({
        targetOrigin: 'http://localhost:3000',
        target: testIframe && testIframe.contentWindow
      })
      window.removeEventListener('message', channel._handleMessage)
      sinon.spy(channel, '_handleMessage')
      sinon.spy(channel, '_publish')

      window.addEventListener('message', channel._handleMessage, false)

      testIframe.src = 'http://localhost:3000?type=handle_message'
      testIframe.onload = () => {
        setTimeout(() => {
          expect(channel._handleMessage.called).to.be.equal(true)
          expect(channel._publish.called).to.be.equal(true)
          channel._handleMessage.restore()
          channel._publish.restore()
          window.removeEventListener('message', channel._handleMessage)
          done()
        }, 1000)
      }
    })
  })

  describe('test handle connect', () => {
    it('reject connect', function (done) {
      channel = new Channel({
        targetOrigin: 'http://localhost:3000',
        target: 'fackTarget'
      })
      sinon.spy(channel, '_handleConnect')
      channel.unsubscribe('connect')
      channel.subscribe('connect', channel._handleConnect)

      testIframe.src = 'http://localhost:3000?type=handle_connect'
      testIframe.onload = () => {
        setTimeout(() => {
          expect(channel._handleConnect.called).to.be.equal(true)
          expect(channel._isTargetReady).to.be.equal(false)
          channel._handleConnect.restore()
          done()
        }, 1000)
      }
    })
  })

  describe('test subscribe', () => {
    it('type undefined', function () {
      channel = new Channel({
        targetOrigin: 'http://localhost:3000',
        target: testIframe && testIframe.contentWindow
      })
      channel.subscribe(() => {})
      expect(Object.keys(channel._subscribers)).to.deep.equal(['connect'])
      expect(channel._subscribers['connect'].length).to.be.equal(1)
    })
    it('subscribe connect after connected', function (done) {
      channel = new Channel({
        targetOrigin: 'http://localhost:3000',
        target: testIframe && testIframe.contentWindow
      })

      testIframe.src = 'http://localhost:3000?type=handle_connect'
      testIframe.onload = () => {
        setTimeout(() => {
          expect(channel._isTargetReady).to.be.equal(true)

          channel.subscribe('connect', () => {
            expect(true).to.be.equal(true)
            done()
          })
        }, 1000)
      }
      expect(Object.keys(channel._subscribers)).to.deep.equal(['connect'])
      expect(channel._subscribers['connect'].length).to.be.equal(1)
    })
  })

  describe('test unsubscribe', () => {
    it('type undefined', function () {
      channel = new Channel({
        targetOrigin: 'http://localhost:3000',
        target: testIframe && testIframe.contentWindow
      })
      channel.unsubscribe()
      expect(Object.keys(channel._subscribers)).to.deep.equal([])
    })
    it('subscribe a function', function () {
      channel = new Channel({
        targetOrigin: 'http://localhost:3000',
        target: testIframe && testIframe.contentWindow
      })

      const fun1 = () => {}
      const fun2 = () => {}
      channel.subscribe('test', fun1)
      channel.subscribe('test', fun2)
      expect(channel._subscribers['test'].length).to.be.equal(2)
      channel.unsubscribe('test', fun1)
      expect(channel._subscribers['test'].length).to.be.equal(1)
      expect(channel._subscribers['test'][0]).to.be.equal(fun2)
    })
  })

  describe('test queue', () => {
    it('subscribe a function', function () {
      channel = new Channel({
        targetOrigin: 'http://localhost:3000',
        target: testIframe && testIframe.contentWindow
      })

      channel.postMessage('test', 'abc')
      expect(channel._queue.length).to.be.equal(1)
      channel.clearQueue()
      expect(channel._queue.length).to.be.equal(0)
    })
  })
})
