import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import styles from './Philosophy.module.css'

export default function Philosophy() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-25%' })

  return (
    <section className={styles.section} ref={ref}>
      <div className={styles.gridOverlay}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={styles.gridSvg}>
          <line x1="33.3" y1="0" x2="33.3" y2="100" stroke="#fff" strokeWidth="0.3" opacity="0.06" />
          <line x1="66.6" y1="0" x2="66.6" y2="100" stroke="#fff" strokeWidth="0.3" opacity="0.06" />
          <line x1="0" y1="33.3" x2="100" y2="33.3" stroke="#fff" strokeWidth="0.3" opacity="0.06" />
          <line x1="0" y1="66.6" x2="100" y2="66.6" stroke="#fff" strokeWidth="0.3" opacity="0.06" />
        </svg>
      </div>

      <motion.p
        className={styles.quote}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      >
        Less clients.<br />
        More craft.
      </motion.p>

      <motion.p
        className={styles.sub}
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 0.4, y: 0 } : {}}
        transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        Quality over quantity, always.
      </motion.p>
    </section>
  )
}
