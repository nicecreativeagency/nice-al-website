import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion'
import styles from './CustomCursor.module.css'

export default function CustomCursor() {
  const [enabled, setEnabled] = useState(false)
  const [variant, setVariant] = useState('default')
  const [label, setLabel] = useState('')

  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const springX = useSpring(x, { stiffness: 500, damping: 40, mass: 0.6 })
  const springY = useSpring(y, { stiffness: 500, damping: 40, mass: 0.6 })

  useEffect(() => {
    const hasFinePointer = window.matchMedia('(pointer: fine)').matches
    if (!hasFinePointer) return
    setEnabled(true)
    document.body.classList.add('has-custom-cursor')

    const move = (e) => {
      x.set(e.clientX)
      y.set(e.clientY)
      const target = e.target.closest('[data-cursor]')
      if (target) {
        setVariant(target.getAttribute('data-cursor') || 'hover')
        setLabel(target.getAttribute('data-cursor-label') || '')
      } else {
        setVariant('default')
        setLabel('')
      }
    }

    window.addEventListener('mousemove', move)
    return () => {
      window.removeEventListener('mousemove', move)
      document.body.classList.remove('has-custom-cursor')
    }
  }, [x, y])

  if (!enabled) return null

  const isLabel = variant === 'view' && label
  const size = variant === 'hover' ? 64 : variant === 'view' ? 96 : 14

  return (
    <motion.div
      className={styles.cursor}
      style={{ x: springX, y: springY }}
      aria-hidden
    >
      <motion.div
        className={styles.dot}
        animate={{
          width: size,
          height: size,
          backgroundColor: variant === 'view' ? '#fff' : 'transparent',
          borderWidth: variant === 'view' ? 0 : variant === 'hover' ? 1 : 6,
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        <AnimatePresence>
          {isLabel && (
            <motion.span
              className={styles.label}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}
