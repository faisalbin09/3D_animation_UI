import { useEffect, useRef, useState, useCallback } from 'react'
import './App.css'

const TOTAL_FRAMES = 196
const FRAME_PATH = (n) => `/sequence/ezgif-frame-${String(n).padStart(3, '0')}.jpg`

// Pre-load all frames into Image objects
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

  // Draw the current frame index onto canvas
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

    // Contain: fit the image inside the canvas, centered (letterbox)
    const scale = Math.min(cw / iw, ch / ih)
    const dw = iw * scale
    const dh = ih * scale
    const dx = (cw - dw) / 2
    const dy = (ch - dh) / 2

    ctx.clearRect(0, 0, cw, dh + dy * 2)
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, cw, ch)
    ctx.drawImage(img, dx, dy, dw, dh)
  }, [])

  // Resize canvas to fill the window
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    if (ready) drawFrame(frameIndexRef.current)
  }, [ready, drawFrame])

  // Scroll handler — maps scroll position to frame index
  const onScroll = useCallback(() => {
    if (!ready) return
    const scrollTop = window.scrollY
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight
    const progress = Math.max(0, Math.min(1, scrollTop / maxScroll))
    frameIndexRef.current = Math.min(
      TOTAL_FRAMES - 1,
      Math.floor(progress * TOTAL_FRAMES)
    )
  }, [ready])

  // Animation loop — only redraws when index changes
  const loop = useCallback(() => {
    if (frameIndexRef.current !== lastFrameRef.current) {
      drawFrame(frameIndexRef.current)
      lastFrameRef.current = frameIndexRef.current
    }
    rafRef.current = requestAnimationFrame(loop)
  }, [drawFrame])

  // Preload
  useEffect(() => {
    preloadFrames((p) => setLoadProgress(p)).then((images) => {
      imagesRef.current = images
      setReady(true)
    })
  }, [])

  // Once ready: set up canvas, listeners, RAF loop
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
      {/* Loading overlay */}
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

      {/* Sticky canvas */}
      <div className="canvas-sticky">
        <canvas ref={canvasRef} className="main-canvas" />

        {/* Scroll hint — fades out as we scroll */}
        <div className="scroll-hint">
          <span>Scroll to explore</span>
          <div className="scroll-arrow" />
        </div>
      </div>

      {/* Tall scroll space that drives the animation */}
      <div className="scroll-spacer" />
    </>
  )
}
