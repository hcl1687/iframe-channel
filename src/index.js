import { promisify, traverse } from './utils'
import get from 'lodash/get'
import isArray from 'lodash/isArray'
import isPlainObject from 'lodash/isPlainObject'
import set from 'lodash/set'
import uuid from 'uuid/v1'

const FUNCTION_PREFIX = '__FUNCTION__'

export default class Channel {
  constructor (opts = {}) {
    const { targetOrigin = '', subscribers = {}, target, attemptInterval = 1000, maxAttempts = 10 } = opts

    if (target === window) {
      throw new Error('The target can not be current window.')
    }

    this._subscribers = subscribers
    this._targetOrigin = targetOrigin
    this._target = target
    this._queue = []
    this._isTargetReady = false
    this._id = uuid()
    this._targetId = ''
    // set the max interval between reconnect attempts. default 1000ms
    this._attemptInterval = attemptInterval
    // set an upper limit to the number of times we'll try to reconnect for. default 10 times.
    this._maxAttempts = maxAttempts

    this.subscribe('pre_connect', this._handlePreConnect)
    this.subscribe('connect', this._handleConnect)
    window.addEventListener('message', this._handleMessage, false)
    window.addEventListener('beforeunload', () => {
      this.destroy()
    })
  }

  _handleMessage = (event) => {
    const origin = event.origin
    if (origin !== this._targetOrigin && this._targetOrigin !== '*') {
      return
    }

    // One origin may have multiple channel instance. So we should filter message by instance id
    const { type, meta = {} } = event.data
    if (type !== 'pre_connect' && meta.id !== this._targetId) {
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

  _handlePreConnect = (targetId, message, event) => {
    const target = event.source
    if (this._target && !this._target.closed && this._target !== target) {
      // If the Channel's target has been set, do not accept a new connect.
      throw new Error('Connection is rejected.')
    }

    this._target = target
    this._targetId = targetId
    return this._id
  }

  _handleConnect = (data, message, event) => {
    this._isTargetReady = true
    this._handleQueue()
  }

  _publish (event) {
    const { type, data, meta } = event.data
    const parsedData = this._parseFunction(type, data, meta.functionKeys)
    const funs = this._subscribers[type] || []

    const funsPromise = funs.map(fun => {
      const promiseFun = promisify(fun)
      return promiseFun(parsedData, event.data, event).then(data => {
        if (data) {
          return {
            type,
            data
          }
        }
      }).catch(e => ({
        type,
        error: {
          message: e.message
        }
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

  _subscribeFunction (type, val) {
    this.unsubscribe(type)
    this.subscribe(type, (data) => {
      return val(...data)
    })
  }

  _stringifyFunction (type, data, keys = []) {
    if (!keys || keys.length === 0) {
      if (typeof data === 'function') {
        const funType = `${FUNCTION_PREFIX}${type}`
        this._subscribeFunction(funType, data)
        return {
          data: funType,
          keys: ['']
        }
      }

      // traverse data tree to collect function keys
      traverse(data, (val, key, obj, path) => {
        if (typeof val !== 'function') {
          return
        }

        const funType = `${FUNCTION_PREFIX}${type}_${path}`
        this._subscribeFunction(funType, val)
        obj[key] = funType
        keys.push(path)
      })

      return {
        data,
        keys
      }
    }

    keys.forEach(key => {
      const val = get(data, key)
      const funType = `${FUNCTION_PREFIX}${type}_${key}`
      this._subscribeFunction(funType, val)
      set(data, key, funType)
    })

    return {
      data,
      keys
    }
  }

  _parseFunction (type, data, keys = []) {
    if (keys.length === 0) {
      return data
    }

    // data is funciton
    // data = __FUNCTION__${type}
    if (keys.length === 1 && keys[0] === '') {
      return (...args) => {
        return this.postMessage(data, args)
      }
    }

    keys.forEach(key => {
      // data = ${FUNCTION_PREFIX}${type}_${key}
      const realKey = key.replace(`${FUNCTION_PREFIX}${type}_`, '')
      const functionType = get(data, realKey)
      set(data, realKey, (...args) => {
        return this.postMessage(functionType, args)
      })
    })

    return data
  }

  _subscribe (type, arrFun) {
    if (!this._subscribers[type]) {
      this._subscribers[type] = []
    }

    const funs = this._subscribers[type]
    arrFun.forEach(fun => {
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
    })
  }

  subscribe (type, fun) {
    if (typeof type !== 'string' && !isPlainObject(type)) {
      return
    }

    if (typeof type === 'string' && !fun) {
      return
    }

    if (typeof type === 'string') {
      type = {
        [type]: fun
      }
    }

    Object.keys(type).forEach(key => {
      let fun = type[key]
      if (typeof fun === 'function') {
        fun = [fun]
      }
      this._subscribe(key, fun)
    })
  }

  unsubscribe (type, fun) {
    if (type === undefined) {
      this._subscribers = {}
      return
    }

    if (isPlainObject(type)) {
      Object.keys(type).forEach(key => {
        const fun = type[key]
        this.unsubscribe(key, fun)
      })
      return
    }

    if (isArray(fun)) {
      fun.forEach(item => {
        this.unsubscribe(type, item)
      })
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

  postMessage (type, data, opts = {}) {
    return new Promise((resolve, reject) => {
      /* eslint-disable-next-line */
      const msgChan = new MessageChannel()
      msgChan.port1.onmessage = (event) => {
        const { data, error } = event.data
        if (error) {
          reject(new Error(error.message))
        } else {
          resolve(data)
        }
      }

      const message = {
        type,
        data,
        meta: {
          id: this._id
        }
      }
      const { hasFunction, functionKeys = [] } = opts
      if (hasFunction === true) {
        const stringifyData = this._stringifyFunction(type, data, functionKeys)
        message.data = stringifyData.data
        message.meta.functionKeys = stringifyData.keys
      }

      // do not queue pre_connect type
      if (!this._isTargetReady && type !== 'pre_connect') {
        this._queue.push({
          message,
          msgChan
        })
        return
      }

      this._target.postMessage(message, this._targetOrigin, [msgChan.port2])
    })
  }

  _preConnect () {
    let handlers = []
    let tId
    let attempts = 0
    const promise = new Promise((resolve, reject) => {
      handlers[0] = resolve
      handlers[1] = reject
    })
    const _connect = () => {
      attempts++
      this.postMessage('pre_connect', this._id).then((targetId) => {
        if (tId) {
          clearTimeout(tId)
          tId = undefined
        }

        if (handlers[0]) {
          handlers[0](targetId)
          handlers = []
        }
      }).catch(error => {
        if (tId) {
          clearTimeout(tId)
          tId = undefined
        }

        if (handlers[1]) {
          handlers[1](error)
          handlers = []
        }
      })
    }
    const _timeHandler = (callback) => {
      if (!this._isTargetReady && attempts >= this._maxAttempts) {
        if (handlers[1]) {
          handlers[1](new Error('Exceed the max attempts, connect failed.'))
          handlers = []
        }
        return
      }

      tId = setTimeout(() => {
        callback()

        // if target still haven't acknowledged, and the reconnect attempts are less than the max attemps,
        // try to reconnect.
        _timeHandler(callback)
      }, this._attemptInterval)
    }

    // try to preconnect immediately
    _connect()
    _timeHandler(_connect)

    return promise
  }

  connect () {
    if (!this._target) {
      return Promise.reject(new Error('Target is not exist.'))
    }

    if (this._isTargetReady) {
      return Promise.resolve('Target has already connected.')
    }

    // three times handshake
    return this._preConnect().then((targetId) => {
      this._targetId = targetId
      this._isTargetReady = true
      this._handleQueue()
      return this.postMessage('connect')
    }).catch((error) => {
      this._isTargetReady = false
      throw error
    })
  }

  clearQueue () {
    this._queue = []
  }

  destroy () {
    this._subscribers = {}
    this._targetOrigin = ''
    this._target = undefined
    this._queue = []
    this._isTargetReady = false
    window.removeEventListener('message', this._handleMessage)
  }
}
