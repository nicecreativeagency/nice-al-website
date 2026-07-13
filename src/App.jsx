import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Statement from './components/Statement'
import Work from './components/Work'
import About from './components/About'
import Products from './components/Products'
import Philosophy from './components/Philosophy'
import Footer from './components/Footer'

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Statement />
        <Work />
        <About />
        <Products />
        <Philosophy />
        <Footer />
      </main>
    </>
  )
}
