import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import styles from './About.module.css'

const slideUp = {
  hidden: { opacity: 0, y: 60 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] },
  }),
}

export default function About() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-15%' })

  return (
    <section className={styles.section} id="about" ref={ref}>
      <motion.span
        className={styles.label}
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 0.5 } : {}}
        transition={{ duration: 0.8 }}
      >
        The Team
      </motion.span>

      <div className={styles.team}>
        <motion.div
          className={styles.member}
          variants={slideUp}
          custom={0}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          <div className={styles.memberGrid}>
            <svg viewBox="0 0 100 100" className={styles.memberGridSvg}>
              <line x1="33.3" y1="0" x2="33.3" y2="100" stroke="#fff" strokeWidth="0.5" opacity="0.08" />
              <line x1="66.6" y1="0" x2="66.6" y2="100" stroke="#fff" strokeWidth="0.5" opacity="0.08" />
              <line x1="0" y1="33.3" x2="100" y2="33.3" stroke="#fff" strokeWidth="0.5" opacity="0.08" />
              <line x1="0" y1="66.6" x2="100" y2="66.6" stroke="#fff" strokeWidth="0.5" opacity="0.08" />
            </svg>
          </div>
          <div className={styles.memberContent}>
            <h3 className={styles.name}>Erzen Arifi</h3>
            <p className={styles.role}>Creative Director / Founder</p>
            <p className={styles.bio}>
              Content creator across Instagram, TikTok, Facebook & YouTube with
              over 35,000 followers. Turning ideas into visuals that move people.
            </p>
            <div className={styles.socials}>
              <a href="https://instagram.com/erzen" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>Instagram</a>
              <a href="https://tiktok.com/@erzen" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>TikTok</a>
              <a href="https://youtube.com/@erzen" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>YouTube</a>
            </div>
          </div>
        </motion.div>

        <div className={styles.divider}>
          <svg viewBox="0 0 2 200" className={styles.dividerSvg}>
            <line x1="1" y1="0" x2="1" y2="200" stroke="#fff" strokeWidth="1" opacity="0.12" />
          </svg>
        </div>

        <motion.div
          className={styles.member}
          variants={slideUp}
          custom={1}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          <div className={styles.memberGrid}>
            <svg viewBox="0 0 100 100" className={styles.memberGridSvg}>
              <line x1="33.3" y1="0" x2="33.3" y2="100" stroke="#fff" strokeWidth="0.5" opacity="0.08" />
              <line x1="66.6" y1="0" x2="66.6" y2="100" stroke="#fff" strokeWidth="0.5" opacity="0.08" />
              <line x1="0" y1="33.3" x2="100" y2="33.3" stroke="#fff" strokeWidth="0.5" opacity="0.08" />
              <line x1="0" y1="66.6" x2="100" y2="66.6" stroke="#fff" strokeWidth="0.5" opacity="0.08" />
            </svg>
          </div>
          <div className={styles.memberContent}>
            <h3 className={styles.name}>Luisa Shala</h3>
            <p className={styles.role}>Art Director / Founder</p>
            <p className={styles.bio}>
              Illustrator with a unique signature style. 200K+ monthly views on
              Pinterest. Creating worlds one illustration at a time.
            </p>
            <div className={styles.socials}>
              <a href="https://instagram.com/theinfinityofspace" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>Instagram</a>
              <a href="https://pinterest.com/theinfinityofspace" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>Pinterest</a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
