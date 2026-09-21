import React, { useEffect, useMemo, useState } from 'react';

// ---------------------------------------------------------------------------
// Reading plan, straight from the Built to Last Field Guide
// ---------------------------------------------------------------------------
const WEEKS = [
  { week: 1, phase: 'Big Picture Pass', start: '2026-09-20', end: '2026-09-26', passage: 'James 1–5', chapters: [1, 2, 3, 4, 5], theme: 'Faith that Works', focus: 'Identify what real, active faith looks like.' },
  { week: 2, phase: 'Chapter by Chapter', start: '2026-09-27', end: '2026-10-03', passage: 'James 1', chapters: [1], theme: 'Trials & Discipline', focus: 'How God builds strength through pressure.' },
  { week: 3, phase: 'Chapter by Chapter', start: '2026-10-04', end: '2026-10-10', passage: 'James 2', chapters: [2], theme: 'Faith in Action', focus: 'Living out belief through actions.' },
  { week: 4, phase: 'Chapter by Chapter', start: '2026-10-11', end: '2026-10-17', passage: 'James 3', chapters: [3], theme: 'Words & Wisdom', focus: 'Controlling speech and choosing wisdom.' },
  { week: 5, phase: 'Chapter by Chapter', start: '2026-10-18', end: '2026-10-24', passage: 'James 4', chapters: [4], theme: 'Humility & Surrender', focus: 'Letting go of pride and submitting to God.' },
  { week: 6, phase: 'Chapter by Chapter', start: '2026-10-25', end: '2026-10-31', passage: 'James 5', chapters: [5], theme: 'Endurance & Prayer', focus: 'Staying steady and relying on prayer.' },
  { week: 7, phase: 'Living Out the Themes', start: '2026-11-01', end: '2026-11-07', passage: 'James 1–2', chapters: [1, 2], theme: 'Integrity in Faith', focus: 'Aligning belief with behavior.' },
  { week: 8, phase: 'Living Out the Themes', start: '2026-11-08', end: '2026-11-14', passage: 'James 3–4', chapters: [3, 4], theme: 'Mature Manhood', focus: 'Wisdom, humility, and perseverance.' },
  { week: 9, phase: 'Living Out the Themes', start: '2026-11-15', end: '2026-11-21', passage: 'James 5', chapters: [5], theme: 'Finishing Strong', focus: 'What endurance, patience, and faithful prayer look like in your daily life.' },
  { week: 10, phase: 'Living Out the Themes', start: '2026-11-22', end: '2026-11-28', passage: 'No reading', chapters: [], theme: 'Thanksgiving Break', focus: 'Pause, reflect, and practice gratitude.' },
  { week: 11, phase: 'Living Out the Themes', start: '2026-11-29', end: '2026-12-04', passage: 'James 1–5', chapters: [1, 2, 3, 4, 5], theme: 'Final Immersion', focus: 'Read the full book again; focus on what stands out most and apply it daily.' },
];

// ---------------------------------------------------------------------------
// Bible.com (YouVersion) links
// ---------------------------------------------------------------------------
const TRANSLATIONS = {
  ESV: 59,
  NIV: 111,
  NLT: 116,
  NKJV: 114,
  CSB: 1713,
  KJV: 1,
};

const BOOKS = {
  genesis: 'GEN', exodus: 'EXO', leviticus: 'LEV', numbers: 'NUM', deuteronomy: 'DEU', joshua: 'JOS', judges: 'JDG', ruth: 'RUT',
  '1 samuel': '1SA', '2 samuel': '2SA', '1 kings': '1KI', '2 kings': '2KI', '1 chronicles': '1CH', '2 chronicles': '2CH',
  ezra: 'EZR', nehemiah: 'NEH', esther: 'EST', job: 'JOB', psalm: 'PSA', psalms: 'PSA', proverbs: 'PRO', ecclesiastes: 'ECC',
  'song of solomon': 'SNG', 'song of songs': 'SNG', isaiah: 'ISA', jeremiah: 'JER', lamentations: 'LAM', ezekiel: 'EZK', daniel: 'DAN',
  hosea: 'HOS', joel: 'JOL', amos: 'AMO', obadiah: 'OBA', jonah: 'JON', micah: 'MIC', nahum: 'NAM', habakkuk: 'HAB',
  zephaniah: 'ZEP', haggai: 'HAG', zechariah: 'ZEC', malachi: 'MAL', matthew: 'MAT', mark: 'MRK', luke: 'LUK', john: 'JHN',
  acts: 'ACT', romans: 'ROM', '1 corinthians': '1CO', '2 corinthians': '2CO', galatians: 'GAL', ephesians: 'EPH',
  philippians: 'PHP', colossians: 'COL', '1 thessalonians': '1TH', '2 thessalonians': '2TH', '1 timothy': '1TI', '2 timothy': '2TI',
  titus: 'TIT', philemon: 'PHM', hebrews: 'HEB', james: 'JAS', '1 peter': '1PE', '2 peter': '2PE', '1 john': '1JN',
  '2 john': '2JN', '3 john': '3JN', jude: 'JUD', revelation: 'REV',
};

function bibleUrl(bookCode, chapter, translation) {
  const id = TRANSLATIONS[translation] || TRANSLATIONS.ESV;
  return `https://www.bible.com/bible/${id}/${bookCode}.${chapter}.${translation}`;
}

// Turns "James 1:2-8", "Romans 8", or "James 1-2" into chapter links.
function parsePassage(text) {
  if (!text) return null;
  const m = text.trim().match(/^([1-3]?\s*[A-Za-z][A-Za-z ]*?)\s+(\d+)(?::[\d\s,–-]+)?(?:\s*[–-]\s*(\d+))?/);
  if (!m) return null;
  const name = m[1].toLowerCase().replace(/\s+/g, ' ').replace(/^([1-3])\s*/, '$1 ').trim();
  const code = BOOKS[name];
  if (!code) return null;
  const first = parseInt(m[2], 10);
  const last = m[3] ? parseInt(m[3], 10) : first;
  const chapters = [];
  for (let c = first; c <= Math.min(last, first + 10); c += 1) chapters.push(c);
  const bookLabel = name.replace(/\b\w/g, (ch) => ch.toUpperCase());
  return { code, bookLabel, chapters };
}

// ---------------------------------------------------------------------------
// Dates (local time, never UTC)
// ---------------------------------------------------------------------------
function todayLocal() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function parseLocal(ymd) {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDate(ymd, opts = { weekday: 'short', month: 'short', day: 'numeric' }) {
  if (!ymd) return '';
  return parseLocal(ymd).toLocaleDateString(undefined, opts);
}

function weekForDate(ymd) {
  if (ymd < WEEKS[0].start) return WEEKS[0];
  const found = WEEKS.find((w) => ymd >= w.start && ymd <= w.end);
  return found || WEEKS[WEEKS.length - 1];
}

// ---------------------------------------------------------------------------
// Storage: entries are kept per email, so signing out never erases them
// ---------------------------------------------------------------------------
const USER_KEY = 'hear:user';
const entriesKey = (email) => `hear:entries:${email.trim().toLowerCase()}`;

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    return false;
  }
}

function loadEntries(email) {
  let list = readJSON(entriesKey(email), []);
  // One-time move of entries saved by the first version of the app
  const legacy = readJSON('hearEntries', null);
  if (Array.isArray(legacy) && legacy.length) {
    const ids = new Set(list.map((e) => e.id));
    list = [...list, ...legacy.filter((e) => !ids.has(e.id))];
    writeJSON(entriesKey(email), list);
    localStorage.removeItem('hearEntries');
  }
  return list;
}

const blankEntry = (track) => {
  const date = todayLocal();
  const wk = weekForDate(date);
  return {
    id: '',
    date,
    week: track === 'challenge' ? wk.week : '',
    passage: track === 'challenge' ? wk.passage : '',
    highlight: '',
    explain: '',
    apply: '',
    respond: '',
  };
};

const STEPS = [
  { key: 'highlight', letter: 'H', name: 'Highlight', prompt: 'Write down the verse(s) that stood out.', placeholder: 'Copy the verse that grabbed you, with its reference.' },
  { key: 'explain', letter: 'E', name: 'Explain', prompt: 'What does it mean in context? What’s happening here? Who’s involved?', placeholder: 'Summarize what James is saying and why.' },
  { key: 'apply', letter: 'A', name: 'Apply', prompt: 'How does this change how I live as a man? How does it shape my faith, work, family, and relationships?', placeholder: 'Be specific. What will you do differently this week?' },
  { key: 'respond', letter: 'R', name: 'Respond', prompt: 'Write a prayer or commitment to God based on what you learned.', placeholder: 'Lord, …' },
];

// ---------------------------------------------------------------------------
// Small pieces
// ---------------------------------------------------------------------------
function Logo({ size = 56 }) {
  return <img src="/logo.png" alt="Heritage Brotherhood" width={size} height={Math.round(size * 0.9)} style={{ display: 'block' }} />;
}

function ReadLinks({ bookCode = 'JAS', bookLabel = 'James', chapters, translation }) {
  if (!chapters || !chapters.length) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {chapters.map((c) => (
        <a key={c} className="chip" href={bibleUrl(bookCode, c, translation)} target="_blank" rel="noopener noreferrer">
          Read {bookLabel} {c}
        </a>
      ))}
    </div>
  );
}

function TranslationPicker({ value, onChange }) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span className="label muted" style={{ fontSize: 14 }}>Bible version</span>
      <select className="field" style={{ width: 'auto', padding: '6px 34px 6px 10px', fontSize: 15 }} value={value} onChange={(e) => onChange(e.target.value)}>
        {Object.keys(TRANSLATIONS).map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
    </label>
  );
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
export default function HEARJournal() {
  const [user, setUser] = useState(() => readJSON(USER_KEY, null));
  const [entries, setEntries] = useState(() => {
    const u = readJSON(USER_KEY, null);
    return u ? loadEntries(u.email) : [];
  });
  const [view, setView] = useState(() => {
    const u = readJSON(USER_KEY, null);
    if (!u) return 'welcome';
    return u.track ? 'home' : 'track';
  });
  const [draft, setDraft] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [notice, setNotice] = useState('');

  const translation = (user && user.translation) || 'ESV';
  const today = todayLocal();
  const thisWeek = weekForDate(today);

  useEffect(() => {
    if (!notice) return undefined;
    const t = setTimeout(() => setNotice(''), 2800);
    return () => clearTimeout(t);
  }, [notice]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  const sorted = useMemo(
    () => [...entries].sort((a, b) => (b.date === a.date ? Number(b.id) - Number(a.id) : b.date.localeCompare(a.date))),
    [entries]
  );

  const thisWeekCount = entries.filter((e) => e.date >= thisWeek.start && e.date <= thisWeek.end).length;

  const saveUser = (next) => {
    setUser(next);
    writeJSON(USER_KEY, next);
  };

  const persistEntries = (next) => {
    setEntries(next);
    if (!writeJSON(entriesKey(user.email), next)) {
      setNotice('Couldn’t save on this device. Private Browsing may be on.');
    }
  };

  // ---- actions
  const startNew = () => {
    setDraft(blankEntry(user.track));
    setView('form');
  };

  const startEdit = (entry) => {
    setDraft({ ...entry });
    setView('form');
  };

  const saveDraft = () => {
    if (!draft.passage.trim()) {
      setNotice('Add the passage you read.');
      return;
    }
    if (!STEPS.some((s) => draft[s.key].trim())) {
      setNotice('Write at least one part of H.E.A.R. before saving.');
      return;
    }
    let next;
    if (draft.id) {
      next = entries.map((e) => (e.id === draft.id ? { ...draft, updated: Date.now() } : e));
    } else {
      next = [...entries, { ...draft, id: String(Date.now()) }];
    }
    persistEntries(next);
    setDraft(null);
    setView('home');
    setNotice('Entry saved.');
  };

  const deleteEntry = (id) => {
    if (!window.confirm('Delete this entry? This can’t be undone.')) return;
    persistEntries(entries.filter((e) => e.id !== id));
    setOpenId(null);
    setView('home');
    setNotice('Entry deleted.');
  };

  const signOut = () => {
    if (!window.confirm('Sign out? Your entries stay saved on this device. Sign back in with the same email to see them.')) return;
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setEntries([]);
    setView('welcome');
  };

  const downloadJournal = () => {
    const lines = [`H.E.A.R. JOURNAL — ${user.name}`, 'Real Manhood: Built to Last · The Book of James', ''];
    [...sorted].reverse().forEach((e) => {
      lines.push('========================================');
      lines.push(`${formatDate(e.date, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}  |  ${e.passage}`);
      lines.push('');
      STEPS.forEach((s) => {
        if (e[s.key]) {
          lines.push(`${s.letter} — ${s.name.toUpperCase()}`);
          lines.push(e[s.key]);
          lines.push('');
        }
      });
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HEAR-Journal-${today}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toast = notice ? (
    <div role="status" style={{ position: 'fixed', left: 16, right: 16, bottom: 'calc(env(safe-area-inset-bottom) + 16px)', zIndex: 20, display: 'flex', justifyContent: 'center' }}>
      <div className="panel" style={{ padding: '12px 16px', borderColor: 'var(--rust)', maxWidth: 520 }}>{notice}</div>
    </div>
  ) : null;

  // =========================================================================
  // WELCOME
  // =========================================================================
  if (view === 'welcome') {
    return <Welcome onDone={(name, email) => {
      const u = { name: name.trim(), email: email.trim(), track: null, translation: 'ESV' };
      saveUser(u);
      setEntries(loadEntries(u.email));
      setView('track');
    }} />;
  }

  // =========================================================================
  // TRACK CHOICE
  // =========================================================================
  if (view === 'track') {
    const choose = (track) => {
      saveUser({ ...user, track });
      setView('home');
    };
    return (
      <div className="shell">
        <div style={{ display: 'flex', justifyContent: 'center', margin: '28px 0 20px' }}><Logo size={72} /></div>
        <h1 className="display" style={{ fontSize: 48, textAlign: 'center' }}>Welcome, {user.name}</h1>
        <p className="muted" style={{ textAlign: 'center', margin: '8px 0 28px' }}>How will you use your journal?</p>

        <button className="panel entry-card" style={{ padding: 22, marginBottom: 14 }} onClick={() => choose('challenge')}>
          <div className="display display-rust" style={{ fontSize: 30 }}>Follow the Challenge</div>
          <p style={{ marginTop: 6 }}>Eleven weeks through James with the Brotherhood. Each entry starts on this week’s reading and focus.</p>
        </button>
        <button className="panel entry-card" style={{ padding: 22 }} onClick={() => choose('independent')}>
          <div className="display" style={{ fontSize: 30 }}>Journal on my own</div>
          <p style={{ marginTop: 6 }}>Use H.E.A.R. with any passage, on your own schedule.</p>
        </button>
      </div>
    );
  }

  // =========================================================================
  // FORM (new + edit)
  // =========================================================================
  if (view === 'form' && draft) {
    const wk = draft.week ? WEEKS.find((w) => w.week === Number(draft.week)) : null;
    const parsed = user.track === 'challenge' ? null : parsePassage(draft.passage);
    const set = (patch) => setDraft({ ...draft, ...patch });

    return (
      <div className="shell">
        {toast}
        <button className="btn btn-ghost btn-small" onClick={() => { setDraft(null); setView('home'); }}>Back</button>

        <h1 className="display" style={{ fontSize: 44, margin: '22px 0 4px' }}>{draft.id ? 'Edit entry' : 'New entry'}</h1>
        <p className="muted" style={{ marginBottom: 24 }}>Read it. Journal it. Apply it.</p>

        {user.track === 'challenge' ? (
          <div style={{ marginBottom: 18 }}>
            <label className="label" htmlFor="week">Reading</label>
            <select id="week" className="field" style={{ marginTop: 6 }} value={draft.week}
              onChange={(e) => {
                const w = WEEKS.find((x) => x.week === Number(e.target.value));
                set({ week: w ? w.week : '', passage: w ? w.passage : '' });
              }}>
              {WEEKS.map((w) => (
                <option key={w.week} value={w.week}>Week {w.week}: {w.passage} ({w.theme})</option>
              ))}
            </select>
          </div>
        ) : (
          <div style={{ marginBottom: 18 }}>
            <label className="label" htmlFor="passage">Passage</label>
            <input id="passage" className="field" style={{ marginTop: 6 }} placeholder="e.g. James 1:2–8" value={draft.passage} onChange={(e) => set({ passage: e.target.value })} />
          </div>
        )}

        {wk && (
          <div className="panel" style={{ padding: 16, marginBottom: 18 }}>
            <div className="label copper">H.E.A.R. focus</div>
            <p style={{ margin: '4px 0 12px' }}>{wk.focus}</p>
            <ReadLinks chapters={wk.chapters} translation={translation} />
          </div>
        )}
        {parsed && (
          <div style={{ marginBottom: 18 }}>
            <ReadLinks bookCode={parsed.code} bookLabel={parsed.bookLabel} chapters={parsed.chapters} translation={translation} />
          </div>
        )}

        <div style={{ marginBottom: 28 }}>
          <label className="label" htmlFor="date">Date</label>
          <input id="date" type="date" className="field" style={{ marginTop: 6 }} value={draft.date} onChange={(e) => set({ date: e.target.value })} />
        </div>

        {STEPS.map((s) => (
          <section key={s.key} style={{ marginBottom: 26 }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 10 }}>
              <div className="letter" aria-hidden="true">{s.letter}</div>
              <div>
                <label htmlFor={s.key} className="display" style={{ fontSize: 28, display: 'block' }}>{s.name}</label>
                <p className="muted" style={{ fontSize: 15, lineHeight: 1.4 }}>{s.prompt}</p>
              </div>
            </div>
            <textarea id={s.key} className="field" placeholder={s.placeholder} value={draft[s.key]} onChange={(e) => set({ [s.key]: e.target.value })} />
          </section>
        ))}

        <button className="btn btn-primary" onClick={saveDraft}>Save entry</button>
      </div>
    );
  }

  // =========================================================================
  // SINGLE ENTRY
  // =========================================================================
  const opened = view === 'entry' ? entries.find((x) => x.id === openId) : null;
  if (opened) {
    const e = opened;
    const wk = e.week ? WEEKS.find((w) => w.week === Number(e.week)) : null;
    const parsed = wk ? null : parsePassage(e.passage);
    return (
      <div className="shell">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <button className="btn btn-ghost btn-small" onClick={() => setView('home')}>Back</button>
          <button className="btn btn-ghost btn-small" onClick={() => startEdit(e)}>Edit</button>
        </div>

        <p className="label muted" style={{ marginTop: 24 }}>{formatDate(e.date, { weekday: 'long', month: 'long', day: 'numeric' })}{wk ? ` · Week ${wk.week}` : ''}</p>
        <h1 className="display" style={{ fontSize: 52, margin: '4px 0 14px' }}>{e.passage}</h1>
        {wk ? <ReadLinks chapters={wk.chapters} translation={translation} /> : parsed && <ReadLinks bookCode={parsed.code} bookLabel={parsed.bookLabel} chapters={parsed.chapters} translation={translation} />}

        <div style={{ height: 1, background: 'var(--line)', margin: '26px 0' }} />

        {STEPS.filter((s) => e[s.key]).map((s) => (
          <section key={s.key} style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 8 }}>
              <div className="letter" aria-hidden="true">{s.letter}</div>
              <h2 className="display" style={{ fontSize: 28 }}>{s.name}</h2>
            </div>
            <p style={{ whiteSpace: 'pre-wrap', fontSize: 18, lineHeight: 1.6 }}>{e[s.key]}</p>
          </section>
        ))}

        <button className="btn btn-ghost btn-danger btn-small" style={{ marginTop: 12 }} onClick={() => deleteEntry(e.id)}>Delete entry</button>
      </div>
    );
  }

  // =========================================================================
  // HOME
  // =========================================================================
  return (
    <div className="shell">
      {toast}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 26 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Logo size={44} />
          <div>
            <div className="display" style={{ fontSize: 26 }}>H.E.A.R. Journal</div>
            <div className="muted" style={{ fontSize: 14 }}>{user.name}</div>
          </div>
        </div>
        <button className="btn btn-ghost btn-small" onClick={signOut}>Sign out</button>
      </header>

      {user.track === 'challenge' && (
        <section className="panel" style={{ padding: 20, marginBottom: 20 }}>
          <div className="ruled tracked" style={{ fontSize: 13 }}>Week {thisWeek.week} of 11</div>
          <h2 className="display" style={{ fontSize: 50, textAlign: 'center', margin: '12px 0 2px' }}>{thisWeek.passage}</h2>
          <p className="display display-rust" style={{ fontSize: 28, textAlign: 'center' }}>{thisWeek.theme}</p>
          <p className="muted" style={{ textAlign: 'center', fontSize: 15, margin: '4px 0 16px' }}>
            {formatDate(thisWeek.start, { month: 'short', day: 'numeric' })} – {formatDate(thisWeek.end, { month: 'short', day: 'numeric' })} · {thisWeek.phase}
          </p>
          <div className="panel-framed" style={{ padding: '12px 14px', marginBottom: 16 }}>
            <div className="label copper">H.E.A.R. focus</div>
            <p>{thisWeek.focus}</p>
          </div>
          <div style={{ marginBottom: 16 }}><ReadLinks chapters={thisWeek.chapters} translation={translation} /></div>
          <p style={{ fontSize: 15, marginBottom: 16 }}>
            <span className={`tally ${thisWeekCount >= 1 ? 'on' : ''}`} />
            <span className={`tally ${thisWeekCount >= 2 ? 'on' : ''}`} />
            {thisWeekCount >= 2 ? `${thisWeekCount} entries this week. Goal met.` : `${thisWeekCount} of 2 entries this week`}
          </p>
          <button className="btn btn-primary" onClick={startNew}>Journal this reading</button>
        </section>
      )}

      {user.track !== 'challenge' && (
        <button className="btn btn-primary" style={{ marginBottom: 20 }} onClick={startNew}>New entry</button>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0 12px' }}>
        <h2 className="display" style={{ fontSize: 30 }}>Your entries</h2>
        <span className="muted" style={{ fontSize: 15 }}>{entries.length}</span>
      </div>

      {sorted.length === 0 ? (
        <div className="panel" style={{ padding: 20 }}>
          <p>Nothing here yet. Read this week’s passage, then write your first H.E.A.R. entry.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {sorted.map((e) => (
            <button key={e.id} className="panel entry-card" onClick={() => { setOpenId(e.id); setView('entry'); }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span className="label muted" style={{ fontSize: 14 }}>{formatDate(e.date)}</span>
                {e.week ? <span className="label copper" style={{ fontSize: 14 }}>Week {e.week}</span> : null}
              </div>
              <div className="display" style={{ fontSize: 26, marginTop: 2 }}>{e.passage}</div>
              {e.highlight && (
                <p className="muted" style={{ fontSize: 15, marginTop: 4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {e.highlight}
                </p>
              )}
            </button>
          ))}
        </div>
      )}

      <footer style={{ marginTop: 36, display: 'grid', gap: 16 }}>
        <TranslationPicker value={translation} onChange={(t) => saveUser({ ...user, translation: t })} />
        <p className="muted" style={{ fontSize: 14 }}>
          Entries are saved on this device only. <button className="link" style={{ background: 'none', border: 0, padding: 0, font: 'inherit' }} onClick={downloadJournal}>Download a copy</button> anytime.
        </p>
        <p className="muted" style={{ fontSize: 14 }}>
          Switch to <button className="link" style={{ background: 'none', border: 0, padding: 0, font: 'inherit' }} onClick={() => setView('track')}>{user.track === 'challenge' ? 'journaling on your own' : 'the Challenge plan'}</button>
        </p>
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Welcome screen: the Field Guide cover is the hero
// ---------------------------------------------------------------------------
function Welcome({ onDone }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const submit = (ev) => {
    ev.preventDefault();
    if (!name.trim()) return setError('Enter your first name.');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Enter a valid email. It’s how the app finds your entries.');
    return onDone(name, email);
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      <div style={{ maxWidth: 520, margin: '0 auto', position: 'relative' }}>
        <img src="/cover.jpg" alt="The Brotherhood Challenge. Real Manhood: Built to Last. Field Guide, the Book of James." style={{ width: '100%', display: 'block' }} />
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 120, background: 'linear-gradient(transparent, var(--ink))' }} />
      </div>
      <form className="shell" style={{ paddingTop: 8, maxWidth: 520 }} onSubmit={submit} noValidate>
        <div className="ruled tracked" style={{ fontSize: 14, marginBottom: 18 }}>H.E.A.R. Journal</div>
        <div style={{ display: 'grid', gap: 14 }}>
          <label>
            <span className="label">First name</span>
            <input className="field" style={{ marginTop: 6 }} autoComplete="given-name" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label>
            <span className="label">Email</span>
            <input className="field" style={{ marginTop: 6 }} type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          {error && <p role="alert" className="copper" style={{ fontSize: 15 }}>{error}</p>}
          <button type="submit" className="btn btn-primary" style={{ marginTop: 6 }}>Start journaling</button>
        </div>
        <p className="muted" style={{ fontSize: 14, textAlign: 'center', marginTop: 18 }}>Sept 20 – Dec 5, 2026 · Heritage Church Brotherhood</p>
      </form>
    </div>
  );
}
