import Channel from '../../src/index'

const { expect } = TEST_UTILS

let testIframe
describe('Channel', function () {
  beforeEach(() => {
    testIframe = document.createElement('iframe')
    testIframe.id = 'test-iframe'
    document.body.appendChild(testIframe)
  })
  afterEach(() => {
    if (testIframe) {
      testIframe.parentNode.removeChild(testIframe)
      testIframe = undefined
    }
  })

  describe('test constructor', () => {
    it('no options', () => {
      const channel = new Channel()
      const connect = channel._subscribers.connect
      expect(connect.length).to.be.equal(1)
      expect(channel._targetOrigin).to.be.equal('')
      expect(channel._target).to.be.equal(undefined)
      expect(channel._queue.length).to.be.equal(0)
      expect(channel._isTargetReady).to.be.equal(false)
      channel.destory()
    })
    it('with options', () => {
      const channel = new Channel({
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
      channel.destory()
    })
    it('target can not be current window', () => {
      try {
        /* eslint-disable-next-line */
        new Channel({
          target: window
        })
      } catch (e) {
        expect(e.message).to.be.equal('The target can not be current window.')
      }
    })
  })

  describe('test connect', () => {
    it('no target', () => {
      const channel = new Channel()
      try {
        channel.connect()
      } catch (e) {
        expect(e.message).to.be.equal('Target not exsist.')
      }
      channel.destory()
    })
    it('connect iframe', function (done) {
      let channel
      testIframe.src = 'http://localhost:3000?type=connect_iframe'
      testIframe.onload = () => {
        channel = new Channel({
          targetOrigin: 'http://localhost:3000',
          target: testIframe && testIframe.contentWindow
        })
        channel.connect().then(() => {
          expect(1).to.be.equal(1)
          channel.destory()
          done()
        })
      }
    })
  })
})
