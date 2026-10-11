import { useRef, useState, useEffect } from 'react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import Marquee from './Marquee'
import styles from './Hero.module.css'
import { HOMEPAGE_SECTIONS } from '../homepage-config'

const ROTATING = ['brands', 'launches', 'ideas', 'feeds', 'people']
const CLIENTS = ['Iveco', 'Kia', 'Sixt', 'Vodafone', 'Telekom', 'Air Jordan']

const gridLines = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.2 } },
}

const lineDraw = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 0.15,
    transition: { duration: 1.1, ease: [0.22, 1, 0.36, 1] },
  },
}

const nPath = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 1.6, delay: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
}

export default function Hero({ loaded }) {
  const ref = useRef(null)
  const [wordIndex, setWordIndex] = useState(0)

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })
  const symbolY = useTransform(scrollYProgress, [0, 1], [0, -120])
  const symbolScale = useTransform(scrollYProgress, [0, 1], [1, 0.82])
  const textY = useTransform(scrollYProgress, [0, 1], [0, 160])
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  useEffect(() => {
    if (!loaded) return
    const id = setInterval(() => {
      setWordIndex((i) => (i + 1) % ROTATING.length)
    }, 1800)
    return () => clearInterval(id)
  }, [loaded])

  const anim = loaded ? 'visible' : 'hidden'

  return (
    <section className={styles.hero} id="hero" ref={ref}>
      <motion.div className={styles.center} style={{ opacity: fade }}>
        <motion.div
          className={styles.symbolWrap}
          style={{ y: symbolY, scale: symbolScale }}
        >
          <motion.svg viewBox="0 0 968 968" className={styles.symbol} initial="hidden" animate={anim}>
            <motion.rect
              width="968" height="968" rx="148" ry="148" fill="#fff"
              initial={{ opacity: 0 }}
              animate={loaded ? { opacity: 1 } : {}}
              transition={{ duration: 0.8, ease: 'easeOut' }}
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
        </motion.div>

        <motion.div className={styles.textBlock} style={{ y: textY }}>
          <motion.p
            className={styles.eyebrow}
            initial={{ opacity: 0, y: 20 }}
            animate={loaded ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 1.4 }}
          >
            Creative studio. Independent since 2017
          </motion.p>

          <motion.h1
            className={styles.tagline}
            initial={{ opacity: 0, y: 30 }}
            animate={loaded ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, delay: 1.6, ease: [0.22, 1, 0.36, 1] }}
          >
            We make{' '}
            <span className={styles.rotator}>
              <AnimatePresence mode="wait">
                <motion.span
                  key={wordIndex}
                  className={styles.rotatorWord}
                  initial={{ y: '100%', opacity: 0 }}
                  animate={{ y: '0%', opacity: 1 }}
                  exit={{ y: '-100%', opacity: 0 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  {ROTATING[wordIndex]}
                </motion.span>
              </AnimatePresence>
            </span>
            <br />
            nice.
          </motion.h1>
        </motion.div>
      </motion.div>

      {HOMEPAGE_SECTIONS.trustedBy && (
        <motion.div
          className={styles.marqueeWrap}
          initial={{ opacity: 0 }}
          animate={loaded ? { opacity: 1 } : {}}
          transition={{ duration: 1, delay: 2 }}
        >
          <span className={styles.marqueeLabel}>Trusted by</span>
          <Marquee items={CLIENTS} speed={26} />
        </motion.div>
      )}
    </section>
  )
}
