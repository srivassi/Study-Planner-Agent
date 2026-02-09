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
    <div className="flex h-screen bg-gradient-to-br from-[#0F0F0F] via-[#1A1A1A] to-[#0F0F0F]">
      {/* Sidebar */}
      <div className="flex w-64 flex-col border-r border-zinc-800/50 bg-gradient-to-b from-[#1F1F1F] to-[#171717] p-4 shadow-2xl backdrop-blur-xl">
        <div className="mb-6 flex-1">
          <h2 className="mb-4 text-sm font-semibold text-zinc-400">STUDY HISTORY</h2>
          <div className="space-y-1">
            {modules.map((module) => (
              <div
                key={module.id}
                className="cursor-pointer rounded-lg bg-gradient-to-r from-zinc-800/40 to-zinc-800/20 px-3 py-2 text-sm text-zinc-300 shadow-lg backdrop-blur-sm transition hover:from-zinc-700/50 hover:to-zinc-700/30 hover:shadow-xl"
              >
                <div className="font-medium">📚 {module.name}</div>
                <div className="text-xs text-zinc-500">{module.date}</div>
              </div>
            ))}
          </div>
        </div>
        
        <button className="mb-4 w-full rounded-lg border border-zinc-700/50 bg-gradient-to-r from-zinc-800/40 to-zinc-800/20 px-3 py-2 text-sm text-zinc-400 shadow-lg backdrop-blur-sm transition hover:border-zinc-600 hover:from-zinc-700/50 hover:to-zinc-700/30">
          + New Module
        </button>

        {/* Pomodoro Timer */}
        <div className="rounded-xl border border-zinc-700/50 bg-gradient-to-br from-red-950/30 via-zinc-900/50 to-orange-950/30 p-4 shadow-2xl backdrop-blur-xl">
          <div className="mb-3 text-center text-xs font-semibold text-zinc-400">FOCUS SESSION</div>
          
          {/* Hourglass Icon */}
          <div className="mb-3 flex justify-center">
            <div className="text-5xl">⏳</div>
          </div>
          
          {/* Timer Display */}
          <div className="mb-4 text-center">
            <div className="text-3xl font-bold text-white">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
            <div className="mt-1 text-xs text-zinc-500">25 min session</div>
          </div>
          
          {/* Controls */}
          <div className="flex gap-2">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className="flex-1 rounded-lg bg-gradient-to-r from-red-600 to-orange-600 py-2 text-sm font-semibold text-white shadow-lg transition hover:from-red-500 hover:to-orange-500 hover:shadow-xl"
            >
              {isRunning ? 'Pause' : 'Start'}
            </button>
            <button
              onClick={() => { setTimeLeft(25 * 60); setIsRunning(false); }}
              className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-400 backdrop-blur-sm transition hover:bg-zinc-700/50"
            >
              Reset
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full bg-gradient-to-r from-red-500 to-orange-500 shadow-lg transition-all duration-1000"
              style={{ width: `${((25 * 60 - timeLeft) / (25 * 60)) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-4xl p-12">
          <div className="mb-8">
            <h1 className="mb-2 bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-4xl font-bold text-transparent">Welcome back</h1>
            <p className="text-zinc-400">Continue your learning journey</p>
          </div>

          {/* Stats Cards */}
          <div className="mb-8 grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-zinc-800/50 bg-gradient-to-br from-zinc-900/50 to-zinc-800/30 p-6 shadow-xl backdrop-blur-sm">
              <div className="text-2xl font-bold text-white">12</div>
              <div className="text-sm text-zinc-400">Modules Completed</div>
            </div>
            <div className="rounded-xl border border-zinc-800/50 bg-gradient-to-br from-zinc-900/50 to-zinc-800/30 p-6 shadow-xl backdrop-blur-sm">
              <div className="text-2xl font-bold text-white">48h</div>
              <div className="text-sm text-zinc-400">Study Time</div>
            </div>
          </div>

          {/* Smart Study Calendar */}
          <div className="mb-8 rounded-xl border border-zinc-800/50 bg-gradient-to-br from-zinc-900/50 to-zinc-800/30 p-6 shadow-xl backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">📅 Smart Study Plan & Calendar</h2>
              <button className="text-sm text-zinc-400 transition hover:text-white">View All →</button>
            </div>
            
            {/* Horizontal Scrollable Calendar */}
            <div className="overflow-x-auto">
              <div className="flex gap-3 pb-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
                  <div
                    key={day}
                    className="min-w-[140px] cursor-pointer rounded-lg border border-zinc-700/50 bg-gradient-to-br from-zinc-800/40 to-zinc-900/40 p-4 shadow-lg backdrop-blur-sm transition hover:border-zinc-600 hover:shadow-xl"
                  >
                    <div className="mb-2 text-xs font-semibold text-zinc-400">{day}</div>
                    <div className="mb-3 text-sm font-bold text-white">Feb {10 + idx}</div>
                    <div className="space-y-2">
                      <div className="rounded bg-gradient-to-r from-blue-900/40 to-blue-800/30 px-2 py-1 text-xs text-blue-300 shadow-md">
                        9:00 AM - Study
                      </div>
                      <div className="rounded bg-gradient-to-r from-green-900/40 to-green-800/30 px-2 py-1 text-xs text-green-300 shadow-md">
                        2:00 PM - Review
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-4 flex items-center gap-4 text-xs text-zinc-500">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50"></div>
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
          <div className="rounded-xl border border-zinc-800/50 bg-gradient-to-br from-zinc-900/50 to-zinc-800/30 p-6 shadow-xl backdrop-blur-sm">
            <h2 className="mb-4 text-lg font-semibold text-white">Recent Activity</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="text-2xl">✅</div>
                <div>
                  <div className="font-medium text-white">Completed Data Structures</div>
                  <div className="text-sm text-zinc-400">2 days ago</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-2xl">📝</div>
                <div>
                  <div className="font-medium text-white">Started Algorithms module</div>
                  <div className="text-sm text-zinc-400">5 days ago</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-2xl">🎯</div>
                <div>
                  <div className="font-medium text-white">Set new study goal</div>
                  <div className="text-sm text-zinc-400">1 week ago</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
