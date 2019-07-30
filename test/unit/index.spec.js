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
})
