import { motion } from 'framer-motion'
import styles from './Hero.module.css'

const gridLines = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.3 },
  },
}

const lineDraw = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 0.15,
    transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1] },
  },
}

const nPath = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 1.8, delay: 1.0, ease: [0.22, 1, 0.36, 1] },
  },
}

export default function Hero() {
  return (
    <section className={styles.hero} id="hero">
      <div className={styles.symbolWrap}>
        <motion.svg
          viewBox="0 0 968 968"
          className={styles.symbol}
          initial="hidden"
          animate="visible"
        >
          <motion.rect
            width="968"
            height="968"
            rx="148"
            ry="148"
            fill="#fff"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />

          <motion.g variants={gridLines}>
            <motion.line x1="239" y1="0" x2="239" y2="968" stroke="#000" strokeWidth="6" variants={lineDraw} />
            <motion.line x1="481" y1="0" x2="481" y2="968" stroke="#000" strokeWidth="6" variants={lineDraw} />
            <motion.line x1="722" y1="0" x2="722" y2="968" stroke="#000" strokeWidth="6" variants={lineDraw} />
            <motion.line x1="0" y1="245" x2="968" y2="245" stroke="#000" strokeWidth="6" variants={lineDraw} />
            <motion.line x1="0" y1="481" x2="968" y2="481" stroke="#000" strokeWidth="6" variants={lineDraw} />
            <motion.line x1="0" y1="722" x2="968" y2="722" stroke="#000" strokeWidth="6" variants={lineDraw} />
          </motion.g>

          <motion.path
            d="M242.06,725.01v-350.77c0-21.19,3.25-40.08,9.77-56.7,6.51-16.61,15.03-30.42,25.57-41.43,10.53-11,22.98-19.41,37.35-25.23,14.36-5.81,29.2-8.72,44.52-8.72,36.77,0,65.59,10.7,86.47,32.09,20.87,21.4,37.82,49.53,50.85,84.42l93.65,247.97c1.15,2.91,2.39,5.71,3.73,8.41,1.34,2.71,3.54,4.05,6.61,4.05,3.82,0,6.41-1.14,7.76-3.43,1.34-2.28,2.01-5.5,2.01-9.65V241.78h114.91v351.14c0,22.02-3.26,41.34-9.77,57.95-6.52,16.62-15.04,30.43-25.57,41.43-10.54,11.01-22.98,19.22-37.35,24.61-14.36,5.39-29.21,8.1-44.53,8.1-36.77,0-65.41-10.38-85.89-31.15-20.5-20.77-37.63-49.22-51.42-85.36l-93.65-247.97c-1.15-2.9-2.4-5.7-3.73-8.41-1.35-2.7-3.54-4.05-6.61-4.05-3.83,0-6.42,1.15-7.75,3.43-1.35,2.29-2.01,5.51-2.01,9.66v363.85h-114.91Z"
            fill="#000"
            variants={nPath}
          />
        </motion.svg>
      </div>

      <motion.h1
        className={styles.tagline}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 2.0, ease: [0.22, 1, 0.36, 1] }}
      >
        We make nice things.
      </motion.h1>

      <motion.div
        className={styles.scrollIndicator}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.8, duration: 1 }}
      >
        <motion.div
          className={styles.scrollLine}
          animate={{ y: [0, 12, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
    </section>
  )
}
