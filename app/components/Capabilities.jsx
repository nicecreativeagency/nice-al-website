import { useRef, useState } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import Marquee from './Marquee'
import { capabilityImages } from '../data/images'
import styles from './Capabilities.module.css'

const CAPABILITIES = [
  { title: 'Brand Identity', desc: 'Logos, systems and guidelines — the bones a brand stands on.', img: capabilityImages.branding },
  { title: 'Digital & Web', desc: 'Sites and interfaces that feel as good as they look.', img: capabilityImages.digital },
  { title: 'Content & Social', desc: 'Scroll-stopping content for feeds that never sleep.', img: capabilityImages.content },
  { title: 'Art & Illustration', desc: 'Hand-drawn worlds with a signature that is unmistakably ours.', img: capabilityImages.art },
]

const MARQUEE = ['Branding', 'Web', 'Content', 'Illustration', 'Motion', 'Strategy', 'Art Direction']

export default function Capabilities() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-12%' })
  const [active, setActive] = useState(0)

  return (
    <section className={styles.section} id="capabilities">
      <div className={styles.marqueeBand}>
        <Marquee items={MARQUEE} speed={30} separator="✳" />
      </div>

      <div className={styles.inner} ref={ref}>
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className={styles.label}>What we do</span>
          <h2 className={styles.heading}>Everything a brand needs, made by two.</h2>
        </motion.div>

        <div className={styles.grid}>
          <div className={styles.list}>
            {CAPABILITIES.map((cap, i) => (
              <motion.div
                key={cap.title}
                className={`${styles.item} ${active === i ? styles.itemActive : ''}`}
                onMouseEnter={() => setActive(i)}
                data-cursor="hover"
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className={styles.itemTop}>
                  <span className={styles.itemIndex}>0{i + 1}</span>
                  <h3 className={styles.itemTitle}>{cap.title}</h3>
                </div>
                <AnimatePresence initial={false}>
                  {active === i && (
                    <motion.p
                      className={styles.itemDesc}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <span>{cap.desc}</span>
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

          <div className={styles.preview}>
            <AnimatePresence mode="wait">
              <motion.img
                key={active}
                src={CAPABILITIES[active].img}
                alt={CAPABILITIES[active].title}
                loading="lazy"
                initial={{ opacity: 0, scale: 1.08 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              />
            </AnimatePresence>
            <div className={styles.previewGrid}>
              <svg viewBox="0 0 100 100" preserveAspectRatio="none">
                <line x1="33.3" y1="0" x2="33.3" y2="100" stroke="#fff" strokeWidth="0.4" opacity="0.15" />
                <line x1="66.6" y1="0" x2="66.6" y2="100" stroke="#fff" strokeWidth="0.4" opacity="0.15" />
                <line x1="0" y1="33.3" x2="100" y2="33.3" stroke="#fff" strokeWidth="0.4" opacity="0.15" />
                <line x1="0" y1="66.6" x2="100" y2="66.6" stroke="#fff" strokeWidth="0.4" opacity="0.15" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
