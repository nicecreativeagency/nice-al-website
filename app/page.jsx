'use client'

import { useState } from 'react'
import useSmoothScroll from './hooks/useSmoothScroll'
import Preloader from './components/Preloader'
import CustomCursor from './components/CustomCursor'
import Hero from './components/Hero'
import Statement from './components/Statement'
import Contact from './components/Contact'
import Footer from './components/Footer'

export default function Home() {
  const [loaded, setLoaded] = useState(false)
  useSmoothScroll()

  return (
    <>
      <Preloader onDone={() => setLoaded(true)} />
      <CustomCursor />
      <main>
        <Hero loaded={loaded} />
        <Statement />
        <Contact />
        <Footer />
      </main>
    </>
  )
}
