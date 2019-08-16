import get from 'lodash/get'
import set from 'lodash/set'
import { traverse } from './utils'
import uuid from 'uuid/v1'

const FUNCTION_PREFIX = '__FUNCTION__'

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
    this._id = uuid()
    this._targetId = ''

    this.subscribe('pre_connect', this._handlePreConnect)
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
    if (this._target && this._target !== target) {
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
    const { type, data, meta } = event.data
    const parsedData = this._parseFunction(type, data, meta.functionKeys)
    const funs = this._subscribers[type] || []

    const funsPromise = funs.map(fun => {
      const promiseFun = this._promisify(fun)
      return promiseFun(parsedData, event.data, event).then(data => {
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

  postMessage (type, data, opts = {}) {
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

  connect () {
    if (!this._target) {
      return Promise.reject(new Error('Target is not exist.'))
    }

    if (this._isTargetReady) {
      return Promise.resolve('Target has already connected.')
    }

    // three times handshake
    return this.postMessage('pre_connect', this._id).then((targetId) => {
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

  destory () {
    this._subscribers = {}
    this._targetOrigin = ''
    this._target = undefined
    this._queue = []
    this._isTargetReady = false
    window.removeEventListener('message', this._handleMessage)
  }
}
