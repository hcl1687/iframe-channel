import React, { useEffect, useRef, useState } from 'react'
import Channel from 'iframe-channel'

export default function ParentRequest () {
  const src = 'http://localhost:3000/parent-request'
  const iframeEl = useRef(null)
  const channelRef = useRef(null)
  const [message, setMessage] = useState('')
  useEffect(() => {
    return () => {
      const channel = channelRef.current
      // destory channel
      // Each Channel instance will add 'message' and 'beforeunload' event listener to window
      // object. So make sure destory the instance once it's unused.
      channel && channel.destory()
    }
  }, [])
  const handleLoad = () => {
    const testIframe = iframeEl.current
    channelRef.current = new Channel({
      targetOrigin: 'http://localhost:3000', // only accept targetOrigin's message.
      target: testIframe && testIframe.contentWindow
    })
    channelRef.current.connect().then(() => {
      // have connected
      // now send a message, whose type is 'xx' and data is 'hello'
      channelRef.current.postMessage('xx', 'hello').then((data) => {
        // will receive 'hello_hi' from child
        setMessage(data)
        console.log(data)
      })
    })
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