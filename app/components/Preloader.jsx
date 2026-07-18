import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './Preloader.module.css'

export default function Preloader({ onDone }) {
  const [count, setCount] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    let current = 0
    const tick = () => {
      const step = Math.random() * 18 + 6
      current = Math.min(100, current + step)
      setCount(Math.floor(current))
      if (current < 100) {
        setTimeout(tick, Math.random() * 140 + 80)
      } else {
        setTimeout(() => setDone(true), 450)
      }
    }
    const start = setTimeout(tick, 300)
    return () => clearTimeout(start)
  }, [])

  return (
    <AnimatePresence onExitComplete={onDone}>
      {!done && (
        <motion.div
          className={styles.loader}
          exit={{ y: '-100%' }}
          transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
        >
          <motion.div
            className={styles.symbolWrap}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <svg viewBox="0 0 968 968" className={styles.symbol}>
              <rect width="968" height="968" rx="148" ry="148" fill="#fff" />
              <g opacity="0.15">
                <line x1="239" y1="0" x2="239" y2="968" stroke="#000" strokeWidth="6" />
                <line x1="481" y1="0" x2="481" y2="968" stroke="#000" strokeWidth="6" />
                <line x1="722" y1="0" x2="722" y2="968" stroke="#000" strokeWidth="6" />
                <line x1="0" y1="245" x2="968" y2="245" stroke="#000" strokeWidth="6" />
                <line x1="0" y1="481" x2="968" y2="481" stroke="#000" strokeWidth="6" />
                <line x1="0" y1="722" x2="968" y2="722" stroke="#000" strokeWidth="6" />
              </g>
              <path
                fill="#000"
                d="M242.06,725.01v-350.77c0-21.19,3.25-40.08,9.77-56.7,6.51-16.61,15.03-30.42,25.57-41.43,10.53-11,22.98-19.41,37.35-25.23,14.36-5.81,29.2-8.72,44.52-8.72,36.77,0,65.59,10.7,86.47,32.09,20.87,21.4,37.82,49.53,50.85,84.42l93.65,247.97c1.15,2.91,2.39,5.71,3.73,8.41,1.34,2.71,3.54,4.05,6.61,4.05,3.82,0,6.41-1.14,7.76-3.43,1.34-2.28,2.01-5.5,2.01-9.65V241.78h114.91v351.14c0,22.02-3.26,41.34-9.77,57.95-6.52,16.62-15.04,30.43-25.57,41.43-10.54,11.01-22.98,19.22-37.35,24.61-14.36,5.39-29.21,8.1-44.53,8.1-36.77,0-65.41-10.38-85.89-31.15-20.5-20.77-37.63-49.22-51.42-85.36l-93.65-247.97c-1.15-2.9-2.4-5.7-3.73-8.41-1.35-2.7-3.54-4.05-6.61-4.05-3.83,0-6.42,1.15-7.75,3.43-1.35,2.29-2.01,5.51-2.01,9.66v363.85h-114.91Z"
              />
            </svg>
          </motion.div>

          <div className={styles.meta}>
            <span className={styles.tag}>Creative Studio — Est. 2017</span>
            <span className={styles.count}>{String(count).padStart(3, '0')}</span>
          </div>

          <div className={styles.track}>
            <motion.div
              className={styles.fill}
              animate={{ width: `${count}%` }}
              transition={{ ease: 'easeOut' }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
