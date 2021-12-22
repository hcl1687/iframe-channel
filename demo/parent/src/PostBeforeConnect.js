import React, { useEffect, useRef, useState } from 'react'
import Channel from 'iframe-channel'
import { targetOrigin } from './constants'

export default function ParentRequest () {
  const src = `${targetOrigin}/#/post-before-connect`
  const iframeEl = useRef(null)
  const channelRef = useRef(null)
  const [message, setMessage] = useState('')
  useEffect(() => {
    return () => {
      const channel = channelRef.current
      // destroy channel
      // Each Channel instance will add 'message' and 'beforeunload' event listener to window
      // object. So make sure destroy the instance once it's unused.
      channel && channel.destroy()
    }
  }, [])
  const handleLoad = () => {
    const testIframe = iframeEl.current
    channelRef.current = new Channel({
      targetOrigin, // only accept targetOrigin's message.
      target: testIframe && testIframe.contentWindow
    })
    // not connect yet
    // now send a message, whose type is 'xx' and data is 'hello'
    channelRef.current.postMessage('xx', 'hello').then((data) => {
      // will receive 'hello_hi' from child
      setMessage(data)
      console.log(data)
    })
    channelRef.current.connect()
  }

  return (
    <div>
      <h3>
        Message from child: {message}
      </h3>
      <iframe title='iframe channel communication'
        ref={iframeEl} src={src} onLoad={handleLoad} />
    </div>
  )
}