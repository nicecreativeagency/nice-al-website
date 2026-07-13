import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import styles from './Products.module.css'

const PRODUCTS = [
  {
    name: 'Linku.al',
    description: 'Link management, simplified.',
    url: 'https://linku.al',
    status: 'live',
  },
  {
    name: 'Dizajmeri.com',
    description: 'Design resources for creators.',
    url: 'https://dizajmeri.com',
    status: 'live',
  },
  {
    name: 'Coming Soon',
    description: 'Something new is brewing.',
    url: null,
    status: 'soon',
  },
]

function ProductCard({ product, index }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-10%' })

  const inner = (
    <div className={styles.cardInner}>
      <div className={styles.cardGrid}>
        <svg viewBox="0 0 100 100" className={styles.cardGridSvg}>
          <line x1="33.3" y1="0" x2="33.3" y2="100" stroke="currentColor" strokeWidth="0.5" opacity="0.1" />
          <line x1="66.6" y1="0" x2="66.6" y2="100" stroke="currentColor" strokeWidth="0.5" opacity="0.1" />
          <line x1="0" y1="33.3" x2="100" y2="33.3" stroke="currentColor" strokeWidth="0.5" opacity="0.1" />
          <line x1="0" y1="66.6" x2="100" y2="66.6" stroke="currentColor" strokeWidth="0.5" opacity="0.1" />
        </svg>
      </div>

      <div className={styles.cardContent}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardName}>{product.name}</h3>
          {product.status === 'soon' && (
            <span className={styles.pulse} />
          )}
          {product.status === 'live' && (
            <span className={styles.liveDot} />
          )}
        </div>
        <p className={styles.cardDesc}>{product.description}</p>
      </div>

      {product.url && (
        <span className={styles.cardArrow}>&#8599;</span>
      )}
    </div>
  )

  return (
    <motion.div
      ref={ref}
      className={styles.card}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: 0.8,
        delay: index * 0.12,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {product.url ? (
        <a href={product.url} target="_blank" rel="noopener noreferrer" className={styles.cardLink}>
          {inner}
        </a>
      ) : (
        inner
      )}
    </motion.div>
  )
}

export default function Products() {
  const headRef = useRef(null)
  const headInView = useInView(headRef, { once: true, margin: '-10%' })

  return (
    <section className={styles.section} id="products">
      <motion.div
        ref={headRef}
        className={styles.header}
        initial={{ opacity: 0, y: 40 }}
        animate={headInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <span className={styles.label}>Our Products</span>
        <h2 className={styles.heading}>Things we&apos;ve built</h2>
      </motion.div>

      <div className={styles.grid}>
        {PRODUCTS.map((product, i) => (
          <ProductCard key={product.name} product={product} index={i} />
        ))}
      </div>
    </section>
  )
}
