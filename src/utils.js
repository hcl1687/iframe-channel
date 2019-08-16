import every from 'lodash/every'
import isArray from 'lodash/isArray'
import isPlainObject from 'lodash/isPlainObject'

export function traverse (obj, cb, path = '') {
  return every(obj, (val, key) => {
    let subPath = `${path}[${key}]`
    if (typeof key !== 'number') {
      subPath = path ? `${path}.${key}` : `${key}`
    }
    const ret = cb(val, key, obj, subPath)

    // if ret is false, do not traverse in
    if (ret !== false && (isPlainObject(val) || isArray(val))) {
      return traverse(val, cb, subPath)
    }

    return true
  })
}
