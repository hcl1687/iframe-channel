import React, { useEffect, useRef, useState } from 'react'
import Channel from 'iframe-channel'
import { targetOrigin } from './constants'

export default function ParentRequest () {
  const src = `${targetOrigin}/#/post-function`
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
      targetOrigin, // only accept targetOrigin's message.
      target: testIframe && testIframe.contentWindow
    })
    channelRef.current.connect().then(() => {
      // data can be a function, or an object or an array which contains function.
      const data = {
        add: function (a, b) {
          return new Promise(resolve => {
            setTimeout(() => {
              resolve(a + b)
            }, 1000)
          })
        },
        a: [2, function (a, b) {
          return a * b
        }],
        parentData: 1
      }

      channelRef.current.postMessage('xx', data, {
        hasFunction: true,
        functionKeys: ['add', 'a[1]']
      }).then((data) => {
        // will receive 4 from child
        setMessage(data)
      })
    })
  }

  return (
    <div>
      <h3>Question: (1 + childData) * 2=?</h3>
      <h3>
        Answer from child: {message}
      </h3>
      <iframe title='iframe channel communication'
        ref={iframeEl} src={src} onLoad={handleLoad} />
    </div>
  )
}