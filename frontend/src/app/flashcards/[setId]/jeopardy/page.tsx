'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '../../../../lib/supabase'
import { api } from '../../../../lib/api'

const NOTION = {
  bg: '#FFFFFF',
  border: '#EDEDED',
  text: '#37352F',
  muted: 'rgba(55,53,47,0.65)',
}

type Flashcard = {
  id: string
  question: string
  answer: string
  order_index: number
}

type JeopardyCard = {
  id: string
  question: string
  answer: string
  points: number
  difficulty: 'easy' | 'medium' | 'hard'
  answered: boolean
  correct?: boolean
}

type Board = {
  easy: JeopardyCard[]
  medium: JeopardyCard[]
  hard: JeopardyCard[]
}

function buildBoard(cards: Flashcard[]): Board {
  const shuffled = [...cards].sort(() => Math.random() - 0.5)
  const picked = shuffled.slice(0, 9)
  const easy = picked.slice(0, 3).map((c, i) => ({ ...c, points: 100, difficulty: 'easy' as const, answered: false }))
  const medium = picked.slice(3, 6).map((c, i) => ({ ...c, points: 300, difficulty: 'medium' as const, answered: false }))
  const hard = picked.slice(6, 9).map((c, i) => ({ ...c, points: 500, difficulty: 'hard' as const, answered: false }))
  return { easy, medium, hard }
}

const DIFF_COLORS = {
  easy:   { bg: '#f0fdf4', border: '#86efac', text: '#16a34a', btnBg: '#dcfce7' },
  medium: { bg: '#eff6ff', border: '#93c5fd', text: '#1d4ed8', btnBg: '#dbeafe' },
  hard:   { bg: '#faf5ff', border: '#c4b5fd', text: '#7c3aed', btnBg: '#ede9fe' },
}

export default function JeopardyPage() {
  const router = useRouter()
  const { setId } = useParams<{ setId: string }>()

  const [setTitle, setSetTitle] = useState('')
  const [board, setBoard] = useState<Board | null>(null)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [loading, setLoading] = useState(true)

  // Active question modal
  const [active, setActive] = useState<JeopardyCard | null>(null)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }: { data: { session: any } }) => {
      if (!session) { router.push('/auth/signin'); return }
      const [setData, cardsData] = await Promise.all([
        supabase.from('flashcard_sets').select('title').eq('id', setId).single().then(r => r.data),
        api.getFlashcards(setId).catch(() => []),
      ])
      if (setData) setSetTitle(setData.title)
      if (cardsData.length < 3) {
        setBoard({ easy: [], medium: [], hard: [] })
      } else {
        setBoard(buildBoard(cardsData))
      }
      setLoading(false)
    })
  }, [setId, router])

  const openCard = (card: JeopardyCard) => {
    if (card.answered) return
    setActive(card)
    setRevealed(false)
  }

  const markCorrect = () => {
    if (!active) return
    const newScore = score + active.points
    setScore(newScore)
    if (newScore > highScore) setHighScore(newScore)
    closeCard(true)
  }

  const markWrong = () => {
    closeCard(false)
  }

  const closeCard = (correct: boolean) => {
    if (!active || !board) return
    const diff = active.difficulty
    setBoard(prev => {
      if (!prev) return prev
      return {
        ...prev,
        [diff]: prev[diff].map(c => c.id === active.id ? { ...c, answered: true, correct } : c),
      }
    })
    setActive(null)
    setRevealed(false)
  }

  const allAnswered = board
    ? [...board.easy, ...board.medium, ...board.hard].every(c => c.answered)
    : false

  const resetBoard = () => {
    api.getFlashcards(setId).then(cardsData => {
      setBoard(buildBoard(cardsData))
      setScore(0)
    }).catch(() => {})
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ backgroundColor: NOTION.bg }}>
        <div className="text-sm" style={{ color: NOTION.muted }}>Loading…</div>
      </div>
    )
  }

  const noCards = !board || (board.easy.length === 0 && board.medium.length === 0 && board.hard.length === 0)

  return (
    <div className="min-h-screen" style={{ fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", backgroundColor: NOTION.bg }}>
      <div className="mx-auto max-w-3xl px-6 py-10">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <button onClick={() => router.back()} className="mb-1 text-sm" style={{ color: NOTION.muted }}>← Back</button>
            <h1 className="text-xl font-bold" style={{ color: NOTION.text }}>Jeopardy — {setTitle}</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs" style={{ color: NOTION.muted }}>Score</div>
              <div className="text-2xl font-bold tabular-nums" style={{ color: NOTION.text }}>{score}</div>
            </div>
            {highScore > 0 && (
              <div className="text-right">
                <div className="text-xs" style={{ color: NOTION.muted }}>Best</div>
                <div className="text-lg font-semibold tabular-nums" style={{ color: NOTION.muted }}>{highScore}</div>
              </div>
            )}
          </div>
        </div>

        {noCards ? (
          <div className="rounded-lg border border-dashed p-12 text-center" style={{ borderColor: NOTION.border }}>
            <div className="mb-2 text-3xl">🃏</div>
            <div className="text-sm font-medium" style={{ color: NOTION.text }}>Not enough cards</div>
            <div className="mt-1 text-sm" style={{ color: NOTION.muted }}>You need at least 3 flashcards to play Jeopardy.</div>
            <button onClick={() => router.back()} className="mt-4 text-sm underline" style={{ color: NOTION.muted }}>Go back</button>
          </div>
        ) : allAnswered ? (
          <div className="rounded-2xl border py-16 text-center" style={{ borderColor: NOTION.border }}>
            <div className="mb-4 text-5xl">🏆</div>
            <div className="mb-2 text-xl font-bold" style={{ color: NOTION.text }}>Board complete!</div>
            <div className="mb-6 text-sm" style={{ color: NOTION.muted }}>Final score: {score}</div>
            <button onClick={resetBoard} className="rounded px-5 py-2.5 text-sm font-medium text-white" style={{ backgroundColor: '#37352F' }}>
              Play again
            </button>
          </div>
        ) : (
          <>
            {/* Difficulty headers */}
            <div className="mb-4 grid grid-cols-3 gap-3">
              {(['easy', 'medium', 'hard'] as const).map(diff => {
                const col = DIFF_COLORS[diff]
                return (
                  <div key={diff} className="rounded-lg px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider"
                    style={{ backgroundColor: col.btnBg, color: col.text }}>
                    {diff} · {diff === 'easy' ? 100 : diff === 'medium' ? 300 : 500} pts
                  </div>
                )
              })}
            </div>

            {/* Board grid — 3 rows × 3 cols */}
            {board && (
              <div className="grid grid-cols-3 gap-3">
                {([0, 1, 2] as const).flatMap(row =>
                  (['easy', 'medium', 'hard'] as const).map(diff => {
                    const card = board[diff][row]
                    if (!card) return <div key={`${diff}-${row}`} className="h-24 rounded-lg" style={{ backgroundColor: '#FAFAF9' }} />
                    const col = DIFF_COLORS[diff]
                    return (
                      <button
                        key={card.id}
                        onClick={() => openCard(card)}
                        disabled={card.answered}
                        className="flex h-24 items-center justify-center rounded-lg border text-lg font-bold transition-all"
                        style={{
                          borderColor: card.answered ? NOTION.border : col.border,
                          backgroundColor: card.answered
                            ? (card.correct ? '#f0fdf4' : '#fef2f2')
                            : col.bg,
                          color: card.answered
                            ? (card.correct ? '#86efac' : '#fca5a5')
                            : col.text,
                          cursor: card.answered ? 'default' : 'pointer',
                          opacity: card.answered ? 0.6 : 1,
                        }}>
                        {card.answered ? (card.correct ? '✓' : '✗') : card.points}
                      </button>
                    )
                  })
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Question modal */}
      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl" style={{ fontFamily: "Inter, sans-serif" }}>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: NOTION.muted }}>
              {active.difficulty} · {active.points} pts
            </div>

            {/* Question */}
            <div className="mb-6 text-lg leading-relaxed" style={{ color: NOTION.text }}>{active.question}</div>

            {!revealed ? (
              <button
                onClick={() => setRevealed(true)}
                className="w-full rounded-lg py-3 text-sm font-medium text-white"
                style={{ backgroundColor: '#37352F' }}>
                Reveal answer
              </button>
            ) : (
              <>
                {/* Answer */}
                <div className="mb-6 rounded-lg p-4 text-sm" style={{ backgroundColor: '#FAFAF9', border: `1px solid ${NOTION.border}`, color: NOTION.text }}>
                  {active.answer}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={markWrong}
                    className="flex-1 rounded-lg py-3 text-sm font-medium"
                    style={{ border: '1px solid #fca5a5', backgroundColor: '#fef2f2', color: '#dc2626' }}>
                    Incorrect
                  </button>
                  <button
                    onClick={markCorrect}
                    className="flex-1 rounded-lg py-3 text-sm font-medium"
                    style={{ border: '1px solid #86efac', backgroundColor: '#f0fdf4', color: '#16a34a' }}>
                    Correct +{active.points}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
