import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { productImages } from '../data/images'
import styles from './Products.module.css'

const PRODUCTS = [
  {
    name: 'Linku.al',
    tagline: 'One link, everything you are.',
    description: 'A bio-link tool built for creators who care how their profile looks.',
    url: 'https://linku.al',
    status: 'live',
    img: productImages.linku,
  },
  {
    name: 'Dizajmeri.com',
    tagline: 'Design, in Albanian.',
    description: 'Resources, templates and know-how for the next generation of designers.',
    url: 'https://dizajmeri.com',
    status: 'live',
    img: productImages.dizajmeri,
  },
  {
    name: 'Untitled',
    tagline: 'Coming soon.',
    description: "Something we've wanted to build for years. Almost ready.",
    url: null,
    status: 'soon',
    img: null,
  },
]

function ProductCard({ product, index }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-10%' })

  const inner = (
    <div className={styles.cardInner}>
      <div className={styles.cardMedia}>
        {product.img ? (
          <img src={product.img} alt={product.name} loading="lazy" />
        ) : (
          <div className={styles.soonMedia}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none">
              <line x1="33.3" y1="0" x2="33.3" y2="100" stroke="#fff" strokeWidth="0.4" opacity="0.15" />
              <line x1="66.6" y1="0" x2="66.6" y2="100" stroke="#fff" strokeWidth="0.4" opacity="0.15" />
              <line x1="0" y1="33.3" x2="100" y2="33.3" stroke="#fff" strokeWidth="0.4" opacity="0.15" />
              <line x1="0" y1="66.6" x2="100" y2="66.6" stroke="#fff" strokeWidth="0.4" opacity="0.15" />
            </svg>
            <span className={styles.pulse} />
          </div>
        )}
      </div>

      <div className={styles.cardBody}>
        <div className={styles.cardHeadRow}>
          <h3 className={styles.cardName}>{product.name}</h3>
          <span className={`${styles.badge} ${product.status === 'soon' ? styles.badgeSoon : ''}`}>
            {product.status === 'live' ? 'Live' : 'Soon'}
          </span>
        </div>
        <p className={styles.cardTagline}>{product.tagline}</p>
        <p className={styles.cardDesc}>{product.description}</p>
        {product.url && (
          <span className={styles.cardVisit} data-cursor="hover">
            Visit
            <span className={styles.arrow}>&#8599;</span>
          </span>
        )}
      </div>
    </div>
  )

  return (
    <motion.div
      ref={ref}
      className={styles.card}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
    >
      {product.url ? (
        <a href={product.url} target="_blank" rel="noopener noreferrer" className={styles.cardLink} data-cursor="view" data-cursor-label="Open">
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
        <span className={styles.label}>Our own products</span>
        <h2 className={styles.heading}>We build for others.<br />Then we build for us.</h2>
      </motion.div>

      <div className={styles.grid}>
        {PRODUCTS.map((product, i) => (
          <ProductCard key={product.name} product={product} index={i} />
        ))}
      </div>
    </section>
  )
}
