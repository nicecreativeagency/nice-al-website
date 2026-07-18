'use client'

import { useState } from 'react'
import useSmoothScroll from './hooks/useSmoothScroll'
import Preloader from './components/Preloader'
import CustomCursor from './components/CustomCursor'
import ScrollProgress from './components/ScrollProgress'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Statement from './components/Statement'
import Work from './components/Work'
import Capabilities from './components/Capabilities'
import About from './components/About'
import Products from './components/Products'
import Philosophy from './components/Philosophy'
import Contact from './components/Contact'
import Footer from './components/Footer'

export default function Home() {
  const [loaded, setLoaded] = useState(false)
  useSmoothScroll()

  return (
    <>
      <Preloader onDone={() => setLoaded(true)} />
      <CustomCursor />
      <ScrollProgress />
      <Navbar />
      <main>
        <Hero loaded={loaded} />
        <Statement />
        <Work />
        <Capabilities />
        <About />
        <Products />
        <Philosophy />
        <Contact />
        <Footer />
      </main>
    </>
  )
}
