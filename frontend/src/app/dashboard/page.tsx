'use client';

import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [modules] = useState([
    { id: 1, name: 'Data Structures', date: '2 days ago' },
    { id: 2, name: 'Algorithms', date: '5 days ago' },
    { id: 3, name: 'Database Systems', date: '1 week ago' },
    { id: 4, name: 'Operating Systems', date: '2 weeks ago' },
  ]);

  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isRunning]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="flex h-screen bg-gradient-to-br from-[#0A0E27] via-[#0F1629] to-[#0A0E27]">
      {/* Sidebar */}
      <div className="flex w-64 flex-col border-r border-blue-900/30 bg-gradient-to-b from-[#0F1629] to-[#0A0E27] p-4 shadow-2xl backdrop-blur-xl">
        <div className="mb-6 flex-1">
          <h2 className="mb-4 text-sm font-semibold text-blue-400/70">STUDY HISTORY</h2>
          <div className="space-y-1">
            {modules.map((module) => (
              <div
                key={module.id}
                className="cursor-pointer rounded-lg bg-gradient-to-r from-blue-950/40 to-indigo-950/30 px-3 py-2 text-sm text-blue-100 shadow-lg backdrop-blur-sm transition hover:from-blue-900/50 hover:to-indigo-900/40 hover:shadow-xl hover:shadow-blue-500/10"
              >
                <div className="font-medium">📚 {module.name}</div>
                <div className="text-xs text-blue-400/60">{module.date}</div>
              </div>
            ))}
          </div>
        </div>
        
        <button className="mb-4 w-full rounded-lg border border-blue-800/50 bg-gradient-to-r from-blue-950/40 to-indigo-950/30 px-3 py-2 text-sm text-blue-300 shadow-lg backdrop-blur-sm transition hover:border-blue-700 hover:from-blue-900/50 hover:to-indigo-900/40 hover:shadow-blue-500/20">
          + New Module
        </button>

        {/* Pomodoro Timer */}
        <div className="rounded-xl border border-orange-800/50 bg-gradient-to-br from-red-950/40 via-orange-950/30 to-amber-950/30 p-4 shadow-2xl shadow-orange-500/10 backdrop-blur-xl">
          <div className="mb-3 text-center text-xs font-semibold text-orange-400/70">FOCUS SESSION</div>
          
          <div className="mb-3 flex justify-center">
            <div className="text-5xl drop-shadow-lg">⏳</div>
          </div>
          
          <div className="mb-4 text-center">
            <div className="text-3xl font-bold text-white drop-shadow-lg">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
            <div className="mt-1 text-xs text-orange-400/60">25 min session</div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className="flex-1 rounded-lg bg-gradient-to-r from-red-600 to-orange-600 py-2 text-sm font-semibold text-white shadow-lg shadow-orange-500/30 transition hover:from-red-500 hover:to-orange-500 hover:shadow-xl hover:shadow-orange-500/40"
            >
              {isRunning ? 'Pause' : 'Start'}
            </button>
            <button
              onClick={() => { setTimeLeft(25 * 60); setIsRunning(false); }}
              className="rounded-lg border border-orange-700/50 bg-orange-950/30 px-3 py-2 text-sm text-orange-300 backdrop-blur-sm transition hover:bg-orange-900/40"
            >
              Reset
            </button>
          </div>
          
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-orange-950/50">
            <div
              className="h-full bg-gradient-to-r from-red-500 to-orange-500 shadow-lg shadow-orange-500/50 transition-all duration-1000"
              style={{ width: `${((25 * 60 - timeLeft) / (25 * 60)) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-4xl p-12">
          <div className="mb-8">
            <h1 className="mb-2 bg-gradient-to-r from-blue-200 via-cyan-200 to-blue-300 bg-clip-text text-4xl font-bold text-transparent drop-shadow-lg">Welcome back</h1>
            <p className="text-blue-300/70">🔥 Keep your streak going! 5 days strong</p>
          </div>

          {/* Productivity & Progress Stats */}
          <div className="mb-8 grid grid-cols-4 gap-4">
            <div className="rounded-xl border border-blue-800/50 bg-gradient-to-br from-blue-950/50 to-indigo-950/40 p-6 shadow-xl shadow-blue-500/10 backdrop-blur-sm">
              <div className="mb-2 text-3xl">🎯</div>
              <div className="text-2xl font-bold text-blue-100">12</div>
              <div className="text-xs text-blue-400/70">Tasks Completed</div>
            </div>
            <div className="rounded-xl border border-cyan-800/50 bg-gradient-to-br from-cyan-950/50 to-blue-950/40 p-6 shadow-xl shadow-cyan-500/10 backdrop-blur-sm">
              <div className="mb-2 text-3xl">⏱️</div>
              <div className="text-2xl font-bold text-cyan-100">48h</div>
              <div className="text-xs text-cyan-400/70">Focus Time</div>
            </div>
            <div className="rounded-xl border border-purple-800/50 bg-gradient-to-br from-purple-950/50 to-indigo-950/40 p-6 shadow-xl shadow-purple-500/10 backdrop-blur-sm">
              <div className="mb-2 text-3xl">🔥</div>
              <div className="text-2xl font-bold text-purple-100">5</div>
              <div className="text-xs text-purple-400/70">Day Streak</div>
            </div>
            <div className="rounded-xl border border-green-800/50 bg-gradient-to-br from-green-950/50 to-emerald-950/40 p-6 shadow-xl shadow-green-500/10 backdrop-blur-sm">
              <div className="mb-2 text-3xl">🏆</div>
              <div className="text-2xl font-bold text-green-100">8</div>
              <div className="text-xs text-green-400/70">Badges Earned</div>
            </div>
          </div>

          {/* Weekly Progress Overview */}
          <div className="mb-8 rounded-xl border border-blue-800/50 bg-gradient-to-br from-blue-950/50 to-indigo-950/40 p-6 shadow-xl shadow-blue-500/10 backdrop-blur-sm">
            <h2 className="mb-4 text-lg font-semibold text-blue-100">📈 Weekly Progress Overview</h2>
            <div className="mb-4 flex items-end justify-between gap-2">
              {[40, 65, 55, 80, 70, 45, 60].map((height, idx) => (
                <div key={idx} className="flex flex-1 flex-col items-center gap-2">
                  <div className="w-full rounded-t-lg bg-gradient-to-t from-blue-600 to-cyan-500 shadow-lg shadow-blue-500/30" style={{ height: `${height}px` }}></div>
                  <div className="text-xs text-blue-400/60">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][idx]}</div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="text-blue-300/70">This week: <span className="font-semibold text-blue-100">18 Pomodoros</span></div>
              <div className="text-green-400">↑ 12% from last week</div>
            </div>
          </div>

          {/* Smart Study Calendar */}
          <div className="mb-8 rounded-xl border border-blue-800/50 bg-gradient-to-br from-blue-950/50 to-indigo-950/40 p-6 shadow-xl shadow-blue-500/10 backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-blue-100">📅 Smart Study Plan & Calendar</h2>
              <button className="text-sm text-blue-400 transition hover:text-blue-300">View All →</button>
            </div>
            
            <div className="overflow-x-auto">
              <div className="flex gap-3 pb-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
                  <div
                    key={day}
                    className="min-w-[140px] cursor-pointer rounded-lg border border-blue-700/50 bg-gradient-to-br from-blue-900/40 to-indigo-900/30 p-4 shadow-lg shadow-blue-500/10 backdrop-blur-sm transition hover:border-blue-600 hover:shadow-xl hover:shadow-blue-500/20"
                  >
                    <div className="mb-2 text-xs font-semibold text-blue-400/70">{day}</div>
                    <div className="mb-3 text-sm font-bold text-blue-100">Feb {10 + idx}</div>
                    <div className="space-y-2">
                      <div className="rounded bg-gradient-to-r from-cyan-900/50 to-blue-800/40 px-2 py-1 text-xs text-cyan-300 shadow-md shadow-cyan-500/20">
                        9:00 AM - Study
                      </div>
                      <div className="rounded bg-gradient-to-r from-green-900/50 to-emerald-800/40 px-2 py-1 text-xs text-green-300 shadow-md shadow-green-500/20">
                        2:00 PM - Review
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-4 flex items-center gap-4 text-xs text-blue-400/60">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-cyan-500 shadow-lg shadow-cyan-500/50"></div>
                <span>Study Session</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 shadow-lg shadow-green-500/50"></div>
                <span>Review</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-yellow-500 shadow-lg shadow-yellow-500/50"></div>
                <span>Buffer Time</span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mb-8 rounded-xl border border-blue-800/50 bg-gradient-to-br from-blue-950/50 to-indigo-950/40 p-6 shadow-xl shadow-blue-500/10 backdrop-blur-sm">
            <h2 className="mb-4 text-lg font-semibold text-blue-100">Recent Activity</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="text-2xl">✅</div>
                <div>
                  <div className="font-medium text-blue-100">Completed Data Structures</div>
                  <div className="text-sm text-blue-400/60">2 days ago</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-2xl">📝</div>
                <div>
                  <div className="font-medium text-blue-100">Started Algorithms module</div>
                  <div className="text-sm text-blue-400/60">5 days ago</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-2xl">🎯</div>
                <div>
                  <div className="font-medium text-blue-100">Set new study goal</div>
                  <div className="text-sm text-blue-400/60">1 week ago</div>
                </div>
              </div>
            </div>
          </div>

          {/* Flashcards & Learning Reinforcement */}
          <div className="rounded-xl border border-purple-800/50 bg-gradient-to-br from-purple-950/40 via-indigo-950/40 to-blue-950/30 p-6 shadow-xl shadow-purple-500/10 backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-purple-100">🎴 Flashcards & Learning Reinforcement</h2>
              <button className="text-sm text-purple-400 transition hover:text-purple-300">Review Now →</button>
            </div>
            
            <div className="mb-4 grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-purple-800/40 bg-purple-900/30 p-3 text-center shadow-lg shadow-purple-500/10">
                <div className="text-xl font-bold text-purple-300">24</div>
                <div className="text-xs text-purple-400/60">Due Today</div>
              </div>
              <div className="rounded-lg border border-blue-800/40 bg-blue-900/30 p-3 text-center shadow-lg shadow-blue-500/10">
                <div className="text-xl font-bold text-blue-300">156</div>
                <div className="text-xs text-blue-400/60">Total Cards</div>
              </div>
              <div className="rounded-lg border border-green-800/40 bg-green-900/30 p-3 text-center shadow-lg shadow-green-500/10">
                <div className="text-xl font-bold text-green-300">87%</div>
                <div className="text-xs text-green-400/60">Retention</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg border border-blue-700/50 bg-blue-900/20 p-3 backdrop-blur-sm">
                <div>
                  <div className="text-sm font-medium text-blue-100">Data Structures</div>
                  <div className="text-xs text-blue-400/60">8 cards due • SM-2 Algorithm</div>
                </div>
                <button className="rounded-md bg-gradient-to-r from-purple-600 to-purple-500 px-3 py-1 text-xs font-semibold text-white shadow-lg shadow-purple-500/30 transition hover:from-purple-500 hover:to-purple-400">
                  Review
                </button>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-blue-700/50 bg-blue-900/20 p-3 backdrop-blur-sm">
                <div>
                  <div className="text-sm font-medium text-blue-100">Algorithms</div>
                  <div className="text-xs text-blue-400/60">12 cards due • Spaced Repetition</div>
                </div>
                <button className="rounded-md bg-gradient-to-r from-purple-600 to-purple-500 px-3 py-1 text-xs font-semibold text-white shadow-lg shadow-purple-500/30 transition hover:from-purple-500 hover:to-purple-400">
                  Review
                </button>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-blue-700/50 bg-blue-900/20 p-3 backdrop-blur-sm">
                <div>
                  <div className="text-sm font-medium text-blue-100">Database Systems</div>
                  <div className="text-xs text-blue-400/60">4 cards due • Weak areas</div>
                </div>
                <button className="rounded-md bg-gradient-to-r from-purple-600 to-purple-500 px-3 py-1 text-xs font-semibold text-white shadow-lg shadow-purple-500/30 transition hover:from-purple-500 hover:to-purple-400">
                  Review
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
