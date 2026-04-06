'use client'

import confetti from 'canvas-confetti'

interface ConfettiOptions {
  particleCount?: number
  spread?: number
  origin?: { x: number; y: number }
  colors?: string[]
}

export const fireConfetti = (options: ConfettiOptions = {}) => {
  const defaults = {
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899']
  }

  confetti({
    ...defaults,
    ...options
  })
}

export const firePrideConfetti = () => {
  const end = Date.now() + 2 * 1000
  const colors = ['#10b981', '#3b82f6']

  ;(function frame() {
    confetti({
      particleCount: 2,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: colors
    })
    confetti({
      particleCount: 2,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: colors
    })

    if (Date.now() < end) {
      requestAnimationFrame(frame)
    }
  }())
}

export const fireSuccessConfetti = () => {
  const scalar = 2
  const triangle = confetti.shapeFromPath({ path: 'M0 10 L5 0 L10 10z' })

  confetti({
    shapes: [triangle],
    particleCount: 40,
    spread: 50,
    origin: { y: 0.7 },
    scalar
  })
}
