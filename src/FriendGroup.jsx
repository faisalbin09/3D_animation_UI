import { useEffect, useRef, useState } from 'react'
import './FriendGroup.css'

// ─── Scroll-reveal hook ────────────────────────────────────────
function useReveal(threshold = 0.12) {
  const ref = useRef(null)
  const [on, setOn] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setOn(true); io.unobserve(el) } },
      { threshold }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [threshold])
  return [ref, on]
}

// ─── Mouse-parallax tilt on image cards ───────────────────────
function useParallax() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const move = (e) => {
      const r = el.getBoundingClientRect()
      const dx = (e.clientX - (r.left + r.width  / 2)) / r.width
      const dy = (e.clientY - (r.top  + r.height / 2)) / r.height
      el.style.transform = `perspective(900px) rotateY(${dx * 9}deg) rotateX(${-dy * 7}deg) scale(1.04)`
    }
    const leave = () => { el.style.transform = '' }
    el.addEventListener('mousemove', move)
    el.addEventListener('mouseleave', leave)
    return () => { el.removeEventListener('mousemove', move); el.removeEventListener('mouseleave', leave) }
  }, [])
  return ref
}

// ─── Dual-image section ─────────────────────────────────────────
function PersonDual({ id, name, emoji, img1, img2, bio }) {
  const [sRef, on] = useReveal(0.1)
  const tl = useParallax()
  const tr = useParallax()
  return (
    <section id={id} ref={sRef} className={`fg-section fg-dual ${on ? 'fg-in' : ''}`}>
      <div className="fg-dual-grid">
        {/* Left image */}
        <div className={`fg-card fg-card-l ${on ? 'fg-card-in' : ''}`}>
          <div className="fg-img-wrap" ref={tl}>
            <img src={img1} alt={`${name} 1`} loading="lazy" />
            <span className="fg-img-shine" />
          </div>
        </div>

        {/* Centre text */}
        <div className={`fg-copy ${on ? 'fg-copy-in' : ''}`}>
          <span className="fg-emoji">{emoji}</span>
          <h2 className="fg-name">{name}</h2>
          <p  className="fg-bio">{bio}</p>
          <span className="fg-rule" />
        </div>

        {/* Right image */}
        <div className={`fg-card fg-card-r ${on ? 'fg-card-in' : ''}`}>
          <div className="fg-img-wrap" ref={tr}>
            <img src={img2} alt={`${name} 2`} loading="lazy" />
            <span className="fg-img-shine" />
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Single-image section ───────────────────────────────────────
function PersonSingle({ id, name, emoji, img, bio }) {
  const [sRef, on] = useReveal(0.1)
  const tp = useParallax()
  return (
    <section id={id} ref={sRef} className={`fg-section fg-single ${on ? 'fg-in' : ''}`}>
      <div className="fg-single-row">
        {/* Left image */}
        <div className={`fg-card ${on ? 'fg-card-in' : ''}`}>
          <div className="fg-img-wrap" ref={tp}>
            <img src={img} alt={name} loading="lazy" />
            <span className="fg-img-shine" />
          </div>
        </div>

        {/* Right text */}
        <div className={`fg-copy fg-copy-left ${on ? 'fg-copy-in' : ''}`}>
          <span className="fg-emoji">{emoji}</span>
          <h2 className="fg-name">{name}</h2>
          <p  className="fg-bio">{bio}</p>
          <span className="fg-rule" />
        </div>
      </div>
    </section>
  )
}

// ─── Finale ─────────────────────────────────────────────────────
function Finale() {
  const [ref, on] = useReveal(0.06)
  return (
    <section id="fg-finale" ref={ref} className={`fg-finale ${on ? 'fg-in' : ''}`}>
      <div className="fg-finale-glow" />
      <div className="fg-rays">
        {[...Array(10)].map((_, i) => <span key={i} className="fg-ray" style={{ '--ri': i }} />)}
      </div>
      <div className="fg-finale-inner">
        <div className={`fg-finale-imgwrap ${on ? 'fg-fi-in' : ''}`}>
          <img src="/people/group.jpeg" alt="Goatesh Group MREC" className="fg-finale-img" loading="lazy" />
          <span className="fg-finale-border" />
          <span className="fg-finale-underglow" />
        </div>
        <div className={`fg-finale-text ${on ? 'fg-ft-in' : ''}`}>
          <span className="fg-finale-pill">The Crew · MREC</span>
          <h2 className="fg-finale-title">GOATESH<br />GROUP MREC</h2>
          <p className="fg-finale-sub">The most chaotic, legendary, slightly questionable crew — all in one frame.</p>
        </div>
      </div>
    </section>
  )
}

// ─── Intro ──────────────────────────────────────────────────────
function Intro() {
  const [ref, on] = useReveal(0.05)
  return (
    <section id="fg-intro" ref={ref} className={`fg-intro ${on ? 'fg-in' : ''}`}>
      <span className="fg-orb fg-orb1" /><span className="fg-orb fg-orb2" /><span className="fg-orb fg-orb3" />
      <div className="fg-intro-inner">
        <div className="fg-intro-eyebrow">
          <span className="fg-dot" />
          <span>Goatesh Group MREC</span>
          <span className="fg-dot" />
        </div>
        <h1 className="fg-intro-headline">
          Meet the most{' '}
          <em className="fg-hl-red">chaotic</em>,{' '}
          <em className="fg-hl-gold">legendary</em>, and{' '}
          <em className="fg-hl-blue">slightly questionable</em>{' '}
          friend group you'll ever witness.
        </h1>
        <p className="fg-intro-hint">Scroll to meet the crew ↓</p>
      </div>
    </section>
  )
}

// ─── Root ───────────────────────────────────────────────────────
export default function FriendGroup() {
  return (
    <div className="fg-root">
      <Intro />
      <PersonDual id="fg-faisal"    name="Faisal"    emoji="👑" img1="/people/faisal1.jpg"  img2="/people/faisal2.jpg"
        bio="Meet Faisal — the mastermind behind this legendary masterpiece. Built different, thinks faster than bugs appear, and somehow made this site look this good." />
      <PersonDual id="fg-arfath"   name="Arfath"    emoji="😈" img1="/people/arfath1.jpg"  img2="/people/arfath2.jpg"
        bio="Meet Arfath — built like he never skips a meal and never misses one either. Professional eater, part-time menace, full-time target of jokes." />
      <PersonDual id="fg-pratham"  name="Pratham"   emoji="😤" img1="/people/pratham1.jpg" img2="/people/pratham2.jpg"
        bio="Meet Pratham — always acting serious like he runs the world. Bro thinks he's the main character but forgets the script daily." />
      <PersonSingle id="fg-wahab"     name="Wahab"     emoji="🤡" img="/people/wahab.jpeg"
        bio="Meet Wahab — calm on the outside, absolute chaos on the inside. You never know what he's thinking… and that's the scary part." />
      <PersonSingle id="fg-leeladhar" name="Leeladhar" emoji="🧠" img="/people/leela.jpeg"
        bio="Meet Leeladhar — silent observer, random speaker. Drops one line and disappears like it was a side quest." />
      <Finale />
    </div>
  )
}
