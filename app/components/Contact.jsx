import { useRef, useState } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import Magnetic from './Magnetic'
import styles from './Contact.module.css'

const PROJECT_TYPES = ['a brand identity', 'a website', 'content & social', 'illustration', 'something else']
const BUDGETS = ['< 5K', '5–15K', '15K+', 'let us talk']

const emailValid = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

function GrowInput({ value, onChange, placeholder, name, type = 'text' }) {
  return (
    <span className={styles.inputWrap} data-cursor="hover">
      <span className={styles.sizer} aria-hidden>{value || placeholder}</span>
      <input
        className={styles.input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        name={name}
        type={type}
        autoComplete="off"
        spellCheck="false"
      />
    </span>
  )
}

export default function Contact() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-15%' })

  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [type, setType] = useState('')
  const [budget, setBudget] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const filled = [name, company, type, budget, email].filter(Boolean).length
  const progress = Math.round((filled / 5) * 100)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return setError('We would love a name to call you by.')
    if (!type) return setError('Pick what you need help with.')
    if (!emailValid(email)) return setError('That email looks a little off.')
    setError('')
    setSent(true)
  }

  return (
    <section className={styles.section} id="contact" ref={ref}>
      <div className={styles.gridOverlay}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none">
          <line x1="33.3" y1="0" x2="33.3" y2="100" stroke="#fff" strokeWidth="0.2" opacity="0.05" />
          <line x1="66.6" y1="0" x2="66.6" y2="100" stroke="#fff" strokeWidth="0.2" opacity="0.05" />
          <line x1="0" y1="50" x2="100" y2="50" stroke="#fff" strokeWidth="0.2" opacity="0.05" />
        </svg>
      </div>

      <AnimatePresence mode="wait">
        {!sent ? (
          <motion.div
            key="form"
            className={styles.inner}
            initial={{ opacity: 0, y: 40 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className={styles.head}>
              <span className={styles.label}>Say hello</span>
              <div className={styles.progressWrap}>
                <span className={styles.progressText}>{progress}% there</span>
                <div className={styles.progressTrack}>
                  <motion.div
                    className={styles.progressFill}
                    animate={{ width: `${progress}%` }}
                    transition={{ ease: 'easeOut' }}
                  />
                </div>
              </div>
            </div>

            <form className={styles.form} onSubmit={handleSubmit} noValidate>
              <p className={styles.sentence}>
                Hey NICE, I&apos;m{' '}
                <GrowInput value={name} onChange={setName} placeholder="your name" name="name" />
                {' '}from{' '}
                <GrowInput value={company} onChange={setCompany} placeholder="company / brand" name="company" />.
              </p>

              <p className={styles.sentence}>
                I&apos;m after{' '}
                <span className={styles.chips}>
                  {PROJECT_TYPES.map((t) => (
                    <button
                      type="button"
                      key={t}
                      className={`${styles.chip} ${type === t ? styles.chipActive : ''}`}
                      onClick={() => setType(t)}
                      data-cursor="hover"
                    >
                      {t}
                    </button>
                  ))}
                </span>
              </p>

              <p className={styles.sentence}>
                Budget is roughly{' '}
                <span className={styles.chips}>
                  {BUDGETS.map((b) => (
                    <button
                      type="button"
                      key={b}
                      className={`${styles.chip} ${budget === b ? styles.chipActive : ''}`}
                      onClick={() => setBudget(b)}
                      data-cursor="hover"
                    >
                      {b}
                    </button>
                  ))}
                </span>
              </p>

              <p className={styles.sentence}>
                Reach me at{' '}
                <GrowInput value={email} onChange={setEmail} placeholder="you@email.com" name="email" type="email" />.
              </p>

              <div className={styles.messageRow}>
                <textarea
                  className={styles.textarea}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Anything else we should know? (optional)"
                  rows={2}
                  data-cursor="hover"
                />
              </div>

              <div className={styles.actions}>
                <AnimatePresence>
                  {error && (
                    <motion.span
                      className={styles.error}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      {error}
                    </motion.span>
                  )}
                </AnimatePresence>
                <Magnetic strength={0.5}>
                  <button type="submit" className={styles.submit} data-cursor="hover">
                    Send it
                    <span className={styles.submitArrow}>&#8594;</span>
                  </button>
                </Magnetic>
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            className={styles.success}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              className={styles.successMark}
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.15 }}
            >
              <svg viewBox="0 0 968 968">
                <rect width="968" height="968" rx="148" ry="148" fill="#fff" />
                <path
                  fill="#000"
                  d="M242.06,725.01v-350.77c0-21.19,3.25-40.08,9.77-56.7,6.51-16.61,15.03-30.42,25.57-41.43,10.53-11,22.98-19.41,37.35-25.23,14.36-5.81,29.2-8.72,44.52-8.72,36.77,0,65.59,10.7,86.47,32.09,20.87,21.4,37.82,49.53,50.85,84.42l93.65,247.97c1.15,2.91,2.39,5.71,3.73,8.41,1.34,2.71,3.54,4.05,6.61,4.05,3.82,0,6.41-1.14,7.76-3.43,1.34-2.28,2.01-5.5,2.01-9.65V241.78h114.91v351.14c0,22.02-3.26,41.34-9.77,57.95-6.52,16.62-15.04,30.43-25.57,41.43-10.54,11.01-22.98,19.22-37.35,24.61-14.36,5.39-29.21,8.1-44.53,8.1-36.77,0-65.41-10.38-85.89-31.15-20.5-20.77-37.63-49.22-51.42-85.36l-93.65-247.97c-1.15-2.9-2.4-5.7-3.73-8.41-1.35-2.7-3.54-4.05-6.61-4.05-3.83,0-6.42,1.15-7.75,3.43-1.35,2.29-2.01,5.51-2.01,9.66v363.85h-114.91Z"
                />
              </svg>
            </motion.div>
            <h2 className={styles.successTitle}>Nice. Message sent{name ? `, ${name.split(' ')[0]}` : ''}.</h2>
            <p className={styles.successText}>
              We read every one ourselves. No bots, no queue. Expect a reply within a day or two.
            </p>
            <button className={styles.reset} onClick={() => setSent(false)} data-cursor="hover">
              Send another
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
