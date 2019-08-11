export default class Channel {
  constructor (opts = {}) {
    const { targetOrigin = '', subscribers = {}, target } = opts

    if (target === window) {
      throw new Error('The target can not be current window.')
    }

    this._subscribers = subscribers
    this._targetOrigin = targetOrigin
    this._target = target
    this._queue = []
    this._isTargetReady = false

    this.subscribe('connect', this._handleConnect)
    window.addEventListener('message', this._handleMessage, false)
    window.addEventListener('beforeunload', () => {
      this.destory()
    })
  }

  _handleMessage = (event) => {
    const origin = event.origin
    if (origin !== this._targetOrigin && this._targetOrigin !== '*') {
      return
    }

    this._publish(event)
  }

  _handleQueue () {
    this._queue.forEach(task => {
      const { message, msgChan } = task
      this._target.postMessage(message, this._targetOrigin, [msgChan.port2])
    })

    this._queue = []
  }

  _handleConnect = (data, message, event) => {
    const target = event.source
    if (this._target && this._target !== target) {
      // If the Channel's target has been set, do not accept a new connect.
      throw new Error('Connection is rejected.')
    }

    this._target = target
    this._isTargetReady = true
    this._handleQueue()
    return 'Connection is accepted.'
  }

  _promisify (fun) {
    return (...args) => {
      return new Promise((resolve, reject) => {
        try {
          const ret = fun(...args)
          if (ret && ret.then) {
            ret.then(resolve).catch(reject)
          } else {
            resolve(ret)
          }
        } catch (e) {
          reject(e)
        }
      })
    }
  }

  _publish (event) {
    const { type, data } = event.data
    const funs = this._subscribers[type] || []

    const funsPromise = funs.map(fun => {
      const promiseFun = this._promisify(fun)
      return promiseFun(data, event.data, event).then(data => {
        if (data) {
          return {
            type,
            data
          }
        }
      }).catch(e => ({
        type,
        error: e.message
      }))
    })

    Promise.all(funsPromise).then(arrData => {
      arrData = arrData.filter(item => !!item)
      const ret = {}
      arrData.forEach(item => {
        Object.assign(ret, item)
      })

      event.ports[0].postMessage(ret)
    })
  }

  subscribe (type, fun) {
    if (!type || typeof fun !== 'function') {
      return
    }

    if (!this._subscribers[type]) {
      this._subscribers[type] = []
    }

    const funs = this._subscribers[type]
    if (!funs.includes(fun)) {
      funs.push(fun)
    }

    // handle connect type
    // if target has already connected, we invoke the fun immediately.
    if (type === 'connect' && this._isTargetReady) {
      const fakeEvent = {
        source: this._target
      }
      fun(fakeEvent.data, fakeEvent)
    }
  }

  unsubscribe (type, fun) {
    if (type === undefined) {
      this._subscribers = {}
      return
    }

    const funs = this._subscribers[type] || []
    if (fun === undefined) {
      this._subscribers[type] = []
      return
    }

    const index = funs.indexOf(fun)
    if (index > -1) {
      funs.splice(index, 1)
    }
  }

  postMessage (type, data) {
    return new Promise((resolve, reject) => {
      /* eslint-disable-next-line */
      const msgChan = new MessageChannel()
      msgChan.port1.onmessage = (event) => {
        const { data, error } = event.data
        if (error) {
          reject(error)
        } else {
          resolve(data)
        }
      }

      const message = {
        type,
        data
      }

      // do not queue connect type
      if (!this._isTargetReady && type !== 'connect') {
        this._queue.push({
          message,
          msgChan
        })
        return
      }

      this._target.postMessage(message, this._targetOrigin, [msgChan.port2])
    })
  }

  connect () {
    if (!this._target) {
      return Promise.reject(new Error('Target is not exist.'))
    }

    if (this._isTargetReady) {
      return Promise.resolve('Target has already connected.')
    }

    const type = 'connect'
    return this.postMessage(type).then((data) => {
      this._isTargetReady = true
      this._handleQueue()
    }).catch((error) => {
      this._isTargetReady = false
      throw error
    })
  }

  clearQueue () {
    this._queue = []
  }

  destory () {
    this._subscribers = {}
    this._targetOrigin = ''
    this._target = undefined
    this._queue = []
    this._isTargetReady = false
    window.removeEventListener('message', this._handleMessage)
  }
}
