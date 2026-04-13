'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { api } from '../../lib/api'

// ─── Playlists ────────────────────────────────────────────────
const DEFAULT_PLAYLISTS = [
  { id: 'none',   label: 'No music',         icon: '🔇', url: null },
  { id: 'lofi',   label: 'Lo-fi beats',      icon: '🎵', url: 'https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1&controls=0&loop=1&playlist=jfKfPfyJRdk' },
  { id: 'rain',   label: 'Rain & thunder',   icon: '🌧️', url: 'https://www.youtube.com/embed/mPZkdNFkNps?autoplay=1&controls=0&loop=1&playlist=mPZkdNFkNps' },
  { id: 'jazz',   label: 'Jazz coffee',      icon: '☕', url: 'https://www.youtube.com/embed/VMAPTo7RVCo?autoplay=1&controls=0&loop=1&playlist=VMAPTo7RVCo' },
  { id: 'nature', label: 'Forest sounds',    icon: '🌿', url: 'https://www.youtube.com/embed/xNN7iTA57jM?autoplay=1&controls=0&loop=1&playlist=xNN7iTA57jM' },
  { id: 'space',  label: 'Space ambience',   icon: '🚀', url: 'https://www.youtube.com/embed/ZB4bKBKQ2Yg?autoplay=1&controls=0&loop=1&playlist=ZB4bKBKQ2Yg' },
  { id: 'sitar',  label: 'Indian Classical', icon: '🪕', url: null },
]

function ytEmbedUrl(raw: string): string | null {
  try {
    const u = new URL(raw)
    let id = ''
    if (u.hostname.includes('youtu.be')) id = u.pathname.slice(1)
    else id = u.searchParams.get('v') || ''
    if (!id) return null
    return `https://www.youtube.com/embed/${id}?autoplay=1&controls=0&loop=1&playlist=${id}`
  } catch { return null }
}

// ─── Scene registry ───────────────────────────────────────────
const SCENES = [
  { id: 'coffee',    label: 'Coffee',    icon: '☕' },
  { id: 'plant',     label: 'Plant',     icon: '🌱' },
  { id: 'butterfly', label: 'Butterfly', icon: '🦋' },
  { id: 'flight',    label: 'Flight',    icon: '✈️' },
  { id: 'candle',    label: 'Candle',    icon: '🕯️' },
]

// ─── Per-scene theme: bg + timer ring colours ─────────────────
const SCENE_THEMES: Record<string, { bg: string; ring: [string, string] }> = {
  coffee:    { bg: 'linear-gradient(160deg,#1c0d05 0%,#2e1408 55%,#110700 100%)', ring: ['#f59e0b','#d97706'] },
  plant:     { bg: 'linear-gradient(160deg,#061209 0%,#0d2211 55%,#040e06 100%)', ring: ['#4ade80','#16a34a'] },
  butterfly: { bg: 'linear-gradient(160deg,#120828 0%,#200e42 55%,#090418 100%)', ring: ['#c084fc','#7c3aed'] },
  flight:    { bg: 'linear-gradient(160deg,#030915 0%,#060f28 55%,#020610 100%)', ring: ['#60a5fa','#2563eb'] },
  candle:    { bg: 'linear-gradient(160deg,#1a0b00 0%,#2e1500 55%,#0e0700 100%)', ring: ['#fb923c','#ea580c'] },
}

// ─── Motivational messages ────────────────────────────────────
const MESSAGES = [
  "Every minute you focus now is a minute you don't have to stress later.",
  "The person who is studying right now will thank you.",
  "Discomfort is where growth lives. Stay with it.",
  "One pomodoro at a time. That's all.",
  "You don't have to feel motivated — you just have to start.",
  "Deep work is a superpower. You're building it right now.",
  "The exam is coming. Future you is counting on present you.",
  "Eliminate the noise. Just you and the material.",
  "Consistency beats intensity every time.",
  "You've done hard things before. This is just another one.",
  "Small progress is still progress.",
  "The only way out is through.",
  "Stay curious. The concepts are interesting if you let them be.",
  "Close the tabs. Open the book. Begin.",
  "This session matters. Make it count.",
]

// ═══════════════════════════════════════════════════════════════
// SCENE COMPONENTS
// ═══════════════════════════════════════════════════════════════

// ── Coffee: 3-stage barista workflow ─────────────────────────
function CoffeeScene({ progress }: { progress: number }) {
  const stage = progress < 33 ? 'pull' : progress < 67 ? 'steam' : 'pour'
  const sp = stage === 'pull' ? progress / 33 : stage === 'steam' ? (progress - 33) / 34 : (progress - 67) / 33
  return (
    <div style={{ position: 'relative', height: 220, overflow: 'hidden' }}>
      <style>{`
        @keyframes espStream{0%{height:0;opacity:0}15%{opacity:1}100%{height:52px;opacity:1}}
        @keyframes bubble{0%{transform:translateY(0) scale(1);opacity:0.75}100%{transform:translateY(-38px) scale(0.3);opacity:0}}
        @keyframes steamWaft{0%{transform:translateY(0) scaleX(1);opacity:0.28}100%{transform:translateY(-28px) scaleX(2.2);opacity:0}}
        @keyframes pourWiggle{0%,100%{transform:rotate(0deg) scaleX(1)}50%{transform:rotate(1.5deg) scaleX(0.8)}}
        @keyframes stageIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes sheen{0%,100%{opacity:0.12}50%{opacity:0.32}}
      `}</style>

      {/* Stage label */}
      <div key={stage} style={{
        position: 'absolute', top: 6, left: 0, right: 0, textAlign: 'center',
        fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.38)', animation: 'stageIn 0.5s ease forwards',
      }}>
        {stage === 'pull' ? '☕ Pulling espresso' : stage === 'steam' ? '💨 Steaming milk' : '🎨 Pouring'}
      </div>

      {/* ── STAGE 1: Pull ── */}
      <div style={{ position: 'absolute', inset: 0, opacity: stage === 'pull' ? 1 : 0, transition: 'opacity 1s ease', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 26 }}>
        {/* Machine body */}
        <div style={{ width: 108, height: 80, borderRadius: 10, position: 'relative',
          background: 'linear-gradient(135deg,#8c8c8c 0%,#b0b0b0 28%,#9a9a9a 55%,#686868 100%)',
          boxShadow: 'inset 0 2px 6px rgba(255,255,255,0.18), inset -5px 0 12px rgba(0,0,0,0.2), 0 6px 20px rgba(0,0,0,0.5)',
        }}>
          {/* Brand circle */}
          <div style={{ position: 'absolute', top: 8, left: 10, width: 24, height: 24, borderRadius: '50%', background: '#333', border: '2px solid #555', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)' }} />
          </div>
          {/* Pressure gauge */}
          <div style={{ position: 'absolute', top: 8, right: 10, width: 24, height: 24, borderRadius: '50%', background: '#2a2a2a', border: '2px solid #444', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: 16, height: 16, borderRadius: '50%' }}>
              <div style={{ position: 'absolute', bottom: '50%', left: '50%', width: 1.5, height: 7, background: '#e53', borderRadius: 1, transformOrigin: 'bottom center', transform: `rotate(${-55 + sp * 110}deg)`, transition: 'transform 2s ease' }} />
            </div>
          </div>
          {/* Status LEDs */}
          <div style={{ position: 'absolute', bottom: 10, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 7 }}>
            {[0,1,2].map(i => <div key={i} style={{ width: 9, height: 9, borderRadius: '50%', background: i===1 && sp>0.25 ? '#4ade80' : '#383838', border: '1px solid #2a2a2a', transition: 'background 1s ease', boxShadow: i===1 && sp>0.25 ? '0 0 6px #4ade80' : 'none' }} />)}
          </div>
          {/* Group head */}
          <div style={{ position: 'absolute', bottom: -13, left: '50%', transform: 'translateX(-50%)', width: 38, height: 13, borderRadius: '0 0 5px 5px', background: 'linear-gradient(180deg,#545454 0%,#424242 100%)', boxShadow: '0 4px 8px rgba(0,0,0,0.45)' }} />
          {/* Portafilter */}
          <div style={{ position: 'absolute', bottom: -9, left: 'calc(50% + 12px)', width: 52, height: 6, borderRadius: 3, background: 'linear-gradient(90deg,#3a2010 0%,#5a3020 100%)', transform: 'rotate(-7deg)', transformOrigin: 'left center' }} />
        </div>
        {/* Espresso stream */}
        <div style={{ width: 3, borderRadius: 2, height: `${sp * 50}px`, background: 'linear-gradient(180deg,#3d1800,#8a4010,#3d1800)', transition: 'height 2.5s ease', boxShadow: '0 0 5px rgba(130,60,10,0.5)' }} />
        {/* Shot glass */}
        <div style={{ position: 'relative', width: 28, height: 24, borderRadius: '2px 2px 4px 4px', border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${sp * 82}%`, background: 'linear-gradient(180deg,#c06828 0%,#5a1e00 100%)', transition: 'height 2.5s ease' }}>
            <div style={{ position: 'absolute', top: 0, left: '8%', right: '8%', height: 2, background: 'rgba(230,160,60,0.45)', borderRadius: '50%', animation: 'sheen 2s ease-in-out infinite' }} />
          </div>
        </div>
        <div style={{ width: 58, height: 5, background: '#222', borderRadius: 2, marginTop: 2 }} />
      </div>

      {/* ── STAGE 2: Steam ── */}
      <div style={{ position: 'absolute', inset: 0, opacity: stage === 'steam' ? 1 : 0, transition: 'opacity 1s ease', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 14 }}>
        <div style={{ position: 'relative' }}>
          {/* Steam wand */}
          <div style={{ position: 'absolute', left: -10, bottom: 52, width: 7, height: 68, background: 'linear-gradient(90deg,#aaa,#d0d0d0,#aaa)', borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
            <div style={{ position: 'absolute', bottom: -5, left: -3, width: 13, height: 8, borderRadius: 4, background: '#999' }} />
            {sp > 0.08 && [0,1,2].map(i => (
              <div key={i} style={{ position: 'absolute', bottom: 4, left: 2, width: 2, height: 20, borderRadius: 2, background: 'rgba(255,255,255,0.38)', filter: 'blur(1px)', animation: `steamWaft ${1.5+i*0.35}s ease-out infinite`, animationDelay: `${i*0.45}s` }} />
            ))}
          </div>
          {/* Jug */}
          <div style={{ width: 66, height: 88, borderRadius: '7px 13px 5px 5px', position: 'relative',
            background: 'linear-gradient(135deg,#c4c4c4 0%,#e4e4e4 28%,#cecece 58%,#a8a8a8 100%)',
            boxShadow: 'inset -5px 0 10px rgba(0,0,0,0.13), 0 4px 14px rgba(0,0,0,0.45)',
            overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: 7, left: 5, width: 9, height: 26, borderRadius: '50%', background: 'rgba(255,255,255,0.22)', transform: 'rotate(-14deg)' }} />
            {/* Milk fill */}
            <div style={{ position: 'absolute', bottom: 0, left: 2, right: 2, height: `${58 + sp*28}%`, background: 'rgba(255,252,244,0.9)', borderRadius: '0 0 3px 3px', transition: 'height 2s ease' }}>
              {/* Foam */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: `${sp*22}px`, background: 'rgba(255,255,255,0.82)', borderRadius: '2px 2px 0 0', transition: 'height 2s ease', overflow: 'hidden' }}>
                {sp > 0.3 && [3,13,24,8,18].map((x,i) => <div key={i} style={{ position: 'absolute', left: x, top: 2+(i%2)*3, width: 3, height: 3, borderRadius: '50%', background: 'rgba(210,200,188,0.65)' }} />)}
              </div>
            </div>
          </div>
          {/* Handle */}
          <div style={{ position: 'absolute', right: -13, bottom: 18, width: 15, height: 30, border: '4px solid #b4b4b4', borderLeft: 'none', borderRadius: '0 9px 9px 0' }} />
          {/* Bubbles */}
          {sp > 0.12 && [0,1,2,3].map(i => (
            <div key={i} style={{ position: 'absolute', bottom: `${14+(i*12)%42}px`, left: `${8+(i*16)%50}px`, width: i%2===0?4:3, height: i%2===0?4:3, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.5)', animation: `bubble ${1.3+i*0.4}s ease-out infinite`, animationDelay: `${i*0.38}s` }} />
          ))}
        </div>
      </div>

      {/* ── STAGE 3: Pour ── */}
      <div style={{ position: 'absolute', inset: 0, opacity: stage === 'pour' ? 1 : 0, transition: 'opacity 1s ease', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 10 }}>
        <div style={{ position: 'relative', width: 184, height: 155 }}>
          {/* Cup + saucer */}
          <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)' }}>
            <div style={{ width: 98, height: 10, borderRadius: '50%', background: 'linear-gradient(180deg,#ddd 0%,#bbb 100%)', marginBottom: -1, boxShadow: '0 4px 10px rgba(0,0,0,0.35)' }} />
            <div style={{ width: 78, height: 56, marginLeft: 10, borderRadius: '4px 4px 16px 16px', position: 'relative', overflow: 'hidden',
              background: 'linear-gradient(135deg,#f4f3f0 0%,#e8e6e0 40%,#f0ede8 100%)',
              boxShadow: 'inset -4px 0 9px rgba(0,0,0,0.09), 0 2px 8px rgba(0,0,0,0.3)',
            }}>
              {/* Espresso layer */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '34%', background: 'linear-gradient(180deg,#8b4010 0%,#3d1600 100%)' }} />
              {/* Milk pour */}
              <div style={{ position: 'absolute', bottom: '30%', left: 0, right: 0, height: `${sp*44}%`, background: 'linear-gradient(180deg,rgba(255,248,234,0.95) 0%,rgba(235,220,192,0.88) 100%)', transition: 'height 2s ease', overflow: 'hidden' }}>
                {/* Latte art leaf */}
                {sp > 0.48 && (
                  <div style={{ position: 'absolute', top: '8%', left: '50%', transform: 'translateX(-50%)', width: 44, height: 28, opacity: Math.min(1,(sp-0.48)*5), transition: 'opacity 1s ease' }}>
                    {[0,1,2,3,4].map(i => <div key={i} style={{ position: 'absolute', top: `${18+i*13}%`, left: `${14+Math.abs(i-2)*12}%`, width: `${42-Math.abs(i-2)*10}%`, height: 2.5, borderRadius: 2, background: 'rgba(110,65,25,0.32)', transform: `rotate(${(i-2)*7}deg)` }} />)}
                    <div style={{ position: 'absolute', top: '8%', left: '50%', transform: 'translateX(-50%)', width: 1.5, height: '82%', background: 'rgba(110,65,25,0.38)', borderRadius: 1 }} />
                  </div>
                )}
                <div style={{ position: 'absolute', top: 0, left: '12%', right: '12%', height: 3, borderRadius: '50%', background: 'rgba(255,240,200,0.48)', animation: 'sheen 2.2s ease-in-out infinite' }} />
              </div>
            </div>
            <div style={{ position: 'absolute', right: 4, bottom: 11, width: 15, height: 24, border: '3px solid #ddd', borderLeft: 'none', borderRadius: '0 9px 9px 0' }} />
          </div>
          {/* Pour stream */}
          {sp < 0.94 && (
            <div style={{ position: 'absolute', top: 12, left: '68%', width: 3, height: `${28+sp*28}px`, background: 'linear-gradient(180deg,rgba(242,232,212,0.9),rgba(220,200,168,0.7))', borderRadius: 2, transform: 'rotate(11deg)', transformOrigin: 'top center', animation: 'pourWiggle 0.45s ease-in-out infinite', boxShadow: '0 0 5px rgba(220,200,168,0.4)' }} />
          )}
          {/* Tilted jug */}
          <div style={{ position: 'absolute', top: 0, right: 0, width: 50, height: 65,
            background: 'linear-gradient(135deg,#c6c6c6 0%,#dedede 32%,#bfbfbf 100%)',
            borderRadius: '5px 11px 4px 4px',
            boxShadow: 'inset -4px 0 8px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.35)',
            transform: `rotate(${-22-sp*10}deg)`, transformOrigin: 'bottom left', transition: 'transform 2s ease',
            overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', bottom: 3, left: 3, right: 3, height: `${(1-sp)*58+4}%`, background: 'rgba(255,252,244,0.82)', borderRadius: '0 0 2px 2px', transition: 'height 2s ease' }} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Plant ─────────────────────────────────────────────────────
function PlantScene({ progress }: { progress: number }) {
  const stemH = Math.min(140, 16 + progress * 1.35)
  const leaf1W = Math.min(46, Math.max(0, (progress - 18) * 1.1))
  const leaf2W = Math.min(38, Math.max(0, (progress - 30) * 0.9))
  const leaf3W = Math.min(32, Math.max(0, (progress - 50) * 1.2))
  const showFlower = progress > 78
  const lightRayOpacity = progress > 60 ? (progress - 60) / 100 : 0

  return (
    <div style={{ position: 'relative', height: 220, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <style>{`
        @keyframes leafSway{0%,100%{transform:rotate(-28deg) scaleX(1)}50%{transform:rotate(-22deg) scaleX(0.96)}}
        @keyframes leafSway2{0%,100%{transform:rotate(28deg) scaleX(1)}50%{transform:rotate(22deg) scaleX(0.96)}}
        @keyframes leafSway3{0%,100%{transform:rotate(-18deg)}50%{transform:rotate(-12deg)}}
        @keyframes bloomIn{from{opacity:0;transform:scale(0) rotate(-20deg)}to{opacity:1;transform:scale(1) rotate(0deg)}}
        @keyframes lightRay{0%,100%{opacity:${lightRayOpacity * 0.6}}50%{opacity:${lightRayOpacity}}}
        @keyframes stemGrow{from{scaleY:0}to{scaleY:1}}
      `}</style>

      {/* Light ray from above */}
      {lightRayOpacity > 0 && (
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: 60, height: '60%',
          background: 'linear-gradient(180deg, rgba(180,240,120,0.12) 0%, transparent 100%)',
          filter: 'blur(14px)',
          animation: 'lightRay 4s ease-in-out infinite',
          pointerEvents: 'none',
        }} />
      )}

      {/* Pot */}
      <div style={{
        position: 'absolute', bottom: 0,
        width: 74, height: 54,
        background: 'linear-gradient(160deg,#c84e14 0%,#9a3a0c 55%,#7a2e08 100%)',
        borderRadius: '6px 6px 18px 18px',
        boxShadow: 'inset -6px 0 10px rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.5)',
        overflow: 'visible',
      }}>
        {/* Rim */}
        <div style={{
          position: 'absolute', top: -7, left: -5, right: -5, height: 14,
          background: 'linear-gradient(180deg,#d85e20 0%,#b04410 100%)',
          borderRadius: 4,
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
        }} />
        {/* Soil */}
        <div style={{
          position: 'absolute', top: 4, left: 4, right: 4, height: 14,
          background: 'linear-gradient(180deg,#3d2010 0%,#2a1408 100%)',
          borderRadius: 2,
        }} />
      </div>

      {/* Stem — curved via border-radius trick */}
      <div style={{
        position: 'absolute', bottom: 50,
        left: '50%', transform: 'translateX(-50%)',
        width: 7, borderRadius: 4,
        height: stemH,
        background: 'linear-gradient(180deg,#5cb85c 0%,#3a8a3a 60%,#2a6a2a 100%)',
        transition: 'height 2s ease',
        boxShadow: 'inset -2px 0 4px rgba(0,0,0,0.15)',
        transformOrigin: 'bottom center',
      }} />

      {/* Leaf 1 (lower left) */}
      {leaf1W > 2 && (
        <div style={{
          position: 'absolute',
          bottom: 50 + stemH * 0.28,
          left: `calc(50% - 3px)`,
          width: leaf1W, height: 14,
          borderRadius: '50% 50% 50% 0',
          background: 'linear-gradient(135deg,#5cb85c 0%,#3a8a3a 100%)',
          transformOrigin: 'right center',
          animation: 'leafSway 4s ease-in-out infinite',
          transition: 'width 2s ease',
          boxShadow: 'inset -3px 0 6px rgba(0,0,0,0.15)',
        }} />
      )}
      {/* Leaf 2 (mid right) */}
      {leaf2W > 2 && (
        <div style={{
          position: 'absolute',
          bottom: 50 + stemH * 0.52,
          right: `calc(50% - 3px)`,
          width: leaf2W, height: 12,
          borderRadius: '50% 50% 0 50%',
          background: 'linear-gradient(135deg,#6cc86c 0%,#4a9a4a 100%)',
          transformOrigin: 'left center',
          animation: 'leafSway2 4.5s ease-in-out infinite',
          transition: 'width 2s ease',
        }} />
      )}
      {/* Leaf 3 (upper left) */}
      {leaf3W > 2 && (
        <div style={{
          position: 'absolute',
          bottom: 50 + stemH * 0.74,
          left: `calc(50% - 3px)`,
          width: leaf3W, height: 11,
          borderRadius: '50% 50% 50% 0',
          background: 'linear-gradient(135deg,#7cd87c 0%,#5aaa5a 100%)',
          transformOrigin: 'right center',
          animation: 'leafSway3 3.8s ease-in-out infinite',
          transition: 'width 2s ease',
        }} />
      )}

      {/* Flower */}
      {showFlower && (
        <div style={{
          position: 'absolute',
          bottom: 52 + stemH,
          left: '50%', transform: 'translateX(-50%)',
          fontSize: 30,
          animation: 'bloomIn 1.2s cubic-bezier(0.34,1.56,0.64,1) forwards',
          filter: 'drop-shadow(0 0 8px rgba(255,180,200,0.6))',
        }}>🌸</div>
      )}
    </div>
  )
}

// ── Butterfly ─────────────────────────────────────────────────
function ButterflyScene({ progress }: { progress: number }) {
  const phase = progress < 33 ? 'egg' : progress < 67 ? 'cocoon' : 'butterfly'
  const emergeProgress = phase === 'butterfly' ? (progress - 67) / 33 : 0

  return (
    <div style={{ position: 'relative', height: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
      <style>{`
        @keyframes eggWobble{0%,100%{transform:rotate(-2deg) scale(1)}50%{transform:rotate(2deg) scale(1.03)}}
        @keyframes cocoonSway{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(4deg)}}
        @keyframes wingFlap{0%,100%{transform:scaleX(1)}50%{transform:scaleX(0.55)}}
        @keyframes wingFlapR{0%,100%{transform:scaleX(-1)}50%{transform:scaleX(-0.55)}}
        @keyframes flyBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes sparkle{0%,100%{opacity:0;transform:scale(0)}40%{opacity:1;transform:scale(1)}80%{opacity:0;transform:scale(0.5)}}
        @keyframes phaseLabel{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      {/* Phase label */}
      <div key={phase} style={{
        fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.45)',
        animation: 'phaseLabel 0.5s ease forwards',
      }}>
        {phase === 'egg' ? '🥚 forming...' : phase === 'cocoon' ? '🫘 transforming...' : '🦋 emerged'}
      </div>

      {/* Main visual */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 110 }}>
        {phase === 'egg' && (
          <div style={{
            width: 44, height: 56,
            background: 'radial-gradient(ellipse at 35% 30%, #f8f4ee 0%, #ddd8cc 60%, #b8b0a0 100%)',
            borderRadius: '50% 50% 48% 48%',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4), inset 2px 2px 6px rgba(255,255,255,0.3)',
            animation: 'eggWobble 3s ease-in-out infinite',
          }} />
        )}

        {phase === 'cocoon' && (
          <>
            {/* Branch */}
            <div style={{
              position: 'absolute', top: 0,
              width: 80, height: 6,
              background: 'linear-gradient(90deg,#5a3820 0%,#7a5030 50%,#5a3820 100%)',
              borderRadius: 3,
              boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
            }} />
            {/* Silk thread */}
            <div style={{
              position: 'absolute', top: 6, left: '50%',
              width: 1, height: 18,
              background: 'rgba(220,200,180,0.5)',
            }} />
            {/* Cocoon */}
            <div style={{
              marginTop: 24,
              width: 32, height: 58,
              background: 'linear-gradient(160deg,#c8b898 0%,#a89878 40%,#887858 100%)',
              borderRadius: '40% 40% 50% 50%',
              boxShadow: '0 4px 16px rgba(0,0,0,0.5), inset -4px 0 10px rgba(0,0,0,0.2)',
              animation: 'cocoonSway 3s ease-in-out infinite',
              transformOrigin: 'top center',
              position: 'relative', overflow: 'hidden',
            }}>
              {/* Silk lines */}
              {[0,1,2,3,4].map(i => (
                <div key={i} style={{
                  position: 'absolute',
                  top: `${10 + i * 14}%`, left: '5%', right: '5%',
                  height: 1,
                  background: 'rgba(255,245,230,0.3)',
                  borderRadius: 1,
                }} />
              ))}
            </div>
          </>
        )}

        {phase === 'butterfly' && (
          <div style={{
            display: 'flex', alignItems: 'center',
            animation: 'flyBob 2.4s ease-in-out infinite',
            opacity: Math.min(1, emergeProgress * 3),
            transition: 'opacity 1s ease',
          }}>
            {/* Left wing */}
            <div style={{
              width: 52, height: 48,
              background: 'linear-gradient(135deg,#f97316 0%,#dc2626 40%,#1d4ed8 80%,#1d4ed8 100%)',
              borderRadius: '80% 20% 60% 40%',
              transformOrigin: 'right center',
              animation: 'wingFlap 0.9s ease-in-out infinite',
              filter: `drop-shadow(0 0 ${8 + emergeProgress * 6}px rgba(249,115,22,0.5))`,
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: '20%', left: '20%',
                width: '50%', height: '50%',
                borderRadius: '50%',
                background: 'rgba(255,220,100,0.35)',
              }} />
            </div>
            {/* Body */}
            <div style={{
              width: 10, height: 44, zIndex: 1,
              background: 'linear-gradient(180deg,#1a1a1a 0%,#333 50%,#1a1a1a 100%)',
              borderRadius: 5,
              boxShadow: '0 0 8px rgba(0,0,0,0.6)',
            }} />
            {/* Right wing */}
            <div style={{
              width: 52, height: 48,
              background: 'linear-gradient(225deg,#f97316 0%,#dc2626 40%,#1d4ed8 80%,#1d4ed8 100%)',
              borderRadius: '20% 80% 40% 60%',
              transformOrigin: 'left center',
              animation: 'wingFlapR 0.9s ease-in-out infinite',
              filter: `drop-shadow(0 0 ${8 + emergeProgress * 6}px rgba(249,115,22,0.5))`,
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: '20%', right: '20%',
                width: '50%', height: '50%',
                borderRadius: '50%',
                background: 'rgba(255,220,100,0.35)',
              }} />
            </div>
          </div>
        )}

        {/* Emergence sparkles */}
        {phase === 'butterfly' && emergeProgress < 0.6 && [0,1,2,3,4,5].map(i => (
          <div key={i} style={{
            position: 'absolute',
            top: `${20 + (i * 23) % 60}%`,
            left: `${10 + (i * 31) % 80}%`,
            width: 4, height: 4, borderRadius: '50%',
            background: ['#f97316','#fbbf24','#c084fc','#60a5fa','#f43f5e','#a3e635'][i],
            animation: `sparkle ${1 + i * 0.3}s ease-in-out infinite`,
            animationDelay: `${i * 0.2}s`,
          }} />
        ))}
      </div>

      {/* Progress bar */}
      <div style={{ width: 180, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${progress}%`, borderRadius: 2,
          background: `linear-gradient(90deg,#a78bfa,#f97316)`,
          transition: 'width 1s ease',
          boxShadow: '0 0 6px rgba(167,139,250,0.6)',
        }} />
      </div>
    </div>
  )
}

// ── Cloud shape helper ────────────────────────────────────────
function CloudBlob({ w, tint = 'rgba(255,255,255,0.9)' }: { w: number; tint?: string }) {
  const h = Math.round(w * 0.36)
  const s = (n: number) => Math.round(w * n)
  return (
    <div style={{ position: 'relative', display: 'inline-block', width: w, height: h + s(0.42), flexShrink: 0 }}>
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: w, height: h, borderRadius: h / 2, background: tint, filter: 'blur(1.5px)' }} />
      <div style={{ position: 'absolute', bottom: h - s(0.1), left: s(0.06), width: s(0.36), height: s(0.36), borderRadius: '50%', background: tint, filter: 'blur(1px)' }} />
      <div style={{ position: 'absolute', bottom: h - s(0.15), left: s(0.24), width: s(0.44), height: s(0.44), borderRadius: '50%', background: tint, filter: 'blur(0.5px)' }} />
      <div style={{ position: 'absolute', bottom: h - s(0.08), left: s(0.58), width: s(0.3), height: s(0.3), borderRadius: '50%', background: tint, filter: 'blur(1px)' }} />
    </div>
  )
}

// ── Flight ────────────────────────────────────────────────────
function skyColor(p: number): string {
  if (p < 15) {
    // pre-dawn: deep navy → hints of orange on horizon
    const t = p / 15
    return `linear-gradient(180deg,
      hsl(225,55%,${8 + t * 4}%) 0%,
      hsl(${220 - t * 160},${40 + t * 40}%,${12 + t * 28}%) 65%,
      hsl(${30 - t * 5},${50 + t * 30}%,${18 + t * 32}%) 100%)`
  } else if (p < 40) {
    // dawn → morning
    const t = (p - 15) / 25
    return `linear-gradient(180deg,
      hsl(${210 + t * 5},${55 + t * 5}%,${12 + t * 28}%) 0%,
      hsl(${210 - t * 10},${60 - t * 10}%,${40 + t * 18}%) 60%,
      hsl(${25 + t * 5},${70 - t * 20}%,${50 - t * 10}%) 100%)`
  } else if (p < 65) {
    // clear day
    const t = (p - 40) / 25
    return `linear-gradient(180deg,
      hsl(${215 - t * 5},${65}%,${40 + t * 5}%) 0%,
      hsl(${205},${60}%,${55 + t * 5}%) 100%)`
  } else if (p < 85) {
    // dusk
    const t = (p - 65) / 20
    return `linear-gradient(180deg,
      hsl(${210 - t * 170},${65 - t * 20}%,${45 - t * 30}%) 0%,
      hsl(${30 - t * 10},${75 + t * 5}%,${45 - t * 25}%) 55%,
      hsl(${270 + t * 10},${40 + t * 10}%,${30 - t * 10}%) 100%)`
  } else {
    // night
    const t = (p - 85) / 15
    return `linear-gradient(180deg,
      hsl(235,${55 - t * 10}%,${15 - t * 4}%) 0%,
      hsl(230,${45 - t * 8}%,${20 - t * 6}%) 100%)`
  }
}

function FlightScene({ progress }: { progress: number }) {
  const isNight = progress >= 75
  const isDusk  = progress >= 58 && progress < 88
  const isDawn  = progress < 18
  const sky = skyColor(progress)
  const cloudTint = isNight
    ? 'rgba(130,145,180,0.22)'
    : isDusk
    ? 'rgba(255,170,90,0.75)'
    : 'rgba(255,255,255,0.88)'

  return (
    <div style={{ position: 'relative', height: 220, borderRadius: 18, overflow: 'hidden', background: '#181820' }}>
      <style>{`
        @keyframes cl1{0%{transform:translateX(0)}100%{transform:translateX(-560px)}}
        @keyframes cl2{0%{transform:translateX(0)}100%{transform:translateX(-460px)}}
        @keyframes cl3{0%{transform:translateX(0)}100%{transform:translateX(-340px)}}
        @keyframes twinkle{0%,100%{opacity:0.8}50%{opacity:0.18}}
        @keyframes glassShimmer{0%,100%{opacity:0.05}50%{opacity:0.12}}
      `}</style>

      {/* Cabin wall vignette */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%, transparent 52%, rgba(10,10,16,0.82) 100%)', zIndex: 4, pointerEvents: 'none' }} />

      {/* Porthole frame */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 258, height: 192, borderRadius: '50%', zIndex: 3,
        border: '16px solid rgba(38,38,44,0.97)',
        boxShadow: 'inset 0 0 0 3px rgba(255,255,255,0.07), inset 0 6px 20px rgba(0,0,0,0.7), 0 0 0 3px rgba(22,22,28,0.9), 0 8px 30px rgba(0,0,0,0.8)',
        overflow: 'hidden',
      }}>
        {/* Sky */}
        <div style={{ position: 'absolute', inset: 0, background: sky, transition: 'background 7s ease' }} />

        {/* Horizon glow */}
        {(isDawn || isDusk) && (
          <div style={{
            position: 'absolute', bottom: '22%', left: 0, right: 0, height: 48,
            background: `linear-gradient(180deg, transparent, ${isDusk ? 'rgba(255,110,30,0.45)' : 'rgba(255,160,60,0.38)'})`,
            filter: 'blur(10px)',
          }} />
        )}

        {/* Stars */}
        {isNight && [
          [12,8],[32,13],[50,5],[67,17],[82,8],[90,22],[24,20],[57,11],[76,5],[40,16],[18,28],[62,24],
        ].map(([x,y],i) => (
          <div key={i} style={{
            position: 'absolute', left: `${x}%`, top: `${y}%`,
            width: i%3===0?2:1.5, height: i%3===0?2:1.5, borderRadius: '50%', background: 'white',
            opacity: Math.min(1,(progress-75)/16)*0.75,
            animation: `twinkle ${2.2+(i%4)*0.7}s ease-in-out infinite`,
            animationDelay: `${(i*0.38)%2.8}s`,
          }} />
        ))}

        {/* Moon */}
        {isNight && (
          <div style={{
            position: 'absolute', top: '8%', right: '16%',
            width: 22, height: 22, borderRadius: '50%',
            background: 'radial-gradient(circle at 38% 38%,#f0e8ce,#c8bc90)',
            boxShadow: '0 0 14px rgba(240,230,180,0.4)',
            opacity: Math.min(1,(progress-75)/14),
          }} />
        )}

        {/* Sun */}
        {!isNight && (
          <div style={{
            position: 'absolute',
            left: `${isDawn ? 18 : 12 + progress*0.48}%`,
            top: isDawn ? `${52-(progress/18)*34}%` : `${Math.max(4,22-(progress-18)*0.28)}%`,
            width: isDawn?16:20, height: isDawn?16:20, borderRadius: '50%',
            background: isDawn
              ? 'radial-gradient(circle,#ff9040,#ff5500)'
              : 'radial-gradient(circle,#fffaaa,#ffd020)',
            boxShadow: isDawn
              ? '0 0 18px rgba(255,130,40,0.7)'
              : '0 0 22px rgba(255,210,30,0.55)',
            opacity: isDawn ? Math.min(1,progress/14) : 1,
            transition: 'left 8s ease, top 8s ease',
          }} />
        )}

        {/* Cloud layer 3 — far, slow */}
        <div style={{ position: 'absolute', top: '16%', display: 'flex', gap: 28, animation: 'cl3 75s linear infinite', opacity: isNight?0.09:isDusk?0.52:0.24 }}>
          {[48,40,56,44,50,46,52,42,54].map((w,i) => <CloudBlob key={i} w={w} tint={cloudTint} />)}
        </div>

        {/* Cloud layer 2 — mid */}
        <div style={{ position: 'absolute', top: '36%', display: 'flex', gap: 18, animation: 'cl2 46s linear infinite', opacity: isNight?0.06:isDusk?0.62:0.32 }}>
          {[68,54,80,60,72,58,76,64,70].map((w,i) => <CloudBlob key={i} w={w} tint={cloudTint} />)}
        </div>

        {/* Cloud layer 1 — near, fast */}
        <div style={{ position: 'absolute', top: '54%', display: 'flex', gap: 14, animation: 'cl1 26s linear infinite', opacity: isNight?0.04:isDusk?0.48:0.18 }}>
          {[88,70,100,78,92,74,96,82,86].map((w,i) => <CloudBlob key={i} w={w} tint={cloudTint} />)}
        </div>

        {/* Glass reflection shimmer */}
        <div style={{
          position: 'absolute', top: '-15%', left: '-8%',
          width: '38%', height: '65%', borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
          transform: 'rotate(-22deg)',
          animation: 'glassShimmer 7s ease-in-out infinite',
          pointerEvents: 'none',
        }} />

        {/* Wing tip */}
        <div style={{
          position: 'absolute', bottom: '4%', right: '6%',
          width: 68, height: 18,
          background: 'linear-gradient(135deg,rgba(195,200,212,0.82) 0%,rgba(155,162,178,0.65) 100%)',
          borderRadius: '5px 2px 10px 2px',
          boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.12), 0 2px 8px rgba(0,0,0,0.3)',
          transform: 'perspective(50px) rotateX(10deg)',
        }} />

        {/* Progress text */}
        <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', fontSize: 10, color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap' }}>
          {Math.round(progress)}% of journey
        </div>
      </div>
    </div>
  )
}

// ── Candle ────────────────────────────────────────────────────
function CandleScene({ progress }: { progress: number }) {
  const candleH = Math.round(100 - progress * 0.5)  // 100 → 50px as session runs

  return (
    <div style={{ position: 'relative', height: 220, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <style>{`
        @keyframes outerFlame{
          0%,100%{transform:scaleX(1) rotate(-1.5deg);opacity:1}
          33%{transform:scaleX(0.8) rotate(2.5deg) scaleY(1.08);opacity:0.9}
          66%{transform:scaleX(1.12) rotate(-1deg) scaleY(0.94);opacity:0.95}}
        @keyframes innerFlame{
          0%,100%{transform:scaleX(0.88) rotate(1deg)}
          50%{transform:scaleX(0.65) rotate(-2deg) scaleY(1.1)}}
        @keyframes coreFlame{0%,100%{opacity:0.95;transform:scaleY(1)}50%{opacity:0.72;transform:scaleY(1.06)}}
        @keyframes waxDrip1{0%{height:0;opacity:0.9}75%{height:22px;opacity:0.8}100%{height:24px;opacity:0.1}}
        @keyframes waxDrip2{0%{height:0;opacity:0.8}80%{height:16px;opacity:0.7}100%{height:18px;opacity:0.1}}
        @keyframes candleGlow{0%,100%{opacity:0.52;transform:scale(1)}35%{opacity:0.88;transform:scale(1.1)}70%{opacity:0.62;transform:scale(0.95)}}
        @keyframes wallGlow{0%,100%{opacity:0.35}50%{opacity:0.6}}
      `}</style>

      {/* Wide wall glow */}
      <div style={{
        position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
        width: 210, height: 170,
        background: `radial-gradient(ellipse at 50% 80%, rgba(251,146,60,${0.13 + progress * 0.001}) 0%, transparent 65%)`,
        animation: 'wallGlow 2.5s ease-in-out infinite',
        filter: 'blur(22px)',
        pointerEvents: 'none',
      }} />

      {/* Holder plate */}
      <div style={{
        position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: 72, height: 10, borderRadius: '50%',
        background: 'linear-gradient(180deg,#7a6050 0%,#4a3020 100%)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
      }} />

      {/* Wax pool */}
      <div style={{
        position: 'absolute', bottom: 7, left: '50%', transform: 'translateX(-50%)',
        width: Math.min(58, 28 + progress * 0.3), height: 7, borderRadius: '50%',
        background: 'rgba(245,235,215,0.52)', filter: 'blur(1px)',
        transition: 'width 12s ease',
      }} />

      {/* Candle body — flame lives inside as overflow:visible children */}
      <div style={{
        position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
        width: 30, height: candleH,
        background: 'linear-gradient(90deg,rgba(255,252,245,0.92) 0%,rgba(246,241,228,0.96) 45%,rgba(230,222,205,0.9) 75%,rgba(246,241,226,0.92) 100%)',
        borderRadius: '3px 3px 2px 2px',
        transition: 'height 15s linear',
        boxShadow: 'inset -4px 0 8px rgba(0,0,0,0.07), 2px 0 6px rgba(0,0,0,0.12)',
        overflow: 'visible',
      }}>
        {/* Groove lines */}
        {[7, 15, 22].map(x => (
          <div key={x} style={{ position: 'absolute', top: 0, bottom: 0, left: x, width: 1, background: 'rgba(0,0,0,0.04)' }} />
        ))}
        {/* Wax drips */}
        <div style={{ position: 'absolute', top: 0, left: 4, width: 7, borderRadius: '0 0 4px 4px', background: 'rgba(240,232,210,0.85)', animation: 'waxDrip1 9s ease-in-out infinite', animationDelay: '1.5s' }} />
        <div style={{ position: 'absolute', top: 0, right: 6, width: 5, borderRadius: '0 0 3px 3px', background: 'rgba(240,232,210,0.8)', animation: 'waxDrip2 13s ease-in-out infinite', animationDelay: '5s' }} />

        {/* Wick — sits above candle top */}
        <div style={{
          position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
          width: 2, height: 10, borderRadius: 1,
          background: 'linear-gradient(180deg,#666 0%,#222 100%)',
          zIndex: 2,
        }} />

        {/* Glow halo */}
        <div style={{
          position: 'absolute', top: -56, left: '50%', transform: 'translateX(-50%)',
          width: 76, height: 76, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(251,146,60,0.4) 0%, rgba(251,146,60,0.06) 55%, transparent 72%)',
          animation: 'candleGlow 1.3s ease-in-out infinite',
          filter: 'blur(6px)', zIndex: 1,
        }} />

        {/* Outer flame */}
        <div style={{
          position: 'absolute', top: -48, left: '50%', transform: 'translateX(-50%)',
          width: 22, height: 36,
          background: 'linear-gradient(180deg,#fecaca 0%,#fb923c 28%,#dc2626 72%,#7f1d1d 100%)',
          borderRadius: '50% 50% 34% 34%',
          animation: 'outerFlame 1s ease-in-out infinite',
          transformOrigin: 'bottom center',
          zIndex: 3, filter: 'blur(0.4px)',
        }} />

        {/* Inner flame */}
        <div style={{
          position: 'absolute', top: -42, left: '50%', transform: 'translateX(-50%)',
          width: 13, height: 26,
          background: 'linear-gradient(180deg,#fef3c7 0%,#fde68a 38%,#fb923c 100%)',
          borderRadius: '50% 50% 32% 32%',
          animation: 'innerFlame 0.72s ease-in-out infinite',
          transformOrigin: 'bottom center', zIndex: 4,
        }} />

        {/* Core */}
        <div style={{
          position: 'absolute', top: -35, left: '50%', transform: 'translateX(-50%)',
          width: 5, height: 13,
          background: 'linear-gradient(180deg,#ffffff 0%,#fef9c3 100%)',
          borderRadius: '50% 50% 30% 30%',
          animation: 'coreFlame 0.5s ease-in-out infinite',
          transformOrigin: 'bottom center', zIndex: 5,
        }} />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════

function FocusInner() {
  const router = useRouter()
  const params = useSearchParams()

  const taskTitle   = params.get('title')    || 'Focus session'
  const sessionId   = params.get('sessionId')
  const userId      = params.get('userId')
  const totalSeconds = parseInt(params.get('duration') || '25') * 60

  const [timeLeft, setTimeLeft]     = useState(totalSeconds)
  const [running, setRunning]       = useState(false)
  const [done, setDone]             = useState(false)
  const [notes, setNotes]           = useState('')
  const [playlist, setPlaylist]     = useState('lofi')
  const [scene, setScene]           = useState('coffee')
  const [msgIdx, setMsgIdx]         = useState(0)
  const [msgVisible, setMsgVisible] = useState(true)
  const [showControls, setShowControls] = useState(true)
  const [customUrls, setCustomUrls] = useState<Record<string,string>>(() => {
    try { return JSON.parse(localStorage.getItem('focusCustomUrls') || '{}') } catch { return {} }
  })
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [urlDraft, setUrlDraft]     = useState('')

  const PLAYLISTS = DEFAULT_PLAYLISTS.map(p =>
    customUrls[p.id] ? { ...p, url: ytEmbedUrl(customUrls[p.id]) ?? p.url } : p
  )

  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null)
  const msgRef     = useRef<ReturnType<typeof setInterval> | null>(null)
  const controlsRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const progress = Math.round(((totalSeconds - timeLeft) / totalSeconds) * 100)
  const minutes  = Math.floor(timeLeft / 60)
  const seconds  = timeLeft % 60
  const theme    = SCENE_THEMES[scene] ?? SCENE_THEMES.coffee

  // Timer
  useEffect(() => {
    if (running && !done) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) { clearInterval(timerRef.current!); setRunning(false); setDone(true); return 0 }
          return prev - 1
        })
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [running, done])

  // Rotate messages every 8s with fade
  useEffect(() => {
    msgRef.current = setInterval(() => {
      setMsgVisible(false)
      setTimeout(() => { setMsgIdx(i => (i + 1) % MESSAGES.length); setMsgVisible(true) }, 600)
    }, 8000)
    return () => { if (msgRef.current) clearInterval(msgRef.current) }
  }, [])

  // Auto-hide controls after 4s
  useEffect(() => {
    const reset = () => {
      setShowControls(true)
      if (controlsRef.current) clearTimeout(controlsRef.current)
      if (running) controlsRef.current = setTimeout(() => setShowControls(false), 4000)
    }
    window.addEventListener('mousemove', reset)
    window.addEventListener('touchstart', reset)
    return () => { window.removeEventListener('mousemove', reset); window.removeEventListener('touchstart', reset) }
  }, [running])

  const saveCustomUrl = (id: string) => {
    const next = { ...customUrls, [id]: urlDraft }
    setCustomUrls(next)
    localStorage.setItem('focusCustomUrls', JSON.stringify(next))
    setShowUrlInput(false)
    setUrlDraft('')
  }

  const handleComplete = async () => {
    if (sessionId) await api.completePomodoro(sessionId, notes || undefined).catch(() => {})
    router.push('/dashboard')
  }

  const selectedPlaylist = PLAYLISTS.find(p => p.id === playlist)!

  const renderScene = () => {
    switch (scene) {
      case 'coffee':    return <CoffeeScene    progress={progress} />
      case 'plant':     return <PlantScene     progress={progress} />
      case 'butterfly': return <ButterflyScene progress={progress} />
      case 'flight':    return <FlightScene    progress={progress} />
      case 'candle':    return <CandleScene    progress={progress} />
      default:          return <CoffeeScene    progress={progress} />
    }
  }

  return (
    <div className="relative flex h-screen flex-col overflow-hidden select-none"
      style={{
        background: theme.bg,
        transition: 'background 1.8s ease',
        fontFamily: 'Inter, sans-serif',
      }}>

      {/* YouTube audio (hidden) */}
      {selectedPlaylist.url && (
        <iframe src={selectedPlaylist.url} allow="autoplay"
          style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
          title="ambient audio" />
      )}

      {/* Noise texture */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.04\'/%3E%3C/svg%3E")',
      }} />

      {/* Done screen */}
      {done && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center"
          style={{ background: 'rgba(8,6,18,0.96)', backdropFilter: 'blur(12px)' }}>
          <div className="mb-4 text-7xl" style={{ animation: 'bdoneIn 0.7s cubic-bezier(0.34,1.56,0.64,1)' }}>🎉</div>
          <div className="mb-2 text-3xl font-bold text-white">Session complete!</div>
          <div className="mb-8 text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
            {Math.round(totalSeconds / 60)} minutes of deep work. Well done.
          </div>
          <textarea placeholder="Any notes? What did you cover?" value={notes}
            onChange={e => setNotes(e.target.value)} rows={3}
            className="mb-6 w-80 resize-none rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.13)' }} />
          <button onClick={handleComplete}
            className="rounded-xl px-8 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ background: `linear-gradient(135deg,${theme.ring[0]},${theme.ring[1]})` }}>
            Save & return →
          </button>
          <style>{`@keyframes bdoneIn{from{transform:scale(0) rotate(-15deg);opacity:0}to{transform:scale(1) rotate(0);opacity:1}}`}</style>
        </div>
      )}

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4"
        style={{ opacity: showControls ? 1 : 0, transition: 'opacity 0.5s ease' }}>
        <button onClick={() => router.push('/dashboard')}
          className="text-sm transition hover:opacity-80"
          style={{ color: 'rgba(255,255,255,0.35)' }}>← Back</button>
        <div className="truncate max-w-xs text-sm font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>
          {taskTitle}
        </div>
        <div style={{ width: 48 }} />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-5 px-4">

        {/* Timer ring */}
        <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>
          <svg width="200" height="200" style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
            <circle cx="100" cy="100" r="88" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
            <circle cx="100" cy="100" r="88" fill="none"
              stroke="url(#timerGrad)" strokeWidth="8" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 88}`}
              strokeDashoffset={`${2 * Math.PI * 88 * (timeLeft / totalSeconds)}`}
              style={{ transition: 'stroke-dashoffset 1s linear' }} />
            <defs>
              <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={theme.ring[0]} />
                <stop offset="100%" stopColor={theme.ring[1]} />
              </linearGradient>
            </defs>
          </svg>
          <div className="text-center">
            <div className="text-5xl font-bold tabular-nums text-white">
              {String(minutes).padStart(2,'0')}:{String(seconds).padStart(2,'0')}
            </div>
            <div className="mt-1 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{progress}% complete</div>
          </div>
        </div>

        {/* Play / pause */}
        <button onClick={() => setRunning(r => !r)}
          className="flex h-14 w-14 items-center justify-center rounded-full text-white text-2xl transition hover:scale-105 active:scale-95"
          style={{
            background: running ? 'rgba(255,255,255,0.08)' : `linear-gradient(135deg,${theme.ring[0]},${theme.ring[1]})`,
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: running ? 'none' : `0 0 20px ${theme.ring[0]}55`,
          }}>
          {running ? '⏸' : '▶'}
        </button>

        {/* Motivational message */}
        <div className="max-w-sm text-center text-sm leading-relaxed"
          style={{
            color: 'rgba(255,255,255,0.42)', minHeight: 40,
            opacity: msgVisible ? 1 : 0, transition: 'opacity 0.6s ease',
            fontStyle: 'italic', letterSpacing: '0.01em',
          }}>
          "{MESSAGES[msgIdx]}"
        </div>

        {/* Ambient scene */}
        <div className="w-full max-w-xs">{renderScene()}</div>
      </div>

      {/* Bottom controls */}
      <div className="relative z-10 px-6 py-5"
        style={{ opacity: showControls ? 1 : 0, transition: 'opacity 0.5s ease' }}>

        {/* Scene picker */}
        <div className="mb-4 flex justify-center gap-2">
          {SCENES.map(s => (
            <button key={s.id} onClick={() => { setScene(s.id); setShowUrlInput(false) }}
              title={s.label}
              className="flex h-9 w-9 items-center justify-center rounded-full text-base transition"
              style={{
                background: scene === s.id ? `${theme.ring[0]}44` : 'rgba(255,255,255,0.06)',
                border: scene === s.id ? `1px solid ${theme.ring[0]}cc` : '1px solid rgba(255,255,255,0.1)',
                boxShadow: scene === s.id ? `0 0 10px ${theme.ring[0]}44` : 'none',
              }}>
              {s.icon}
            </button>
          ))}
        </div>

        {/* Music picker */}
        <div className="flex justify-center gap-1.5 flex-wrap">
          {PLAYLISTS.map(p => (
            <div key={p.id} className="flex items-center">
              <button onClick={() => { setPlaylist(p.id); setShowUrlInput(false) }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition"
                style={{
                  background: playlist === p.id ? `${theme.ring[0]}38` : 'rgba(255,255,255,0.06)',
                  border: playlist === p.id ? `1px solid ${theme.ring[0]}bb` : '1px solid rgba(255,255,255,0.1)',
                  color: playlist === p.id ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.42)',
                  borderRadius: p.id !== 'none' ? '9999px 0 0 9999px' : '9999px',
                  borderRight: p.id !== 'none' ? 'none' : undefined,
                }}>
                <span>{p.icon}</span>
                <span>{p.label}</span>
              </button>
              {p.id !== 'none' && (
                <button
                  onClick={() => { setPlaylist(p.id); setUrlDraft(customUrls[p.id] || ''); setShowUrlInput(true) }}
                  title="Set custom YouTube URL"
                  className="px-1.5 py-1.5 text-xs transition hover:opacity-80"
                  style={{
                    background: playlist === p.id ? `${theme.ring[0]}38` : 'rgba(255,255,255,0.06)',
                    border: playlist === p.id ? `1px solid ${theme.ring[0]}bb` : '1px solid rgba(255,255,255,0.1)',
                    borderLeft: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '0 9999px 9999px 0',
                    color: 'rgba(255,255,255,0.28)',
                    fontSize: 10,
                  }}>✏️</button>
              )}
            </div>
          ))}
        </div>

        {/* Custom URL input */}
        {showUrlInput && (
          <div className="mt-3 flex items-center gap-2 justify-center">
            <input autoFocus value={urlDraft} onChange={e => setUrlDraft(e.target.value)}
              placeholder="Paste YouTube URL…"
              className="rounded-lg px-3 py-1.5 text-xs text-white outline-none w-64"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.18)' }}
              onKeyDown={e => { if (e.key === 'Enter') saveCustomUrl(playlist) }} />
            <button onClick={() => saveCustomUrl(playlist)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-white transition hover:opacity-80"
              style={{ background: `${theme.ring[0]}66`, border: `1px solid ${theme.ring[0]}99` }}>
              Set
            </button>
            <button onClick={() => setShowUrlInput(false)}
              className="text-xs hover:opacity-80"
              style={{ color: 'rgba(255,255,255,0.28)' }}>✕</button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function FocusPage() {
  return <Suspense><FocusInner /></Suspense>
}
