import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import styles from './Statement.module.css'

const WORDS = ['Founded', 'in', '2017.', 'Two', 'people.', 'Nine', 'years.', 'One', 'standard.']

export default function Statement() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-20%' })

  return (
    <section className={styles.section} ref={ref}>
      <div className={styles.gridLine} />
      <h2 className={styles.text}>
        {WORDS.map((word, i) => (
          <span key={i} className={styles.wordWrap}>
            <motion.span
              className={styles.word}
              initial={{ y: '100%', opacity: 0 }}
              animate={inView ? { y: '0%', opacity: 1 } : {}}
              transition={{
                duration: 0.7,
                delay: i * 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {word}
            </motion.span>
          </span>
        ))}
      </h2>
      <div className={styles.gridLine} />
    </section>
  )
}
