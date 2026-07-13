import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import styles from './Work.module.css'

const PROJECTS = [
  { brand: 'Iveco', category: 'Digital Campaign', year: '2024' },
  { brand: 'Kia', category: 'Branding & Digital', year: '2023' },
  { brand: 'Sixt', category: 'Campaign Design', year: '2023' },
  { brand: 'Vodafone', category: 'Digital Strategy', year: '2022' },
  { brand: 'Telekom', category: 'Brand Identity', year: '2021' },
  { brand: 'Air Jordan', category: 'Creative Direction', year: '2020' },
]

function ProjectCard({ project, index }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-10%' })

  return (
    <motion.div
      ref={ref}
      className={styles.card}
      initial={{ opacity: 0, y: 60 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: 0.8,
        delay: index * 0.1,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <div className={styles.cardInner}>
        <div className={styles.cardGrid}>
          <svg viewBox="0 0 100 100" className={styles.cardGridSvg}>
            <line x1="33.3" y1="0" x2="33.3" y2="100" stroke="currentColor" strokeWidth="0.5" opacity="0.15" />
            <line x1="66.6" y1="0" x2="66.6" y2="100" stroke="currentColor" strokeWidth="0.5" opacity="0.15" />
            <line x1="0" y1="33.3" x2="100" y2="33.3" stroke="currentColor" strokeWidth="0.5" opacity="0.15" />
            <line x1="0" y1="66.6" x2="100" y2="66.6" stroke="currentColor" strokeWidth="0.5" opacity="0.15" />
          </svg>
        </div>
        <span className={styles.cardYear}>{project.year}</span>
        <h3 className={styles.cardBrand}>{project.brand}</h3>
        <p className={styles.cardCategory}>{project.category}</p>
      </div>
    </motion.div>
  )
}

export default function Work() {
  const headRef = useRef(null)
  const headInView = useInView(headRef, { once: true, margin: '-10%' })

  return (
    <section className={styles.section} id="work">
      <motion.div
        ref={headRef}
        className={styles.header}
        initial={{ opacity: 0, y: 40 }}
        animate={headInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <span className={styles.label}>Selected Work</span>
        <h2 className={styles.heading}>Brands we&apos;ve<br />worked with</h2>
      </motion.div>

      <div className={styles.grid}>
        {PROJECTS.map((project, i) => (
          <ProjectCard key={project.brand} project={project} index={i} />
        ))}
      </div>
    </section>
  )
}
