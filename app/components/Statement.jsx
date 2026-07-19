import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import styles from './Statement.module.css'

const TEXT =
  "We're a two-person studio with a nine-year attention span. We don't scale head count, we scale care. That is the whole pitch."

const WORDS = TEXT.split(' ')

function Word({ word, range, progress }) {
  const opacity = useTransform(progress, range, [0.15, 1])
  return (
    <span className={styles.wordWrap}>
      <motion.span className={styles.word} style={{ opacity }}>
        {word}
      </motion.span>
    </span>
  )
}

export default function Statement() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.85', 'start 0.15'],
  })

  return (
    <section className={styles.section} ref={ref} id="studio">
      <span className={styles.label}>The studio</span>
      <p className={styles.text}>
        {WORDS.map((word, i) => {
          const start = i / WORDS.length
          const end = start + 1 / WORDS.length
          return (
            <Word key={i} word={word} range={[start, end]} progress={scrollYProgress} />
          )
        })}
      </p>
    </section>
  )
}
