import React, { useState, useEffect } from 'react';

// Get credentials from environment variables (set in .env or Vercel dashboard)
const NOTION_TOKEN = process.env.REACT_APP_NOTION_TOKEN;
const NOTION_API = 'https://api.notion.com/v1';

// Database IDs from environment variables
const DB_IDS = {
  users: process.env.REACT_APP_NOTION_DB_USERS,
  challenges: process.env.REACT_APP_NOTION_DB_CHALLENGES,
  readings: process.env.REACT_APP_NOTION_DB_READINGS,
  entries: process.env.REACT_APP_NOTION_DB_ENTRIES,
  threads: process.env.REACT_APP_NOTION_DB_THREADS
};

// 11-Week Book of James Reading Schedule
const JAMES_READINGS = [
  // Phase 1: Big Picture (Week 1)
  {
    week: 1,
    date: '2026-09-20',
    passage: 'James 1:1-27',
    chapter: 1,
    verses: '1-27',
    theme: 'Faith that Works',
    description: 'Week 1: The Big Picture - Read through all of James to get the overview'
  },
  
  // Phase 2: Chapter by Chapter (Weeks 2-6)
  {
    week: 2,
    date: '2026-09-27',
    passage: 'James 1:1-27',
    chapter: 1,
    verses: '1-27',
    theme: 'Trials & Discipline',
    description: 'Week 2: James 1 - Understanding trials and perseverance'
  },
  {
    week: 3,
    date: '2026-10-04',
    passage: 'James 2:1-26',
    chapter: 2,
    verses: '1-26',
    theme: 'Faith in Action',
    description: 'Week 3: James 2 - Faith without works is dead'
  },
  {
    week: 4,
    date: '2026-10-11',
    passage: 'James 3:1-18',
    chapter: 3,
    verses: '1-18',
    theme: 'Words & Wisdom',
    description: 'Week 4: James 3 - The power of the tongue'
  },
  {
    week: 5,
    date: '2026-10-18',
    passage: 'James 4:1-17',
    chapter: 4,
    verses: '1-17',
    theme: 'Humility & Surrender',
    description: 'Week 5: James 4 - Submission to God'
  },
  {
    week: 6,
    date: '2026-10-25',
    passage: 'James 5:1-20',
    chapter: 5,
    verses: '1-20',
    theme: 'Endurance & Prayer',
    description: 'Week 6: James 5 - Patience and prayer in suffering'
  },

  // Phase 3: Identifying & Living Out Themes (Weeks 7-11)
  {
    week: 7,
    date: '2026-11-01',
    passage: 'James 1-2',
    chapter: 1,
    verses: '1-26, 2:1-26',
    theme: 'Integrity in Faith',
    description: 'Week 7: Revisiting James 1-2 - Integrity and authentic faith'
  },
  {
    week: 8,
    date: '2026-11-08',
    passage: 'James 3-4',
    chapter: 3,
    verses: '1-18, 4:1-17',
    theme: 'Mature Manhood',
    description: 'Week 8: Revisiting James 3-4 - Words and surrender'
  },
  {
    week: 9,
    date: '2026-11-15',
    passage: 'James 5:1-20',
    chapter: 5,
    verses: '1-20',
    theme: 'Finishing Strong',
    description: 'Week 9: James 5 - Endurance and finishing the race'
  },
  {
    week: 10,
    date: '2026-11-22',
    passage: 'Reflection Week',
    chapter: 0,
    verses: '',
    theme: 'Thanksgiving & Reflection',
    description: 'Week 10: No reading - Thanksgiving break. Reflect on the journey.'
  },
  {
    week: 11,
    date: '2026-11-29',
    passage: 'James 1-5',
    chapter: 0,
    verses: '1-5',
    theme: 'Final Immersion',
    description: 'Week 11: Final read through of entire James - Celebrate completion!'
  }
];

export default function HEARJournal() {
  const [view, setView] = useState('startup'); // startup, challenge-select, list, create, view, edit
  const [currentUser, setCurrentUser] = useState(null);
  const [userChallenge, setUserChallenge] = useState(null);
  const [entries, setEntries] = useState([]);
  const [readings, setReadings] = useState(JAMES_READINGS);
  const [currentEntry, setCurrentEntry] = useState(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    passage: '',
    week: '',
    highlight: '',
    explain: '',
    apply: '',
    respond: '',
  });

  // Load from localStorage (fallback until Notion is fully integrated)
  useEffect(() => {
    const saved = localStorage.getItem('hearEntries');
    if (saved) {
      setEntries(JSON.parse(saved));
    }
    
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
      setView('list');
    }
  }, []);

  const handleUserSetup = (name, email) => {
    const user = { name, email, id: Date.now().toString() };
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    setView('challenge-select');
  };

  const handleChallengeSelection = (type) => {
    setUserChallenge(type); // 'challenge' or 'independent'
    setView('list');
  };

  const saveEntry = () => {
    if (!formData.passage || !formData.highlight) {
      alert('Please fill in Passage and Highlight fields');
      return;
    }

    let updated = [...entries];
    if (currentEntry !== null) {
      updated[currentEntry] = {
        ...formData,
        id: entries[currentEntry].id,
      };
    } else {
      updated.push({
        ...formData,
        id: Date.now().toString(),
      });
    }

    setEntries(updated);
    localStorage.setItem('hearEntries', JSON.stringify(updated));
    resetForm();
    setView('list');
  };

  const deleteEntry = (index) => {
    const updated = entries.filter((_, i) => i !== index);
    setEntries(updated);
    localStorage.setItem('hearEntries', JSON.stringify(updated));
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      passage: '',
      week: '',
      highlight: '',
      explain: '',
      apply: '',
      respond: '',
    });
    setCurrentEntry(null);
  };

  const startCreate = () => {
    resetForm();
    setView('create');
  };

  const startEdit = (index) => {
    setCurrentEntry(index);
    setFormData(entries[index]);
    setView('edit');
  };

  const startView = (index) => {
    setCurrentEntry(index);
    setView('view');
  };

  // ========================
  // STARTUP VIEW
  // ========================
  if (view === 'startup' && !currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">H.E.A.R. Journal</h1>
            <p className="text-gray-600 mb-1">Real Manhood: Built to Last</p>
            <p className="text-sm text-gray-500">September 20 - December 5, 2026</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Your Name</label>
              <input
                type="text"
                id="userName"
                placeholder="First name"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <input
                type="email"
                id="userEmail"
                placeholder="your@email.com"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              onClick={() => {
                const name = document.getElementById('userName').value;
                const email = document.getElementById('userEmail').value;
                if (name && email) {
                  handleUserSetup(name, email);
                } else {
                  alert('Please fill in all fields');
                }
              }}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition mt-6"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ========================
  // CHALLENGE SELECTION VIEW
  // ========================
  if (view === 'challenge-select' && !userChallenge) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome, {currentUser?.name}!</h1>
            <p className="text-gray-600">How would you like to use this journal?</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Challenge Button */}
            <button
              onClick={() => handleChallengeSelection('challenge')}
              className="p-8 border-2 border-indigo-300 hover:border-indigo-600 rounded-lg hover:bg-indigo-50 transition text-left"
            >
              <div className="text-4xl mb-3">📖</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Brotherhood Challenge</h3>
              <p className="text-gray-600 text-sm">Follow the 11-week "Real Manhood: Built to Last" challenge. Get daily readings and journal prompts aligned to the schedule.</p>
            </button>

            {/* Independent Button */}
            <button
              onClick={() => handleChallengeSelection('independent')}
              className="p-8 border-2 border-green-300 hover:border-green-600 rounded-lg hover:bg-green-50 transition text-left"
            >
              <div className="text-4xl mb-3">✍️</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Journal Independently</h3>
              <p className="text-gray-600 text-sm">Use the H.E.A.R. method on your own schedule. Reflect on any Scripture passage that speaks to you.</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ========================
  // LIST VIEW
  // ========================
  if (view === 'list') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">H.E.A.R. Journal</h1>
                <p className="text-gray-600 mb-1">
                  {userChallenge === 'challenge' 
                    ? "Following: Real Manhood: Built to Last" 
                    : "Independent Journaling"}
                </p>
                <p className="text-sm text-gray-500">User: {currentUser?.name} ({currentUser?.email})</p>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem('currentUser');
                  localStorage.removeItem('hearEntries');
                  setCurrentUser(null);
                  setUserChallenge(null);
                  setView('startup');
                }}
                className="text-gray-600 hover:text-gray-900 text-sm font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Create New Button */}
          <button
            onClick={startCreate}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 mb-6 transition shadow-md"
          >
            <span>➕</span>
            New Journal Entry
          </button>

          {/* Entries List */}
          {entries.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center shadow-sm">
              <p className="text-gray-500 text-lg mb-2">No entries yet.</p>
              <p className="text-gray-400">Start your H.E.A.R. journal and watch your faith grow.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {entries.map((entry, index) => (
                <div key={entry.id} className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition border-l-4 border-indigo-600">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{entry.date}</p>
                      <h3 className="text-lg font-semibold text-gray-900 mt-1">{entry.passage}</h3>
                    </div>
                    <div className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">
                      {entry.highlight ? '✓ Complete' : '⊘ Incomplete'}
                    </div>
                  </div>

                  {entry.highlight && (
                    <p className="text-gray-700 text-sm mb-4 italic border-l-2 border-indigo-300 pl-3">
                      "{entry.highlight.substring(0, 100)}{entry.highlight.length > 100 ? '...' : ''}"
                    </p>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => startView(index)}
                      className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-2 px-4 rounded-lg transition text-sm"
                    >
                      👁️ View
                    </button>
                    <button
                      onClick={() => startEdit(index)}
                      className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-700 font-medium py-2 px-4 rounded-lg transition text-sm"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => deleteEntry(index)}
                      className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 font-medium py-2 px-4 rounded-lg transition text-sm"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ========================
  // CREATE/EDIT VIEW
  // ========================
  if (view === 'create' || view === 'edit') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => setView('list')}
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-8 font-medium transition"
          >
            ← Back to Entries
          </button>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {view === 'create' ? 'New Journal Entry' : 'Edit Entry'}
            </h1>
            <p className="text-gray-600 mb-8">Take time to reflect deeply on Scripture. Use the H.E.A.R. method.</p>

            {/* Passage Info */}
            <div className="mb-8">
              {userChallenge === 'challenge' ? (
                <>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Select a Reading</label>
                  <select
                    value={formData.week}
                    onChange={(e) => {
                      const week = readings.find(r => r.week === parseInt(e.target.value));
                      setFormData({
                        ...formData,
                        week: e.target.value,
                        passage: week?.passage || '',
                      });
                    }}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- Choose a reading --</option>
                    {readings.map((r) => (
                      <option key={r.week} value={r.week}>
                        Week {r.week}: {r.passage} - {r.theme}
                      </option>
                    ))}
                  </select>
                </>
              ) : (
                <>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Scripture Passage</label>
                  <input
                    type="text"
                    placeholder="e.g., James 1:1-10"
                    value={formData.passage}
                    onChange={(e) => setFormData({ ...formData, passage: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </>
              )}
            </div>

            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="border-t pt-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">H.E.A.R. Method</h2>

              {/* H - Highlight */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-md">H</div>
                  <div>
                    <label className="text-lg font-bold text-gray-900">Highlight</label>
                    <p className="text-xs text-gray-500 mt-0.5">Which verse(s) stood out to you?</p>
                  </div>
                </div>
                <textarea
                  placeholder="Write the verse or verses that spoke to your heart..."
                  value={formData.highlight}
                  onChange={(e) => setFormData({ ...formData, highlight: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-24 text-gray-700"
                />
              </div>

              {/* E - Explain */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-md">E</div>
                  <div>
                    <label className="text-lg font-bold text-gray-900">Explain</label>
                    <p className="text-xs text-gray-500 mt-0.5">What's happening here? Who's involved? Context?</p>
                  </div>
                </div>
                <textarea
                  placeholder="Summarize the meaning and context..."
                  value={formData.explain}
                  onChange={(e) => setFormData({ ...formData, explain: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-24 text-gray-700"
                />
              </div>

              {/* A - Apply */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-md">A</div>
                  <div>
                    <label className="text-lg font-bold text-gray-900">Apply</label>
                    <p className="text-xs text-gray-500 mt-0.5">How does this change how you live as a man?</p>
                  </div>
                </div>
                <textarea
                  placeholder="How does this apply to your life? What will you do differently?"
                  value={formData.apply}
                  onChange={(e) => setFormData({ ...formData, apply: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-24 text-gray-700"
                />
              </div>

              {/* R - Respond */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-md">R</div>
                  <div>
                    <label className="text-lg font-bold text-gray-900">Respond</label>
                    <p className="text-xs text-gray-500 mt-0.5">Write a prayer or commitment to God</p>
                  </div>
                </div>
                <textarea
                  placeholder="Your prayer, commitment, or declaration..."
                  value={formData.respond}
                  onChange={(e) => setFormData({ ...formData, respond: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-24 text-gray-700"
                />
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={saveEntry}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-lg transition text-lg shadow-md hover:shadow-lg"
            >
              💾 Save Entry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ========================
  // VIEW ONLY
  // ========================
  if (view === 'view' && currentEntry !== null) {
    const entry = entries[currentEntry];
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => setView('list')}
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-8 font-medium transition"
          >
            ← Back to Entries
          </button>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-start justify-between mb-8">
              <div>
                <p className="text-sm text-gray-500 mb-2 font-medium uppercase tracking-wide">{entry.date}</p>
                <h1 className="text-4xl font-bold text-gray-900">{entry.passage}</h1>
              </div>
              <button
                onClick={() => startEdit(currentEntry)}
                className="bg-amber-50 hover:bg-amber-100 text-amber-700 font-medium py-2 px-4 rounded-lg transition"
              >
                ✏️ Edit
              </button>
            </div>

            <hr className="mb-10" />

            {/* H */}
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-lg">H</div>
                <h2 className="text-2xl font-bold text-gray-900">Highlight</h2>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap text-lg leading-relaxed">{entry.highlight}</p>
            </div>

            {/* E */}
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-lg">E</div>
                <h2 className="text-2xl font-bold text-gray-900">Explain</h2>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap text-lg leading-relaxed">{entry.explain}</p>
            </div>

            {/* A */}
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-lg">A</div>
                <h2 className="text-2xl font-bold text-gray-900">Apply</h2>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap text-lg leading-relaxed">{entry.apply}</p>
            </div>

            {/* R */}
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-lg">R</div>
                <h2 className="text-2xl font-bold text-gray-900">Respond</h2>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap text-lg leading-relaxed">{entry.respond}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
