import React, { useEffect, useState } from 'react'
import Channel from 'iframe-channel'

export default function ParentRequest () {
  const [message, setMessage] = useState('');
  useEffect(() => {
    const channel = new Channel({
      targetOrigin: 'http://localhost:9876', // only accept targetOrigin's message
      target: window.parent // parent window
    })
    channel.subscribe('xx', (data, message, event) => {
      // data === 'hello'
      // message == { type: 'xx', data: 'hello' }
      setMessage(data)
      return `${data}_hi`
    })

    channel.connect()

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