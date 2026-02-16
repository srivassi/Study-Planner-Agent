'use client';

import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [modules] = useState([
    { id: 1, name: 'Data Structures', icon: '📚', cover: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=1200&h=280&fit=crop' },
    { id: 2, name: 'Algorithms', icon: '🧮', cover: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=280&fit=crop' },
    { id: 3, name: 'Database Systems', icon: '💾', cover: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&h=280&fit=crop' },
    { id: 4, name: 'Operating Systems', icon: '⚙️', cover: 'https://images.unsplash.com/photo-1511884642898-4c92249e20b6?w=1200&h=280&fit=crop' },
  ]);

  const [selectedModule, setSelectedModule] = useState(null);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [favorites, setFavorites] = useState([]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  useEffect(() => {
    if (!isRunning) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isRunning]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const handleAuth = (name) => {
    setUser({ name });
    setShowAuthModal(false);
  };

  const toggleFavorite = (id) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex h-screen" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, 'Apple Color Emoji', Arial, sans-serif" }}>
      {/* Fixed Left Sidebar */}
      <div className="w-60 flex-shrink-0 overflow-y-auto" style={{ backgroundColor: '#FBFBFA', borderRight: '1px solid #EDEDED' }}>
        <div className="p-3">
          <div className="mb-6 px-2 py-3 flex items-center gap-2 cursor-pointer" onClick={() => setSelectedModule(null)}>
            <div className="text-xl">🎓</div>
            <div className="text-sm font-semibold" style={{ color: '#37352F' }}>Study Planner</div>
          </div>

          <div className="space-y-1">
            {modules.map((module) => (
              <div
                key={module.id}
                className="flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer transition-colors group"
                style={{
                  backgroundColor: selectedModule?.id === module.id ? '#EFEFED' : 'transparent',
                  color: '#37352F',
                  borderRadius: '4px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#EFEFED'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedModule?.id === module.id ? '#EFEFED' : 'transparent'}
              >
                <span onClick={() => setSelectedModule(module)}>{module.icon}</span>
                <span onClick={() => setSelectedModule(module)} className="flex-1">{module.name}</span>
                <span 
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(module.id); }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ cursor: 'pointer' }}
                >
                  {favorites.includes(module.id) ? '⭐' : '☆'}
                </span>
              </div>
            ))}
          </div>

          {/* Pomodoro Timer */}
          <div className="mt-6 p-3" style={{ border: '1px solid #EDEDED', borderRadius: '4px', backgroundColor: '#FFFFFF' }}>
            <div className="text-xs font-semibold mb-3" style={{ color: 'rgba(55, 53, 47, 0.65)' }}>FOCUS SESSION</div>
            <div className="text-center mb-3">
              <div className="text-2xl mb-2">⏳</div>
              <div className="text-xl font-semibold" style={{ color: '#37352F' }}>
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className="flex-1 px-3 py-1.5 text-sm font-medium transition-colors"
                style={{ border: '1px solid #D3D1CB', borderRadius: '4px', backgroundColor: '#FFFFFF', color: '#37352F' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#EFEFED'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
              >
                {isRunning ? 'Pause' : 'Start'}
              </button>
              <button
                onClick={() => { setTimeLeft(25 * 60); setIsRunning(false); }}
                className="px-3 py-1.5 text-sm transition-colors"
                style={{ border: '1px solid #D3D1CB', borderRadius: '4px', backgroundColor: '#FFFFFF', color: 'rgba(55, 53, 47, 0.65)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#EFEFED'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto" style={{ backgroundColor: '#FFFFFF' }}>
        {/* Top Right Auth Button */}
        <div className="absolute top-4 right-6">
          {user ? (
            <div className="px-3 py-1.5 text-sm" style={{ color: '#37352F' }}>
              {user.name}'s Planner
            </div>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-3 py-1.5 text-sm font-medium transition-colors"
              style={{ border: '1px solid #D3D1CB', borderRadius: '4px', backgroundColor: '#FFFFFF', color: '#37352F' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#EFEFED'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
            >
              Sign In / Sign Up
            </button>
          )}
        </div>

        <div className="py-12" style={{ maxWidth: '100%' }}>
          {/* Breadcrumb */}
          <div className="mb-4 text-sm" style={{ color: 'rgba(55, 53, 47, 0.65)', paddingLeft: '12px' }}>
            Dashboard {selectedModule && ` / ${selectedModule.name}`}
          </div>

          {/* Page Header with Cover */}
          <div className="mb-8 relative" style={{ height: '280px' }}>
            <img 
              src={selectedModule?.cover || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=280&fit=crop'} 
              alt="Cover" 
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 px-24 py-6" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.7))' }}>
              <div className="flex items-center gap-3">
                <div className="text-5xl">{selectedModule?.icon || '✨'}</div>
                <h1 style={{ fontSize: '40px', fontWeight: 700, lineHeight: 1.2, color: '#FFFFFF' }}>
                  {selectedModule?.name || `${getGreeting()}${user ? ', ' + user.name : ''}`}
                </h1>
              </div>
              {!selectedModule && (
                <div className="flex items-center gap-3 text-sm mt-2" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  <span>🔥 5 day streak</span>
                </div>
              )}
            </div>
          </div>

          {!selectedModule ? (
            <div className="px-24">
              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-4 mb-8">
                {[
                  { icon: '🎯', value: '12', label: 'Tasks Completed', sublabel: 'This week' },
                  { icon: '⏱️', value: '48h', label: 'Focus Time', sublabel: 'Last 30 days' },
                  { icon: '🔥', value: '5', label: 'Day Streak', sublabel: 'Current' },
                  { icon: '🏆', value: '8', label: 'Badges Earned', sublabel: 'All time' }
                ].map((stat, i) => (
                  <div key={i} className="p-4" style={{ border: '1px solid #EDEDED', borderRadius: '4px' }}>
                    <div className="text-2xl mb-2">{stat.icon}</div>
                    <div className="text-xl font-semibold" style={{ color: '#37352F' }}>{stat.value}</div>
                    <div className="text-xs" style={{ color: '#37352F' }}>{stat.label}</div>
                    <div className="text-xs" style={{ color: 'rgba(55, 53, 47, 0.65)' }}>{stat.sublabel}</div>
                  </div>
                ))}
              </div>

              {/* Weekly Progress */}
              <div className="mb-8 p-6" style={{ border: '1px solid #EDEDED', borderRadius: '4px' }}>
                <h2 className="mb-4" style={{ fontSize: '30px', fontWeight: 600, color: '#37352F' }}>Weekly Progress</h2>
                <div className="flex items-end justify-between gap-2 mb-4" style={{ height: '120px' }}>
                  {[40, 65, 55, 80, 70, 45, 60].map((height, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full" style={{ height: `${height}px`, backgroundColor: '#37352F', borderRadius: '2px' }}></div>
                      <div className="text-xs" style={{ color: 'rgba(55, 53, 47, 0.65)' }}>
                        {['M', 'T', 'W', 'T', 'F', 'S', 'S'][idx]}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-sm" style={{ color: 'rgba(55, 53, 47, 0.65)' }}>
                  18 Pomodoros this week
                </div>
              </div>

              {/* Calendar */}
              <div className="mb-8 p-6" style={{ border: '1px solid #EDEDED', borderRadius: '4px' }}>
                <h2 className="mb-4" style={{ fontSize: '30px', fontWeight: 600, color: '#37352F' }}>Study Calendar</h2>
                <div className="flex gap-3 overflow-x-auto">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
                    <div key={day} className="min-w-[120px] p-3" style={{ border: '1px solid #EDEDED', borderRadius: '4px' }}>
                      <div className="text-xs mb-1" style={{ color: 'rgba(55, 53, 47, 0.65)' }}>{day}</div>
                      <div className="text-sm font-semibold mb-2" style={{ color: '#37352F' }}>Feb {10 + idx}</div>
                      <div className="space-y-1">
                        <div className="text-xs px-2 py-1" style={{ backgroundColor: '#EFEFED', borderRadius: '2px', color: '#37352F' }}>
                          9:00 Study
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="p-6" style={{ border: '1px solid #EDEDED', borderRadius: '4px' }}>
                <h2 className="mb-4" style={{ fontSize: '30px', fontWeight: 600, color: '#37352F' }}>Recent Activity</h2>
                <div className="space-y-3">
                  {[
                    { icon: '✅', text: 'Completed Data Structures', time: '2 days ago' },
                    { icon: '📝', text: 'Started Algorithms module', time: '5 days ago' },
                    { icon: '🎯', text: 'Set new study goal', time: '1 week ago' }
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="text-xl">{item.icon}</div>
                      <div>
                        <div className="text-sm" style={{ color: '#37352F' }}>{item.text}</div>
                        <div className="text-xs" style={{ color: 'rgba(55, 53, 47, 0.65)' }}>{item.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Module Stats */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                  { icon: '📖', value: '8/12', label: 'Topics' },
                  { icon: '⏱️', value: '12h', label: 'Time Spent' },
                  { icon: '✅', value: '85%', label: 'Completion' }
                ].map((stat, i) => (
                  <div key={i} className="p-4" style={{ border: '1px solid #EDEDED', borderRadius: '4px' }}>
                    <div className="text-2xl mb-2">{stat.icon}</div>
                    <div className="text-xl font-semibold" style={{ color: '#37352F' }}>{stat.value}</div>
                    <div className="text-xs" style={{ color: 'rgba(55, 53, 47, 0.65)' }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Flashcards */}
              <div className="mb-8 p-6 flex items-center justify-between" style={{ border: '1px solid #EDEDED', borderRadius: '4px' }}>
                <div>
                  <h2 className="mb-1" style={{ fontSize: '30px', fontWeight: 600, color: '#37352F' }}>Flashcards</h2>
                  <div className="text-sm" style={{ color: 'rgba(55, 53, 47, 0.65)' }}>24 cards due for review</div>
                </div>
                <button
                  className="px-4 py-2 text-sm font-medium transition-colors"
                  style={{ border: '1px solid #D3D1CB', borderRadius: '4px', backgroundColor: '#FFFFFF', color: '#37352F' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#EFEFED'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                >
                  Review Now
                </button>
              </div>

              {/* Activity */}
              <div className="p-6" style={{ border: '1px solid #EDEDED', borderRadius: '4px' }}>
                <h2 className="mb-4" style={{ fontSize: '30px', fontWeight: 600, color: '#37352F' }}>Recent Activity</h2>
                <div className="space-y-3">
                  {[
                    { icon: '✅', text: 'Completed Topic 8: Hash Tables', time: '1 day ago' },
                    { icon: '📝', text: 'Reviewed 15 flashcards', time: '2 days ago' },
                    { icon: '🎯', text: 'Started Topic 7: Trees', time: '3 days ago' }
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="text-xl">{item.icon}</div>
                      <div>
                        <div className="text-sm" style={{ color: '#37352F' }}>{item.text}</div>
                        <div className="text-xs" style={{ color: 'rgba(55, 53, 47, 0.65)' }}>{item.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }} onClick={() => setShowAuthModal(false)}>
          <div className="w-96 p-6" style={{ backgroundColor: '#FFFFFF', borderRadius: '4px', border: '1px solid #EDEDED' }} onClick={(e) => e.stopPropagation()}>
            <div className="text-3xl mb-4 text-center">📚</div>
            <h2 className="mb-6 text-center" style={{ fontSize: '30px', fontWeight: 600, color: '#37352F' }}>Welcome to Study Planner</h2>
            
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full mb-3 px-3 py-2 text-sm"
              style={{ border: '1px solid #EDEDED', borderRadius: '4px', color: '#37352F' }}
            />
            <input
              type="password"
              placeholder="Enter your password"
              className="w-full mb-3 px-3 py-2 text-sm"
              style={{ border: '1px solid #EDEDED', borderRadius: '4px', color: '#37352F' }}
            />
            <input
              type="text"
              placeholder="Your name"
              className="w-full mb-4 px-3 py-2 text-sm"
              style={{ border: '1px solid #EDEDED', borderRadius: '4px', color: '#37352F' }}
              onKeyDown={(e) => e.key === 'Enter' && e.target.value && handleAuth(e.target.value)}
            />
            
            <button
              onClick={(e) => {
                const input = e.target.previousElementSibling;
                if (input.value) handleAuth(input.value);
              }}
              className="w-full px-4 py-2 text-sm font-medium transition-colors mb-4"
              style={{ border: '1px solid #D3D1CB', borderRadius: '4px', backgroundColor: '#37352F', color: '#FFFFFF' }}
            >
              Continue
            </button>
            
            <div className="flex items-center mb-4">
              <div className="flex-1" style={{ borderTop: '1px solid #EDEDED' }}></div>
              <span className="px-3 text-xs" style={{ color: 'rgba(55, 53, 47, 0.65)' }}>OR</span>
              <div className="flex-1" style={{ borderTop: '1px solid #EDEDED' }}></div>
            </div>
            
            <button
              className="w-full px-4 py-2 text-sm font-medium transition-colors mb-2"
              style={{ border: '1px solid #EDEDED', borderRadius: '4px', backgroundColor: '#FFFFFF', color: '#37352F' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#EFEFED'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
            >
              Continue with Google
            </button>
            <button
              className="w-full px-4 py-2 text-sm font-medium transition-colors"
              style={{ border: '1px solid #EDEDED', borderRadius: '4px', backgroundColor: '#FFFFFF', color: '#37352F' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#EFEFED'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
            >
              Continue with Apple
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
