import React, { useEffect, useState } from 'react'
import Channel from 'iframe-channel'
import { targetOrigin } from './constants'

export default function ParentRequest () {
  const [message, setMessage] = useState('');
  useEffect(() => {
    const channel = new Channel({
      targetOrigin // only accept targetOrigin's message
    })
    channel.subscribe('xx', (data, message, event) => {
      const childData = 1
      const { add, a = [], parentData } = data
      setMessage(`parentData: ${parentData}, a: [${a[0]}]`)
      debugger
      const multiply = a[1]
      return add(parentData, childData).then(res => {
        return multiply(res, a[0])
      })
    })

    return () => {
      // destroy channel
      // Each Channel instance will add 'message' and 'beforeunload' event listener to window
      // object. So make sure destroy the instance once it's unused.
      channel && channel.destroy()
    }
  }, [])

  return (
    <div>
      <div style={{ color: 'red' }}>ChildData: 1</div>
      <h3>
        Message from parent: {message}
      </h3>
    </div>
  )
}