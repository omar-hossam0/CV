import React, { useEffect, useState, useRef } from 'react'

/**
 * TextType - typing animation component
 * Props:
 * - text: array of strings to type
 * - typingSpeed: ms per character (default 80)
 * - pauseDuration: ms to wait after full string typed (default 1500)
 * - deletingSpeed: ms per character when deleting (default typingSpeed/2)
 * - loop: whether to loop the strings (default true)
 * - showCursor: show blinking cursor (default true)
 * - cursorCharacter: character to use for cursor (default '|')
 * - className: optional wrapper classes
 */
export default function TextType({
  text = [],
  typingSpeed = 75,
  pauseDuration = 1500,
  deletingSpeed,
  loop = true,
  showCursor = true,
  cursorCharacter = '|',
  className = ''
}) {
  const [display, setDisplay] = useState('')
  const [wordIndex, setWordIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const mounted = useRef(true)

  const delSpeed = deletingSpeed || Math.max(40, Math.floor(typingSpeed / 2))

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  useEffect(() => {
    if (!text || text.length === 0) return

    const current = wordIndex % text.length
    const fullText = text[current]

    let timeout = null

    if (!isDeleting && charIndex <= fullText.length) {
      // typing
      timeout = setTimeout(() => {
        if (!mounted.current) return
        setDisplay(fullText.substring(0, charIndex))
        setCharIndex((ci) => ci + 1)
      }, typingSpeed)
      // When finished typing full word, wait pauseDuration then start deleting
      if (charIndex === fullText.length) {
        clearTimeout(timeout)
        timeout = setTimeout(() => {
          if (!mounted.current) return
          setIsDeleting(true)
        }, pauseDuration)
      }
    } else if (isDeleting) {
      // deleting
      if (charIndex >= 0) {
        timeout = setTimeout(() => {
          if (!mounted.current) return
          setDisplay(fullText.substring(0, charIndex))
          setCharIndex((ci) => ci - 1)
        }, delSpeed)
      }
      // finished deleting, move to next word
      if (charIndex === 0) {
        setIsDeleting(false)
        setWordIndex((wi) => (wi + 1) % text.length)
        setCharIndex(0)
      }
    }

    return () => clearTimeout(timeout)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [charIndex, isDeleting, wordIndex, text, typingSpeed, delSpeed, pauseDuration])

  // Render text and honor any line breaks (\n) inside the typed string
  const rendered = display.split('\n').map((line, i, arr) => (
    <React.Fragment key={i}>
      {line}
      {i < arr.length - 1 && <br />}
    </React.Fragment>
  ))

  return (
    <span className={className} aria-live="polite">
      {rendered}
      {showCursor && (
        <span className="text-type-cursor" aria-hidden>
          {cursorCharacter}
        </span>
      )}
    </span>
  )
}
