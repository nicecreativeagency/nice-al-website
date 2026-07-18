import { motion } from 'framer-motion'
import styles from './Marquee.module.css'

export default function Marquee({ items, speed = 28, reverse = false, separator = '·' }) {
  const content = (
    <div className={styles.group}>
      {items.map((item, i) => (
        <span key={i} className={styles.item}>
          {item}
          <span className={styles.sep}>{separator}</span>
        </span>
      ))}
    </div>
  )

  return (
    <div className={styles.marquee}>
      <motion.div
        className={styles.track}
        animate={{ x: reverse ? ['-50%', '0%'] : ['0%', '-50%'] }}
        transition={{ duration: speed, ease: 'linear', repeat: Infinity }}
      >
        {content}
        {content}
      </motion.div>
    </div>
  )
}
