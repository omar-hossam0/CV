import React, { useEffect } from 'react'

/**
 * Premium Scroll Reveal Hook
 * Apple/Stripe/Notion-style smooth scroll animations
 */
export const useScrollReveal = (options = {}) => {
  const {
    threshold = 0.05,
    rootMargin = '0px 0px -80px 0px',
    triggerOnce = true
  } = options

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal--visible')
            if (triggerOnce) observer.unobserve(entry.target)
          } else if (!triggerOnce) {
            entry.target.classList.remove('reveal--visible')
          }
        })
      },
      { threshold, rootMargin }
    )

  const revealSelectors = ['.reveal', '.reveal-fast', '.reveal-slow', '.reveal-scale', '.reveal-gentle']
    const elements = document.querySelectorAll(revealSelectors.join(','))
    elements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [threshold, rootMargin, triggerOnce])
}

/**
 * ScrollReveal wrapper component
 */
export const ScrollReveal = ({ children, type = 'default', delay = 0, className = '' }) => {
  const revealClass =
    type === 'fast'
      ? 'reveal-fast'
      : type === 'slow'
      ? 'reveal-slow'
      : type === 'scale'
      ? 'reveal-scale'
      : type === 'gentle'
      ? 'reveal-gentle'
      : 'reveal'

  return (
    <div className={`${revealClass} ${className}`} data-delay={delay}>
      {children}
    </div>
  )
}

export default useScrollReveal
