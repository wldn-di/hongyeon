import React, { useEffect, useState } from 'react'

export default function TypingText({ text = '', speed = 30, onComplete }) {
  const [displayed, setDisplayed] = useState('')
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    if (idx < text.length) {
      const t = setTimeout(() => {
        setDisplayed((p) => p + text[idx])
        setIdx((i) => i + 1)
      }, speed)
      return () => clearTimeout(t)
    }

    if (onComplete) {
      const t = setTimeout(onComplete, 300)
      return () => clearTimeout(t)
    }
  }, [idx, text, speed, onComplete])

  useEffect(() => {
    setDisplayed('')
    setIdx(0)
  }, [text])

  const lines = displayed.split('\n')

  return (
    <span>
      {lines.map((l, i) => (
        <React.Fragment key={i}>
          {l}
          {i < lines.length - 1 && <br />}
        </React.Fragment>
      ))}
      {idx < text.length && <span className="animate-pulse">|</span>}
    </span>
  )
}

