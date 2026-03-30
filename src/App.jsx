import { useEffect, useRef, useState, useCallback } from 'react'
import './App.css'

const TOTAL_FRAMES = 196
const FRAME_PATH = (n) => `/sequence/ezgif-frame-${String(n).padStart(3, '0')}.jpg`

function preloadFrames(onProgress) {
  return new Promise((resolve) => {
    const images = new Array(TOTAL_FRAMES)
    let loaded = 0

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image()
      img.src = FRAME_PATH(i + 1)
      img.onload = img.onerror = () => {
        loaded++
        onProgress(Math.round((loaded / TOTAL_FRAMES) * 100))
        if (loaded === TOTAL_FRAMES) resolve(images)
      }
      images[i] = img
    }
  })
}

export default function App() {
  const canvasRef = useRef(null)
  const imagesRef = useRef([])
  const frameIndexRef = useRef(0)
  const rafRef = useRef(null)
  const lastFrameRef = useRef(-1)

  const [loadProgress, setLoadProgress] = useState(0)
  const [ready, setReady] = useState(false)
  const [currentSection, setCurrentSection] = useState(0)

  const sections = [
    "Meet the most chaotic, legendary, and slightly questionable friend group you’ll ever witness.",

    "Meet Faisal — the mastermind behind this legendary masterpiece. Built different, thinks faster than bugs appear, and somehow made this site look this good.",

    "Meet Arfath — built like he never skips a meal and never misses one either. Professional eater, part-time menace, full-time target of jokes.",

    "Meet Pratham — always acting serious like he runs the world. Bro thinks he’s the main character but forgets the script daily.",

    "Meet Wahab — calm on the outside, absolute chaos on the inside. You never know what he’s thinking… and that’s the scary part.",

    "Meet Leeladhar — silent observer, random speaker. Drops one line and disappears like it was a side quest.",

    "GOATESH GROUP MREC"
  ]

  const drawFrame = useCallback((index) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const img = imagesRef.current[index]
    if (!img || !img.complete) return

    const cw = canvas.width
    const ch = canvas.height
    const iw = img.naturalWidth
    const ih = img.naturalHeight

    const scale = Math.min(cw / iw, ch / ih)
    const dw = iw * scale
    const dh = ih * scale
    const dx = (cw - dw) / 2
    const dy = (ch - dh) / 2

    ctx.clearRect(0, 0, cw, ch)
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, cw, ch)
    ctx.drawImage(img, dx, dy, dw, dh)
  }, [])

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    if (ready) drawFrame(frameIndexRef.current)
  }, [ready, drawFrame])

  // ✅ SINGLE CORRECT SCROLL HANDLER
  const onScroll = useCallback(() => {
    if (!ready) return

    const scrollTop = window.scrollY
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight
    const progress = Math.max(0, Math.min(1, scrollTop / maxScroll))

    // Frame control
    frameIndexRef.current = Math.min(
      TOTAL_FRAMES - 1,
      Math.floor(progress * TOTAL_FRAMES)
    )

    // Text section control
    const sectionIndex = Math.min(
      sections.length - 1,
      Math.floor(progress * sections.length)
    )

    setCurrentSection(sectionIndex)
  }, [ready, sections.length])

  const loop = useCallback(() => {
    if (frameIndexRef.current !== lastFrameRef.current) {
      drawFrame(frameIndexRef.current)
      lastFrameRef.current = frameIndexRef.current
    }
    rafRef.current = requestAnimationFrame(loop)
  }, [drawFrame])

  useEffect(() => {
    preloadFrames((p) => setLoadProgress(p)).then((images) => {
      imagesRef.current = images
      setReady(true)
    })
  }, [])

  useEffect(() => {
    if (!ready) return

    resizeCanvas()
    drawFrame(0)

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', resizeCanvas)
    rafRef.current = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', resizeCanvas)
      cancelAnimationFrame(rafRef.current)
    }
  }, [ready, resizeCanvas, onScroll, loop, drawFrame])

  return (
    <>
      {!ready && (
        <div className="loader-overlay">
          <div className="loader-inner">
            <div className="loader-label">Loading</div>
            <div className="loader-bar-track">
              <div
                className="loader-bar-fill"
                style={{ width: `${loadProgress}%` }}
              />
            </div>
            <div className="loader-pct">{loadProgress}%</div>
          </div>
        </div>
      )}

      <div className="canvas-sticky">
        <canvas ref={canvasRef} className="main-canvas" />

        {/* 🔥 TEXT OVERLAY */}
        <div className="overlay-text">
          {sections[currentSection]}
        </div>

        <div className="scroll-hint">
          <span>Scroll to explore</span>
          <div className="scroll-arrow" />
        </div>
      </div>

      <div className="scroll-spacer" />
    </>
  )
}