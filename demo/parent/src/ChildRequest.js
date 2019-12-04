import React, { useEffect, useState } from 'react'
import Channel from 'iframe-channel'
import { targetOrigin } from './constants'

export default function ParentRequest () {
  const src = `${targetOrigin}/child-request`
  const [message, setMessage] = useState('')
  useEffect(() => {
    const channel = new Channel({
      targetOrigin
    })
    channel.subscribe('connect', () => {
      // have connected
      // now send a message, whose type is 'xx' and data is 'hello'
      channel.postMessage('xx', 'hello').then((data) => {
        // will receive 'hello_hi' from child
        console.log(data)
        setMessage(data)
      })
    })

    return () => {
      // destory channel
      // Each Channel instance will add 'message' and 'beforeunload' event listener to window
      // object. So make sure destory the instance once it's unused.
      channel && channel.destory()
    }
  }, [])

  return (
    <div>
      <h3>
        Message from child: {message}
      </h3>
      <iframe title='iframe channel communication' src={src} />
    </div>
  )
}