import { useEffect, useRef, useState, useCallback } from 'react'
import './App.css'

const TOTAL_FRAMES = 196
const FRAME_PATH = (n) => `/sequence/ezgif-frame-${String(n).padStart(3, '0')}.jpg`

// ─── Text scenes ──────────────────────────────────────────────
const SCENES = [
  { main: "Hi, I'm Faisal",                  sub: 'PORTFOLIO · 2025',        start: 0.00, end: 0.13 },
  { main: 'Full Stack Developer',              sub: 'MERN · NEXT.JS · NODE',   start: 0.13, end: 0.26 },
  { main: 'I build scalable web experiences', sub: 'FRONTEND TO BACKEND',      start: 0.26, end: 0.37 },
  { main: 'MERN · AI · System Design',        sub: 'CRAFTED WITH PRECISION',   start: 0.37, end: 0.50 },
  { main: 'From idea → design → deployment',  sub: 'END TO END OWNERSHIP',     start: 0.50, end: 0.62 },
  { main: 'Scroll to explore my work',        sub: 'KEEP SCROLLING',           start: 0.62, end: 0.73 },
  { main: 'WanderLust · AI Resume Analyzer',  sub: 'AND MORE BELOW',           start: 0.73, end: 0.87 },
  { main: "Let's build something amazing",    sub: 'REACH OUT · COLLABORATE',  start: 0.87, end: 1.00 },
]

// ─── Helpers ──────────────────────────────────────────────────
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)) }
function lerp(a, b, t)     { return a + (b - a) * t }
function easeOut3(t)        { return 1 - Math.pow(1 - t, 3) }
function easeInOut3(t)      { return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2 }

// ─── Cover-mode canvas draw ───────────────────────────────────
// Fills the canvas while preserving aspect ratio (crops overshooting edges)
function drawCover(ctx, img, cw, ch) {
  const iw = img.naturalWidth
  const ih = img.naturalHeight
  if (!iw || !ih) return

  const scale = Math.max(cw / iw, ch / ih)   // ← cover: max, not min
  const dw    = iw * scale
  const dh    = ih * scale
  const dx    = (cw - dw) / 2
  const dy    = (ch - dh) / 2

  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, cw, ch)
  ctx.drawImage(img, dx, dy, dw, dh)
}

// ─── Preload ──────────────────────────────────────────────────
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
  const canvasRef      = useRef(null)
  const imagesRef      = useRef([])
  const rafRef         = useRef(null)

  // Smooth interpolation — targetProgress drives frame + text
  const targetProgressRef  = useRef(0)   // set from scroll event
  const currentProgressRef = useRef(0)   // lerped inside RAF
  const lastDrawnFrameRef  = useRef(-1)

  // Text refs
  const overlayRef     = useRef(null)
  const mainTextRef    = useRef(null)
  const subTextRef     = useRef(null)
  const activeSceneRef = useRef(-1)

  const [loadProgress, setLoadProgress] = useState(0)
  const [ready, setReady]               = useState(false)

  // ─── Resize ──────────────────────────────────────────────────
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width  = window.innerWidth
    canvas.height = window.innerHeight
    // Redraw current frame after resize so there's no blank flash
    if (ready) {
      const idx = Math.min(
        TOTAL_FRAMES - 1,
        Math.round(currentProgressRef.current * (TOTAL_FRAMES - 1))
      )
      const img = imagesRef.current[idx]
      if (img?.complete) drawCover(canvas.getContext('2d'), img, canvas.width, canvas.height)
    }
  }, [ready])

  // ─── Scroll: only update target, don't draw ───────────────────
  const onScroll = useCallback(() => {
    if (!ready) return
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight
    targetProgressRef.current = clamp(window.scrollY / maxScroll, 0, 1)
  }, [ready])

  // ─── Text overlay update ─────────────────────────────────────
  const updateText = useCallback((progress) => {
    const overlay = overlayRef.current
    const mainEl  = mainTextRef.current
    const subEl   = subTextRef.current
    if (!overlay || !mainEl || !subEl) return

    let activeScene = null
    let opacity = 0, ty = 30, scale = 0.94, blur = 10

    for (let i = 0; i < SCENES.length; i++) {
      const s = SCENES[i]
      if (progress >= s.start && progress <= s.end) {
        activeScene = s
        const local = (progress - s.start) / (s.end - s.start)

        if (local < 0.20) {
          // Fade in — easeOut so it arrives quickly
          const t = easeOut3(local / 0.20)
          opacity = lerp(0,   1,    t)
          ty      = lerp(30,  0,    t)
          scale   = lerp(0.94, 1,   t)
          blur    = lerp(10,  0,    t)
        } else if (local < 0.78) {
          // Hold — fully visible
          opacity = 1; ty = 0; scale = 1; blur = 0
        } else {
          // Fade out — easeInOut for cinematic exit
          const t = easeInOut3((local - 0.78) / 0.22)
          opacity = lerp(1,   0,   t)
          ty      = lerp(0,  -18,  t)
          scale   = lerp(1,  0.96, t)
          blur    = lerp(0,   6,   t)
        }
        break
      }
    }

    const idx = activeScene ? SCENES.indexOf(activeScene) : -1
    if (idx !== activeSceneRef.current) {
      activeSceneRef.current = idx
      if (activeScene) {
        mainEl.textContent = activeScene.main
        subEl.textContent  = activeScene.sub
      }
    }

    overlay.style.opacity   = activeScene ? String(clamp(opacity, 0, 1)) : '0'
    overlay.style.transform = `translateX(-50%) translateY(${ty.toFixed(2)}px) scale(${scale.toFixed(4)})`
    overlay.style.filter    = `blur(${blur.toFixed(2)}px)`
  }, [])

  // ─── RAF loop ────────────────────────────────────────────────
  const loop = useCallback(() => {
    const canvas = canvasRef.current
    if (canvas) {
      // Smooth lerp toward scroll target — 0.10 gives cinematic lag feel
      const SMOOTH = 0.10
      const prev = currentProgressRef.current
      const next = lerp(prev, targetProgressRef.current, SMOOTH)
      currentProgressRef.current = next

      const frameIdx = clamp(Math.round(next * (TOTAL_FRAMES - 1)), 0, TOTAL_FRAMES - 1)

      if (frameIdx !== lastDrawnFrameRef.current) {
        const img = imagesRef.current[frameIdx]
        if (img?.complete) {
          drawCover(canvas.getContext('2d'), img, canvas.width, canvas.height)
          lastDrawnFrameRef.current = frameIdx
        }
      }

      updateText(next)
    }

    rafRef.current = requestAnimationFrame(loop)
  }, [updateText])

  // ─── Preload ─────────────────────────────────────────────────
  useEffect(() => {
    preloadFrames((p) => setLoadProgress(p)).then((images) => {
      imagesRef.current = images
      setReady(true)
    })
  }, [])

  // ─── Boot once ready ─────────────────────────────────────────
  useEffect(() => {
    if (!ready) return

    resizeCanvas()

    // Draw first frame immediately
    const canvas = canvasRef.current
    const img0   = imagesRef.current[0]
    if (canvas && img0?.complete) drawCover(canvas.getContext('2d'), img0, canvas.width, canvas.height)

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', resizeCanvas)
    rafRef.current = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', resizeCanvas)
      cancelAnimationFrame(rafRef.current)
    }
  }, [ready, resizeCanvas, onScroll, loop])

  return (
    <>
      {/* ── Loading ── */}
      {!ready && (
        <div className="loader-overlay">
          <div className="loader-inner">
            <div className="loader-label">Loading</div>
            <div className="loader-bar-track">
              <div className="loader-bar-fill" style={{ width: `${loadProgress}%` }} />
            </div>
            <div className="loader-pct">{loadProgress}%</div>
          </div>
        </div>
      )}

      {/* ── Sticky scene ── */}
      <div className="canvas-sticky">
        <canvas ref={canvasRef} className="main-canvas" />

        {/* Text overlay */}
        <div className="text-overlay" ref={overlayRef} style={{ opacity: 0 }}>
          <div className="text-scene">
            <p  className="text-sub"  ref={subTextRef}>PORTFOLIO · 2025</p>
            <h1 className="text-main" ref={mainTextRef}>Hi, I'm Faisal</h1>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="scroll-hint">
          <span>Scroll to explore</span>
          <div className="scroll-arrow" />
        </div>
      </div>

      {/* Scroll space */}
      <div className="scroll-spacer" />
    </>
  )
}
