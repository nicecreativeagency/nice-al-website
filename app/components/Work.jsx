import { useRef, useState } from 'react'
import { motion, useMotionValue, useSpring, useInView, AnimatePresence } from 'framer-motion'
import { workImages } from '../data/images'
import styles from './Work.module.css'

const PROJECTS = [
  { brand: 'Iveco', category: 'Digital Campaign', year: '2024', img: workImages.iveco },
  { brand: 'Kia', category: 'Branding & Digital', year: '2023', img: workImages.kia },
  { brand: 'Sixt', category: 'Campaign Design', year: '2023', img: workImages.sixt },
  { brand: 'Vodafone', category: 'Social & Motion', year: '2022', img: workImages.vodafone },
  { brand: 'Telekom', category: 'Brand Identity', year: '2021', img: workImages.telekom },
  { brand: 'Air Jordan', category: 'Creative Direction', year: '2020', img: workImages.airjordan },
]

export default function Work() {
  const ref = useRef(null)
  const headInView = useInView(ref, { once: true, margin: '-10%' })
  const [active, setActive] = useState(null)

  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const x = useSpring(mx, { stiffness: 250, damping: 30, mass: 0.5 })
  const y = useSpring(my, { stiffness: 250, damping: 30, mass: 0.5 })

  const handleMove = (e) => {
    mx.set(e.clientX)
    my.set(e.clientY)
  }

  return (
    <section className={styles.section} id="work" onMouseMove={handleMove}>
      <motion.div
        ref={ref}
        className={styles.header}
        initial={{ opacity: 0, y: 40 }}
        animate={headInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <span className={styles.label}>Selected work, 2020 / 2024</span>
        <h2 className={styles.heading}>A short list<br />we&apos;re proud of</h2>
      </motion.div>

      <div className={styles.list}>
        {PROJECTS.map((project, i) => (
          <ProjectRow
            key={project.brand}
            project={project}
            index={i}
            onEnter={() => setActive(i)}
            onLeave={() => setActive(null)}
          />
        ))}
      </div>

      <motion.div
        className={styles.floating}
        style={{ x, y }}
        aria-hidden
      >
        <AnimatePresence>
          {active !== null && (
            <motion.div
              className={styles.floatingInner}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <img src={PROJECTS[active].img} alt="" loading="lazy" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </section>
  )
}

function ProjectRow({ project, index, onEnter, onLeave }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-8%' })

  return (
    <motion.a
      ref={ref}
      href="#contact"
      className={styles.row}
      data-cursor="view"
      data-cursor-label="View"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
    >
      <span className={styles.rowIndex}>{String(index + 1).padStart(2, '0')}</span>
      <span className={styles.rowBrand}>{project.brand}</span>
      <span className={styles.rowCategory}>{project.category}</span>
      <span className={styles.rowYear}>{project.year}</span>
    </motion.a>
  )
}
