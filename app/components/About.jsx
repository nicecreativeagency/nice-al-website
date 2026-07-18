import { useRef } from 'react'
import { motion, useInView, useScroll, useTransform } from 'framer-motion'
import AnimatedNumber from './AnimatedNumber'
import { teamImages } from '../data/images'
import styles from './About.module.css'

const STATS = [
  { value: 9, suffix: ' yrs', label: 'Independent' },
  { value: 2, suffix: '', label: 'People, no more' },
  { value: 35, suffix: 'K+', label: 'Followers' },
  { value: 200, suffix: 'K+', label: 'Monthly Pinterest views' },
]

function Member({ member, index, inView }) {
  const imgRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: imgRef,
    offset: ['start end', 'end start'],
  })
  const imgY = useTransform(scrollYProgress, [0, 1], ['-8%', '8%'])

  return (
    <motion.div
      className={styles.member}
      initial={{ opacity: 0, y: 60 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.9, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className={styles.photo} ref={imgRef} data-cursor="hover">
        <motion.img src={member.img} alt={member.name} loading="lazy" style={{ y: imgY }} />
        <span className={styles.photoTag}>{member.tag}</span>
      </div>
      <div className={styles.memberContent}>
        <h3 className={styles.name}>{member.name}</h3>
        <p className={styles.role}>{member.role}</p>
        <p className={styles.bio}>{member.bio}</p>
        <div className={styles.socials}>
          {member.socials.map((s) => (
            <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" className={styles.socialLink} data-cursor="hover">
              {s.label}
            </a>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

const MEMBERS = [
  {
    name: 'Erzen Arifi',
    role: 'Creative Director / Founder',
    tag: '@erzen',
    img: teamImages.erzen,
    bio: 'Runs the studio and shoots the content. 35,000+ followers across Instagram, TikTok, Facebook and YouTube — and an eye for what makes people stop scrolling.',
    socials: [
      { label: 'Instagram', url: 'https://instagram.com/erzen' },
      { label: 'TikTok', url: 'https://tiktok.com/@erzen' },
      { label: 'YouTube', url: 'https://youtube.com/@erzen' },
    ],
  },
  {
    name: 'Luisa Shala',
    role: 'Art Director / Founder',
    tag: '@theinfinityofspace',
    img: teamImages.luisa,
    bio: 'The hand behind the art. Her illustrations pull 200K+ monthly views on Pinterest and get pinned around the world — a style you can spot from across the room.',
    socials: [
      { label: 'Instagram', url: 'https://instagram.com/theinfinityofspace' },
      { label: 'Pinterest', url: 'https://pinterest.com/theinfinityofspace' },
    ],
  },
]

export default function About() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-12%' })

  return (
    <section className={styles.section} id="about" ref={ref}>
      <motion.div
        className={styles.header}
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <span className={styles.label}>The two of us</span>
        <h2 className={styles.heading}>A studio you can<br />count on one hand.</h2>
      </motion.div>

      <div className={styles.team}>
        {MEMBERS.map((member, i) => (
          <Member key={member.name} member={member} index={i} inView={inView} />
        ))}
      </div>

      <div className={styles.stats}>
        {STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            className={styles.stat}
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.3 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className={styles.statValue}>
              <AnimatedNumber value={stat.value} suffix={stat.suffix} />
            </span>
            <span className={styles.statLabel}>{stat.label}</span>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
