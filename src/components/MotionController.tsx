import { useEffect } from 'react'

interface MotionControllerProps {
  revision: string
}

export default function MotionController({ revision }: MotionControllerProps) {
  useEffect(() => {
    const targets = Array.from(document.querySelectorAll<HTMLElement>('[data-mp-reveal]:not(.mp-reveal--visible)'))
    if (targets.length === 0) return

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion || !('IntersectionObserver' in window)) {
      targets.forEach((target) => target.classList.add('mp-reveal--visible'))
      return
    }

    document.documentElement.classList.add('mp-motion-ready')
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('mp-reveal--visible')
        observer.unobserve(entry.target)
      })
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 })

    targets.forEach((target) => observer.observe(target))
    return () => observer.disconnect()
  }, [revision])

  return null
}
