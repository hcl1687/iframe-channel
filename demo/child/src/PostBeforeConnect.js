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
      // data === 'hello'
      // message == { type: 'xx', data: 'hello' }
      setMessage(data)
      return `${data}_hi`
    })
    return () => {
      // destory channel
      // Each Channel instance will add 'message' and 'beforeunload' event listener to window
      // object. So make sure destory the instance once it's unused.
      channel && channel.destory()
    }
  }, [])

  return (
    <h3>
      Message from parent: {message}
    </h3>
  )
}