'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import { api } from '../../lib/api'

const N = {
  bg: '#FFFFFF', sidebar: '#FBFBFA', border: '#EDEDED',
  hover: '#EFEFED', text: '#37352F', muted: 'rgba(55,53,47,0.5)',
  indigo: '#6366F1', indigoBg: '#EEF2FF',
  green: '#16A34A', greenBg: '#F0FDF4',
  amber: '#D97706', amberBg: '#FFFBEB',
  red: '#DC2626', redBg: '#FEF2F2',
}

type Course = { id: string; name: string; color: string }
type Bank = { id: string; title: string; source_type: 'past_paper' | 'generated'; source_label: string | null; created_at: string; question_count: number }
type Question = { id: string; topic: string; question_text: string; model_answer: string; explanation: string; source_label: string | null }
type GradeResult = { grade: string; score: number; feedback: string; what_was_good: string; what_to_improve: string }

const GRADE_STYLE: Record<string, { color: string; bg: string }> = {
  Excellent:    { color: N.green,  bg: N.greenBg },
  Good:         { color: '#2563EB', bg: '#EFF6FF' },
  Developing:   { color: N.amber,  bg: N.amberBg },
  Insufficient: { color: N.red,    bg: N.redBg },
}

function QuestionCard({ q }: { q: Question }) {
  const [attempt, setAttempt]     = useState('')
  const [revealed, setRevealed]   = useState(false)
  const [grading, setGrading]     = useState(false)
  const [grade, setGrade]         = useState<GradeResult | null>(null)

  const handleGrade = async () => {
    if (!attempt.trim()) return
    setGrading(true)
    try {
      const result = await api.gradeAnswer({ question_text: q.question_text, user_answer: attempt, topic: q.topic })
      setGrade(result)
    } catch (e: any) {
      alert(e.message || 'Grading failed')
    } finally {
      setGrading(false)
    }
  }

  const gs = grade ? (GRADE_STYLE[grade.grade] || GRADE_STYLE.Developing) : null

  return (
    <div className="rounded-xl border p-5 space-y-3" style={{ borderColor: N.border, backgroundColor: N.bg }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm leading-relaxed flex-1" style={{ color: N.text }}>{q.question_text}</p>
        {q.source_label && (
          <span className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
            style={{ backgroundColor: N.indigoBg, color: N.indigo }}>{q.source_label}</span>
        )}
      </div>

      {/* Attempt */}
      <textarea
        value={attempt}
        onChange={e => setAttempt(e.target.value)}
        placeholder="Write your answer…"
        rows={4}
        className="w-full rounded-lg px-3 py-2 text-sm resize-none focus:outline-none"
        style={{ border: `1px solid ${N.border}`, backgroundColor: N.sidebar, color: N.text }}
      />

      <div className="flex gap-2 flex-wrap">
        <button onClick={handleGrade} disabled={grading || !attempt.trim()}
          className="rounded-lg px-4 py-1.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
          style={{ backgroundColor: N.indigo }}>
          {grading ? 'Grading…' : 'Grade'}
        </button>
        <button onClick={() => setRevealed(v => !v)}
          className="rounded-lg px-4 py-1.5 text-sm font-medium transition hover:bg-[#EFEFED]"
          style={{ border: `1px solid ${N.border}`, color: N.muted }}>
          {revealed ? 'Hide answer' : 'Reveal answer'}
        </button>
      </div>

      {/* Grade result */}
      {grade && gs && (
        <div className="rounded-lg border p-4 space-y-2" style={{ borderColor: gs.color + '44', backgroundColor: gs.bg }}>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold" style={{ color: gs.color }}>{grade.grade}</span>
            <span className="text-xs" style={{ color: N.muted }}>{'★'.repeat(grade.score)}{'☆'.repeat(4 - grade.score)}</span>
          </div>
          <p className="text-sm" style={{ color: N.text }}>{grade.feedback}</p>
          {grade.what_was_good && <p className="text-xs" style={{ color: N.green }}>✓ {grade.what_was_good}</p>}
          {grade.what_to_improve && <p className="text-xs" style={{ color: N.amber }}>↑ {grade.what_to_improve}</p>}
        </div>
      )}

      {/* Revealed model answer */}
      {revealed && (
        <div className="rounded-lg border p-4 space-y-2" style={{ borderColor: N.border, backgroundColor: N.sidebar }}>
          <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: N.muted }}>Model Answer</div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: N.text }}>{q.model_answer}</p>
          {q.explanation && (
            <>
              <div className="text-xs font-semibold uppercase tracking-wide mt-2" style={{ color: N.muted }}>What this tests</div>
              <p className="text-xs" style={{ color: N.muted }}>{q.explanation}</p>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default function QuestionsPage() {
  const router = useRouter()
  const [userId, setUserId]           = useState<string | null>(null)
  const [courses, setCourses]         = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [banks, setBanks]             = useState<Bank[]>([])
  const [loadingBanks, setLoadingBanks] = useState(false)

  // Open bank view
  const [openBank, setOpenBank]       = useState<Bank | null>(null)
  const [topics, setTopics]           = useState<Record<string, Question[]>>({})
  const [activeTopic, setActiveTopic] = useState<string>('')
  const [loadingBank, setLoadingBank] = useState(false)

  // Create modals
  const [showExtract, setShowExtract] = useState(false)
  const [showGenerate, setShowGenerate] = useState(false)

  // Extract form
  const [extractFile, setExtractFile]     = useState<File | null>(null)
  const [extractTitle, setExtractTitle]   = useState('')
  const [extractYear, setExtractYear]     = useState('')
  const [extracting, setExtracting]       = useState(false)
  const [extractError, setExtractError]   = useState('')

  // Generate form
  const [genWhiteboards, setGenWhiteboards] = useState<any[]>([])
  const [genPdf, setGenPdf]               = useState('')
  const [genPdfName, setGenPdfName]       = useState('')
  const [genTitle, setGenTitle]           = useState('')
  const [generating, setGenerating]       = useState(false)
  const [genError, setGenError]           = useState('')

  const extractAbort = useRef<AbortController | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }: any) => {
      if (!session) { router.push('/auth/signin'); return }
      const uid = session.user.id
      setUserId(uid)
      const c = await api.getCourses(uid).catch(() => [])
      setCourses(c)
    })
  }, [router])

  useEffect(() => {
    if (!selectedCourse || !userId) { setBanks([]); return }
    setLoadingBanks(true)
    api.getQuestionBanks(userId, selectedCourse)
      .then(setBanks).catch(() => setBanks([]))
      .finally(() => setLoadingBanks(false))
  }, [selectedCourse, userId])

  useEffect(() => {
    if (!selectedCourse || !userId || !showGenerate) return
    api.getWhiteboard(selectedCourse, userId).then(wb => {
      const pages = wb.pages || (wb.pdf_url ? [{ id: 'default', name: wb.pdf_name || 'PDF', pdf_url: wb.pdf_url, pdf_name: wb.pdf_name }] : [])
      setGenWhiteboards(pages.filter((p: any) => p.pdf_url))
    }).catch(() => setGenWhiteboards([]))
  }, [selectedCourse, userId, showGenerate])

  const openBankView = async (bank: Bank) => {
    setOpenBank(bank)
    setLoadingBank(true)
    try {
      const { topics: t } = await api.getQuestionBank(bank.id)
      setTopics(t)
      const first = Object.keys(t)[0] || ''
      setActiveTopic(first)
    } catch (e: any) {
      alert(e.message || 'Failed to load bank')
    } finally {
      setLoadingBank(false)
    }
  }

  const handleExtract = async () => {
    if (!extractFile || !extractTitle.trim() || !userId || !selectedCourse) return
    setExtracting(true)
    setExtractError('')
    const form = new FormData()
    form.append('file', extractFile)
    form.append('user_id', userId)
    form.append('course_id', selectedCourse)
    form.append('title', extractTitle.trim())
    form.append('source_label', extractYear.trim())
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/questions/extract`, { method: 'POST', body: form })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }))
        throw new Error(err.detail || 'Extraction failed')
      }
      const data = await res.json()
      setBanks(prev => [{ ...data.bank, question_count: data.count }, ...prev])
      setShowExtract(false)
      setExtractFile(null); setExtractTitle(''); setExtractYear('')
    } catch (e: any) {
      setExtractError(e.message)
    } finally {
      setExtracting(false)
    }
  }

  const handleGenerate = async () => {
    if (!genPdf || !genTitle.trim() || !userId || !selectedCourse) return
    setGenerating(true)
    setGenError('')
    try {
      const data = await api.generateQuestionBank({ user_id: userId, course_id: selectedCourse, pdf_url: genPdf, pdf_name: genPdfName, title: genTitle.trim() })
      setBanks(prev => [{ ...data.bank, question_count: data.count }, ...prev])
      setShowGenerate(false)
      setGenPdf(''); setGenTitle(''); setGenPdfName('')
    } catch (e: any) {
      setGenError(e.message)
    } finally {
      setGenerating(false)
    }
  }

  const handleDeleteBank = async (bankId: string) => {
    if (!confirm('Delete this question bank?')) return
    await api.deleteQuestionBank(bankId).catch(() => {})
    setBanks(prev => prev.filter(b => b.id !== bankId))
    if (openBank?.id === bankId) setOpenBank(null)
  }

  // ── Bank detail view ────────────────────────────────────────
  if (openBank) {
    const topicList = Object.keys(topics)
    const activeQs = topics[activeTopic] || []
    return (
      <div className="flex h-screen flex-col" style={{ fontFamily: 'Inter, sans-serif', backgroundColor: N.sidebar, color: N.text }}>
        {/* Top bar */}
        <div className="shrink-0 flex items-center gap-3 px-6 py-3" style={{ borderBottom: `1px solid ${N.border}`, backgroundColor: N.bg }}>
          <button onClick={() => setOpenBank(null)} className="text-sm" style={{ color: N.muted }}>← Back</button>
          <div className="flex-1">
            <div className="text-sm font-semibold">{openBank.title}</div>
            <div className="text-xs" style={{ color: N.muted }}>
              {openBank.source_type === 'past_paper' ? '📄 Past paper' : '✨ Generated'}
              {openBank.source_label && ` · ${openBank.source_label}`}
              {' · '}{openBank.question_count} questions
            </div>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Topic sidebar */}
          <div className="w-52 shrink-0 overflow-y-auto border-r p-3 space-y-1" style={{ borderColor: N.border, backgroundColor: N.bg }}>
            {loadingBank ? (
              <p className="text-xs p-2" style={{ color: N.muted }}>Loading…</p>
            ) : topicList.map(t => (
              <button key={t} onClick={() => setActiveTopic(t)}
                className="w-full rounded-lg px-3 py-2 text-left text-xs font-medium transition"
                style={{
                  backgroundColor: activeTopic === t ? N.indigoBg : 'transparent',
                  color: activeTopic === t ? N.indigo : N.text,
                }}>
                <div className="truncate">{t}</div>
                <div className="text-xs mt-0.5" style={{ color: N.muted }}>{topics[t].length} q{topics[t].length !== 1 ? 's' : ''}</div>
              </button>
            ))}
          </div>

          {/* Questions */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            {activeQs.length === 0 ? (
              <p className="text-sm" style={{ color: N.muted }}>No questions in this topic.</p>
            ) : activeQs.map(q => (
              <QuestionCard key={q.id} q={q} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Main list view ──────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ fontFamily: 'Inter, sans-serif', backgroundColor: N.sidebar, color: N.text }}>
      <div className="sticky top-0 z-10 flex items-center gap-4 px-6 py-3" style={{ borderBottom: `1px solid ${N.border}`, backgroundColor: N.sidebar }}>
        <Link href="/dashboard" className="text-sm" style={{ color: N.muted }}>← Dashboard</Link>
        <span className="text-sm font-semibold">📝 Question Bank</span>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-8">
        {/* Course selector */}
        <div className="mb-6">
          <select value={selectedCourse} onChange={e => { setSelectedCourse(e.target.value); setOpenBank(null) }}
            className="rounded-lg border px-3 py-2 text-sm focus:outline-none"
            style={{ borderColor: N.border, backgroundColor: N.bg, color: N.text, minWidth: 220 }}>
            <option value="">Select a module…</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {selectedCourse && (
          <>
            {/* Actions */}
            <div className="flex gap-2 mb-6">
              <button onClick={() => { setShowExtract(true); setShowGenerate(false) }}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                style={{ backgroundColor: N.indigo }}>
                + Upload past paper
              </button>
              <button onClick={() => { setShowGenerate(true); setShowExtract(false) }}
                className="rounded-lg px-4 py-2 text-sm font-medium transition hover:bg-[#EFEFED]"
                style={{ border: `1px solid ${N.border}`, color: N.text, backgroundColor: N.bg }}>
                ✨ Generate from notes
              </button>
            </div>

            {/* Extract form */}
            {showExtract && (
              <div className="mb-6 rounded-xl border p-5 space-y-3" style={{ borderColor: N.border, backgroundColor: N.bg }}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Upload past paper</span>
                  <button onClick={() => setShowExtract(false)} style={{ color: N.muted }}>✕</button>
                </div>
                <input value={extractTitle} onChange={e => setExtractTitle(e.target.value)}
                  placeholder="Bank title (e.g. 2025 Exam Paper)"
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
                  style={{ borderColor: N.border }} />
                <input value={extractYear} onChange={e => setExtractYear(e.target.value)}
                  placeholder="Year / source label (e.g. 2025) — optional"
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
                  style={{ borderColor: N.border }} />
                <input type="file" accept=".pdf" onChange={e => setExtractFile(e.target.files?.[0] || null)}
                  className="text-sm" />
                {extractError && <p className="text-xs" style={{ color: N.red }}>{extractError}</p>}
                <button onClick={handleExtract} disabled={extracting || !extractFile || !extractTitle.trim()}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
                  style={{ backgroundColor: N.indigo }}>
                  {extracting ? 'Extracting questions…' : 'Extract questions'}
                </button>
              </div>
            )}

            {/* Generate form */}
            {showGenerate && (
              <div className="mb-6 rounded-xl border p-5 space-y-3" style={{ borderColor: N.border, backgroundColor: N.bg }}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Generate from notes</span>
                  <button onClick={() => setShowGenerate(false)} style={{ color: N.muted }}>✕</button>
                </div>
                <input value={genTitle} onChange={e => setGenTitle(e.target.value)}
                  placeholder="Bank title (e.g. Week 6 Notes — Practice)"
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
                  style={{ borderColor: N.border }} />
                {genWhiteboards.length === 0 ? (
                  <p className="text-sm" style={{ color: N.muted }}>No PDFs uploaded for this module. Add one from <Link href="/whiteboard" className="underline">Whiteboard</Link>.</p>
                ) : (
                  <select value={genPdf} onChange={e => {
                    const wb = genWhiteboards.find((p: any) => p.pdf_url === e.target.value)
                    setGenPdf(e.target.value)
                    setGenPdfName(wb?.pdf_name || wb?.name || '')
                  }}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
                    style={{ borderColor: N.border }}>
                    <option value="">Select a PDF…</option>
                    {genWhiteboards.map((p: any) => <option key={p.id} value={p.pdf_url}>{p.pdf_name || p.name}</option>)}
                  </select>
                )}
                {genError && <p className="text-xs" style={{ color: N.red }}>{genError}</p>}
                <button onClick={handleGenerate} disabled={generating || !genPdf || !genTitle.trim()}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
                  style={{ backgroundColor: N.indigo }}>
                  {generating ? 'Generating…' : 'Generate questions'}
                </button>
              </div>
            )}

            {/* Banks list */}
            {loadingBanks ? (
              <p className="text-sm" style={{ color: N.muted }}>Loading…</p>
            ) : banks.length === 0 ? (
              <p className="text-sm" style={{ color: N.muted }}>No question banks yet. Upload a past paper or generate from your notes.</p>
            ) : (
              <div className="space-y-3">
                {banks.map(bank => (
                  <div key={bank.id} className="flex items-center gap-4 rounded-xl border px-5 py-4 cursor-pointer transition hover:bg-[#F7F7F5]"
                    style={{ borderColor: N.border, backgroundColor: N.bg }}
                    onClick={() => openBankView(bank)}>
                    <span className="text-2xl">{bank.source_type === 'past_paper' ? '📄' : '✨'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate" style={{ color: N.text }}>{bank.title}</div>
                      <div className="text-xs mt-0.5" style={{ color: N.muted }}>
                        {bank.source_type === 'past_paper' ? 'Past paper' : 'Generated'}
                        {bank.source_label && ` · ${bank.source_label}`}
                        {' · '}{bank.question_count} questions
                      </div>
                    </div>
                    <button onClick={e => { e.stopPropagation(); handleDeleteBank(bank.id) }}
                      className="text-xs transition hover:opacity-70" style={{ color: N.muted }}>
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
