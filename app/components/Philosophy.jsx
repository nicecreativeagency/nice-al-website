import { useRef } from 'react'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import styles from './Philosophy.module.css'

export default function Philosophy() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-25%' })

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const line1X = useTransform(scrollYProgress, [0, 1], ['6%', '-6%'])
  const line2X = useTransform(scrollYProgress, [0, 1], ['-8%', '8%'])
  const gridY = useTransform(scrollYProgress, [0, 1], ['-6%', '6%'])

  return (
    <section className={styles.section} ref={ref}>
      <motion.div className={styles.gridOverlay} style={{ y: gridY }}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={styles.gridSvg}>
          <line x1="33.3" y1="0" x2="33.3" y2="100" stroke="#fff" strokeWidth="0.2" opacity="0.06" />
          <line x1="66.6" y1="0" x2="66.6" y2="100" stroke="#fff" strokeWidth="0.2" opacity="0.06" />
          <line x1="0" y1="33.3" x2="100" y2="33.3" stroke="#fff" strokeWidth="0.2" opacity="0.06" />
          <line x1="0" y1="66.6" x2="100" y2="66.6" stroke="#fff" strokeWidth="0.2" opacity="0.06" />
        </svg>
      </motion.div>

      <div className={styles.quote}>
        <motion.span
          className={styles.line}
          style={{ x: line1X }}
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        >
          Good enough
        </motion.span>
        <motion.span
          className={styles.line}
          style={{ x: line2X }}
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        >
          was never <span className={styles.italic}>the brief.</span>
        </motion.span>
      </div>

      <motion.p
        className={styles.sub}
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 0.5, y: 0 } : {}}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        That is why we stay small, picky, and a little obsessed.
      </motion.p>
    </section>
  )
}
