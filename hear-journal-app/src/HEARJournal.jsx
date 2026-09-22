import React, { useEffect, useMemo, useState } from 'react';

// ---------------------------------------------------------------------------
// Reading plan, straight from the Built to Last Field Guide
// ---------------------------------------------------------------------------
const WEEKS = [
  { week: 1, phase: 'Big Picture Pass', start: '2026-09-20', end: '2026-09-26', passage: 'James 1–5', chapters: [1, 2, 3, 4, 5], theme: 'Faith that Works', focus: 'Identify what real, active faith looks like in your life.' },
  { week: 2, phase: 'Chapter by Chapter', start: '2026-09-27', end: '2026-10-03', passage: 'James 1', chapters: [1], theme: 'Trials & Discipline', focus: 'How God builds strength through pressure.' },
  { week: 3, phase: 'Chapter by Chapter', start: '2026-10-04', end: '2026-10-10', passage: 'James 2', chapters: [2], theme: 'Faith in Action', focus: 'Living out belief through actions.' },
  { week: 4, phase: 'Chapter by Chapter', start: '2026-10-11', end: '2026-10-17', passage: 'James 3', chapters: [3], theme: 'Words & Wisdom', focus: 'Controlling Speech and choosing wisdom.' },
  { week: 5, phase: 'Chapter by Chapter', start: '2026-10-18', end: '2026-10-24', passage: 'James 4', chapters: [4], theme: 'Humility & Surrender', focus: 'Letting go of pride and submitting to God.' },
  { week: 6, phase: 'Chapter by Chapter', start: '2026-10-25', end: '2026-10-31', passage: 'James 5', chapters: [5], theme: 'Endurance & Prayer', focus: 'Staying steady and relying on prayer.' },
  { week: 7, phase: 'Identifying & Living Out Themes', start: '2026-11-01', end: '2026-11-07', passage: 'James 1–2', chapters: [1, 2], theme: 'Integrity in Faith', focus: 'Aligning belief with behavior.' },
  { week: 8, phase: 'Identifying & Living Out Themes', start: '2026-11-08', end: '2026-11-14', passage: 'James 3–4', chapters: [3, 4], theme: 'Mature Manhood', focus: 'Wisdom, humility, and perseverance.' },
  { week: 9, phase: 'Identifying & Living Out Themes', start: '2026-11-15', end: '2026-11-21', passage: 'James 5', chapters: [5], theme: 'Finishing Strong', focus: 'What does endurance, patience, and faithful prayer look like in your daily life.' },
  { week: 10, phase: 'Identifying & Living Out Themes', start: '2026-11-22', end: '2026-11-28', passage: 'No reading', chapters: [], theme: 'Thanksgiving Break', focus: 'Pause, reflect, and practice gratitude.' },
  { week: 11, phase: 'Identifying & Living Out Themes', start: '2026-11-29', end: '2026-12-04', passage: 'James 1–5', chapters: [1, 2, 3, 4, 5], theme: 'Final Immersion', focus: 'Read the full book again; focus on what stands out most and apply it daily.' },
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

// Journaling goal from the Field Guide check-in: "Did you journal at least twice?"
// Thanksgiving week has no reading, so one reflection counts.
const goalFor = (w) => (w.week === 10 ? 1 : 2);

function entriesForWeek(entries, w) {
  return entries.filter((e) => (e.week ? Number(e.week) === w.week : e.date >= w.start && e.date <= w.end));
}

function weekStatus(entries, w, today) {
  const count = entriesForWeek(entries, w).length;
  if (count >= goalFor(w)) return { key: 'done', count };
  if (today >= w.start && today <= w.end) return { key: 'current', count };
  if (w.start > today) return { key: 'upcoming', count };
  return { key: count ? 'partial' : 'missed', count };
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

const blankEntry = (track, weekNum) => {
  const date = todayLocal();
  const wk = WEEKS.find((w) => w.week === weekNum) || weekForDate(date);
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
// Add to Home Screen
// ---------------------------------------------------------------------------
// Android/Chrome offers a real install prompt. It fires once, early, so catch it here.
let deferredInstall = null;
const installListeners = new Set();
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstall = e;
    installListeners.forEach((fn) => fn(true));
  });
  window.addEventListener('appinstalled', () => {
    deferredInstall = null;
    installListeners.forEach((fn) => fn(false));
  });
}

function detectPlatform() {
  const ua = navigator.userAgent || '';
  const iOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (iOS) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'other';
}

function isInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

const ShareIcon = () => (
  <svg width="18" height="22" viewBox="0 0 18 22" aria-hidden="true" style={{ display: 'inline-block', verticalAlign: '-4px', margin: '0 3px' }}>
    <path d="M9 1v13M5 5l4-4 4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6 9H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10a1 1 0 0 0-1-1h-3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);
const DotsIcon = () => (
  <svg width="6" height="20" viewBox="0 0 6 20" aria-hidden="true" style={{ display: 'inline-block', verticalAlign: '-4px', margin: '0 5px' }}>
    <circle cx="3" cy="3" r="2" fill="currentColor" /><circle cx="3" cy="10" r="2" fill="currentColor" /><circle cx="3" cy="17" r="2" fill="currentColor" />
  </svg>
);

const INSTALL_STEPS = {
  ios: [
    <>Open this page in <b>Safari</b>.</>,
    <>Tap the Share button <ShareIcon /> at the bottom of the screen. On iPad it’s at the top.</>,
    <>Scroll down and tap <b>Add to Home Screen</b>.</>,
    <>Tap <b>Add</b>. The HB icon appears on your home screen.</>,
  ],
  android: [
    <>Open this page in <b>Chrome</b>.</>,
    <>Tap the menu <DotsIcon /> in the top-right corner.</>,
    <>Tap <b>Add to Home screen</b> or <b>Install app</b>.</>,
    <>Tap <b>Install</b> or <b>Add</b>. The HB icon appears on your home screen.</>,
  ],
};

function InstallGuide({ onClose }) {
  const detected = detectPlatform();
  const [tab, setTab] = useState(detected === 'android' ? 'android' : 'ios');
  const [canPrompt, setCanPrompt] = useState(!!deferredInstall);
  const installed = isInstalled();

  useEffect(() => {
    installListeners.add(setCanPrompt);
    return () => installListeners.delete(setCanPrompt);
  }, []);

  const promptInstall = async () => {
    if (!deferredInstall) return;
    deferredInstall.prompt();
    await deferredInstall.userChoice.catch(() => null);
    deferredInstall = null;
    setCanPrompt(false);
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="install-title"
      style={{ position: 'fixed', inset: 0, zIndex: 30, background: 'rgba(8,8,7,0.8)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={onClose}>
      <div className="panel" onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 560, borderRadius: '10px 10px 0 0', padding: '22px 20px calc(env(safe-area-inset-bottom) + 24px)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <h2 id="install-title" className="display" style={{ fontSize: 32 }}>Put it on your home screen</h2>
          <button className="btn btn-ghost btn-small" onClick={onClose} aria-label="Close">Close</button>
        </div>

        {installed ? (
          <p style={{ margin: '8px 0 4px' }}>You’re already using the home screen app. You’re all set.</p>
        ) : (
          <>
            <p className="muted" style={{ fontSize: 15, marginBottom: 16 }}>Opens full screen like an app, one tap from your home screen. Nothing to download from an app store.</p>

            {canPrompt && (
              <div style={{ marginBottom: 18 }}>
                <button className="btn btn-primary" onClick={promptInstall}>Install H.E.A.R. Journal</button>
                <p className="muted" style={{ fontSize: 14, marginTop: 8, textAlign: 'center' }}>Or follow the steps below.</p>
              </div>
            )}

            <div role="tablist" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              {[['ios', 'iPhone / iPad'], ['android', 'Android']].map(([key, label]) => (
                <button key={key} role="tab" aria-selected={tab === key} className="btn btn-small"
                  style={{ background: tab === key ? 'var(--rust)' : 'transparent', color: tab === key ? '#fbf6ef' : 'var(--stone)', borderColor: tab === key ? '#b86a3e' : 'var(--line)' }}
                  onClick={() => setTab(key)}>{label}</button>
              ))}
            </div>

            <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 12 }}>
              {INSTALL_STEPS[tab].map((step, i) => (
                // eslint-disable-next-line react/no-array-index-key
                <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span className="letter" style={{ width: 32, height: 32, fontSize: 22 }} aria-hidden="true">{i + 1}</span>
                  <span style={{ paddingTop: 4 }}>{step}</span>
                </li>
              ))}
            </ol>

            {tab === 'ios' && detected === 'ios' && (
              <p className="muted" style={{ fontSize: 14, marginTop: 16 }}>In Chrome or another browser on iPhone, the Share button is in the address bar instead. Safari is the most reliable.</p>
            )}
            <p className="muted" style={{ fontSize: 14, marginTop: 16 }}>The first time you open it from your home screen, sign in once with your email and PIN. Your entries will be there.</p>
          </>
        )}
      </div>
    </div>
  );
}

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

function Tally({ count, goal }) {
  const boxes = [];
  for (let i = 0; i < goal; i += 1) boxes.push(<span key={i} className={`tally ${count > i ? 'on' : ''}`} />);
  let text = `${count} of ${goal} ${goal === 1 ? 'entry' : 'entries'}`;
  if (count >= goal) text = `${count} ${count === 1 ? 'entry' : 'entries'}. Goal met.`;
  return <span style={{ fontSize: 15 }}>{boxes}{text}</span>;
}

function WeekCard({ w, count, isCurrent, translation, onJournal }) {
  return (
    <section className="panel" style={{ padding: 20, marginBottom: 20 }}>
      <div className="ruled tracked" style={{ fontSize: 13 }}>Week {w.week} of 11{isCurrent ? ' · This week' : ''}</div>
      <h2 className="display" style={{ fontSize: 50, textAlign: 'center', margin: '12px 0 2px' }}>{w.passage}</h2>
      <p className="display display-rust" style={{ fontSize: 28, textAlign: 'center' }}>{w.theme}</p>
      <p className="muted" style={{ textAlign: 'center', fontSize: 15, margin: '4px 0 16px' }}>
        {formatDate(w.start, { month: 'short', day: 'numeric' })} – {formatDate(w.end, { month: 'short', day: 'numeric' })} · {w.phase}
      </p>
      <div className="panel-framed" style={{ padding: '12px 14px', marginBottom: 16 }}>
        <div className="label copper">H.E.A.R. focus</div>
        <p>{w.focus}</p>
      </div>
      {w.chapters.length > 0 && <div style={{ marginBottom: 16 }}><ReadLinks chapters={w.chapters} translation={translation} /></div>}
      <p style={{ marginBottom: 16 }}><Tally count={count} goal={goalFor(w)} /></p>
      <button className="btn btn-primary" onClick={onJournal}>{w.week === 10 ? 'Write a reflection' : 'Journal this reading'}</button>
    </section>
  );
}

function ProgressBar({ entries, today }) {
  const done = WEEKS.filter((w) => weekStatus(entries, w, today).key === 'done').length;
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(11, 1fr)', gap: 4 }} aria-hidden="true">
        {WEEKS.map((w) => {
          const st = weekStatus(entries, w, today).key;
          const bg = st === 'done' ? 'var(--copper)' : st === 'current' ? 'rgba(207,129,80,0.35)' : 'var(--char)';
          return <span key={w.week} style={{ height: 8, borderRadius: 1, background: bg, border: st === 'current' ? '1px solid var(--copper)' : '1px solid var(--line)' }} />;
        })}
      </div>
      <p className="muted" style={{ fontSize: 14, marginTop: 6 }}>{done} of 11 weeks complete</p>
    </div>
  );
}

const PHASE_NOTES = {
  'Big Picture Pass': 'Read James straight through to see the flow of the story.',
  'Chapter by Chapter': 'Read slower, take in the Word reading throughout the same chapter multiple times in a week.',
  'Identifying & Living Out Themes': 'Re-read James, highlight & apply manhood themes.',
};

const STATUS_LABEL = { done: 'Complete', current: 'This week', upcoming: 'Upcoming', partial: 'Started', missed: 'Not journaled' };

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Server sync
// ---------------------------------------------------------------------------
const isServerId = (id) => /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(String(id || ''));
const deletesKey = (email) => `hear:deletes:${email.trim().toLowerCase()}`;

async function api(path, { method = 'GET', body, token } = {}) {
  let res;
  try {
    res = await fetch(`/api/${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    const err = new Error('You appear to be offline.');
    err.offline = true;
    throw err;
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Something went wrong. Try again.');
    err.status = res.status;
    throw err;
  }
  return data;
}

export default function HEARJournal() {
  const [user, setUser] = useState(() => readJSON(USER_KEY, null));
  const [entries, setEntries] = useState(() => {
    const u = readJSON(USER_KEY, null);
    return u ? loadEntries(u.email) : [];
  });
  const [view, setView] = useState(() => {
    const u = readJSON(USER_KEY, null);
    if (!u || !u.token) return 'welcome';
    return u.track ? 'home' : 'track';
  });
  const [draft, setDraft] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [weekNum, setWeekNum] = useState(null);
  const [notice, setNotice] = useState('');
  const [syncState, setSyncState] = useState('idle'); // idle | syncing | synced | offline
  const [showInstall, setShowInstall] = useState(false);
  const [installTip, setInstallTip] = useState(() => !isInstalled() && !readJSON('hear:installTipDismissed', false));

  const translation = (user && user.translation) || 'ESV';
  const today = todayLocal();
  const thisWeek = weekForDate(today);
  const token = user && user.token;
  const email = user && user.email;

  useEffect(() => {
    if (!notice) return undefined;
    const t = setTimeout(() => setNotice(''), 3200);
    return () => clearTimeout(t);
  }, [notice]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  const sorted = useMemo(
    () => [...entries].sort((a, b) => (b.date === a.date ? (b.created || 0) - (a.created || 0) : b.date.localeCompare(a.date))),
    [entries]
  );

  const thisWeekCount = entriesForWeek(entries, thisWeek).length;
  const pendingCount = entries.filter((e) => !isServerId(e.id) || e.pending).length;

  const saveUser = (next) => {
    setUser(next);
    if (next) writeJSON(USER_KEY, next);
  };

  const cache = (list, forEmail = email) => {
    if (forEmail) writeJSON(entriesKey(forEmail), list);
  };

  const expireSession = () => {
    const u = readJSON(USER_KEY, null);
    if (u) writeJSON(USER_KEY, { ...u, token: null });
    setUser((prev) => (prev ? { ...prev, token: null } : prev));
    setView('welcome');
    setNotice('Please sign in again.');
  };

  // Push anything saved offline, apply offline deletes, then pull the server copy.
  const sync = async (tok, forEmail, localList) => {
    setSyncState('syncing');
    try {
      const deletes = readJSON(deletesKey(forEmail), []);
      for (const id of deletes) {
        // eslint-disable-next-line no-await-in-loop
        await api(`entries?id=${encodeURIComponent(id)}`, { method: 'DELETE', token: tok }).catch((e) => {
          if (e.offline || e.status === 401) throw e;
        });
      }
      writeJSON(deletesKey(forEmail), []);

      let working = [...localList];
      for (const e of localList.filter((x) => !isServerId(x.id) || x.pending)) {
        const body = { ...e, id: isServerId(e.id) ? e.id : undefined };
        // eslint-disable-next-line no-await-in-loop
        const { entry } = await api('entries', { method: 'POST', body: { entry: body }, token: tok });
        working = working.map((x) => (x.id === e.id ? entry : x));
        cache(working, forEmail); // record each upload so a dropped connection can't duplicate it
      }

      const { entries: server } = await api('entries', { token: tok });
      setEntries(server);
      cache(server, forEmail);
      setSyncState('synced');
    } catch (e) {
      if (e.status === 401) { expireSession(); return; }
      setSyncState(e.offline ? 'offline' : 'idle');
      if (!e.offline) setNotice(e.message);
    }
  };

  // Sync when the app opens and whenever the phone comes back online
  useEffect(() => {
    if (!token) return undefined;
    sync(token, email, readJSON(entriesKey(email), []));
    const onOnline = () => sync(token, email, readJSON(entriesKey(email), []));
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, email]);

  // ---- actions
  const startNew = (num) => {
    setDraft(blankEntry(user.track, typeof num === 'number' ? num : undefined));
    setView('form');
  };

  const startEdit = (entry) => {
    setDraft({ ...entry });
    setView('form');
  };

  const saveDraft = async () => {
    if (!draft.passage.trim()) {
      setNotice('Add the passage you read.');
      return;
    }
    if (!STEPS.some((s) => draft[s.key].trim())) {
      setNotice('Write at least one part of H.E.A.R. before saving.');
      return;
    }
    const localId = draft.id || `local-${Date.now()}`;
    const record = { ...draft, id: localId, created: draft.created || Date.now(), pending: true };
    const optimistic = draft.id ? entries.map((e) => (e.id === draft.id ? record : e)) : [...entries, record];
    setEntries(optimistic);
    cache(optimistic);
    setDraft(null);
    setView(weekNum ? 'week' : 'home');

    try {
      const body = { ...record, id: isServerId(localId) ? localId : undefined };
      const { entry } = await api('entries', { method: 'POST', body: { entry: body }, token });
      setEntries((cur) => {
        const next = cur.map((e) => (e.id === localId ? entry : e));
        cache(next);
        return next;
      });
      setSyncState('synced');
      setNotice('Entry saved.');
    } catch (e) {
      if (e.status === 401) { expireSession(); return; }
      setSyncState(e.offline ? 'offline' : 'idle');
      setNotice(e.offline ? 'Saved on this phone. It will sync when you’re back online.' : `Saved on this phone, but not synced yet: ${e.message}`);
    }
  };

  const deleteEntry = async (id) => {
    if (!window.confirm('Delete this entry? This can’t be undone.')) return;
    const next = entries.filter((e) => e.id !== id);
    setEntries(next);
    cache(next);
    setOpenId(null);
    setView(weekNum ? 'week' : 'home');
    if (!isServerId(id)) { setNotice('Entry deleted.'); return; }
    try {
      await api(`entries?id=${encodeURIComponent(id)}`, { method: 'DELETE', token });
      setNotice('Entry deleted.');
    } catch (e) {
      if (e.status === 401) { expireSession(); return; }
      writeJSON(deletesKey(email), [...readJSON(deletesKey(email), []), id]);
      setNotice('Deleted here. It will be removed everywhere when you’re back online.');
    }
  };

  const signOut = () => {
    const warn = pendingCount
      ? `You have ${pendingCount} ${pendingCount === 1 ? 'entry' : 'entries'} not synced yet. Signing out now will lose ${pendingCount === 1 ? 'it' : 'them'}. Sign out anyway?`
      : 'Sign out of this device? Your entries are safe and will be here when you sign back in.';
    if (!window.confirm(warn)) return;
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(entriesKey(email));
    localStorage.removeItem(deletesKey(email));
    setUser(null);
    setEntries([]);
    setSyncState('idle');
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
  // WELCOME / SIGN IN
  // =========================================================================
  if (view === 'welcome' || !user || !user.token) {
    return (
      <Welcome
        initialEmail={(user && user.email) || ''}
        onSignedIn={(serverUser, tok) => {
          const prior = readJSON(USER_KEY, null);
          const keep = prior && prior.email === serverUser.email ? prior : {};
          const u = { track: null, translation: 'ESV', ...keep, name: serverUser.name, email: serverUser.email, token: tok };
          saveUser(u);
          setEntries(loadEntries(u.email));
          setView(u.track ? 'home' : 'track');
        }}
      />
    );
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
        <button className="btn btn-ghost btn-small" onClick={() => { setDraft(null); setView(weekNum ? 'week' : 'home'); }}>Back</button>

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
          <button className="btn btn-ghost btn-small" onClick={() => setView(weekNum ? 'week' : 'home')}>Back</button>
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

  const entryList = (list) => (
    <div style={{ display: 'grid', gap: 10 }}>
      {list.map((e) => (
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
  );

  const openWeek = (num) => { setWeekNum(num); setView('week'); };
  const goHome = () => { setWeekNum(null); setView('home'); };

  // =========================================================================
  // THE PLAN (all 11 weeks)
  // =========================================================================
  if (view === 'plan') {
    let lastPhase = '';
    return (
      <div className="shell">
        <button className="btn btn-ghost btn-small" onClick={goHome}>Back</button>
        <h1 className="display" style={{ fontSize: 48, margin: '22px 0 4px' }}>The Challenge</h1>
        <p className="muted" style={{ marginBottom: 16 }}>A week is checked off when you journal at least twice.</p>
        <div style={{ marginBottom: 24 }}><ProgressBar entries={entries} today={today} /></div>

        {WEEKS.map((w) => {
          const st = weekStatus(entries, w, today);
          const header = w.phase !== lastPhase ? w.phase : null;
          lastPhase = w.phase;
          const done = st.key === 'done';
          const current = today >= w.start && today <= w.end;
          return (
            <React.Fragment key={w.week}>
              {header && (
                <div style={{ margin: '22px 0 10px' }}>
                  <div className="ruled tracked" style={{ fontSize: 12 }}>{header}</div>
                  <p className="muted" style={{ fontSize: 14, textAlign: 'center', marginTop: 6 }}>{PHASE_NOTES[header]}</p>
                </div>
              )}
              <button className="panel entry-card" style={{ marginBottom: 8, display: 'flex', gap: 14, alignItems: 'center', borderColor: current ? 'var(--copper)' : undefined }}
                onClick={() => openWeek(w.week)} aria-label={`Week ${w.week}, ${w.passage}, ${STATUS_LABEL[st.key]}`}>
                <span aria-hidden="true" style={{ width: 30, height: 30, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--rust)', borderRadius: 2, background: done ? 'var(--rust)' : 'transparent', color: done ? '#fbf6ef' : 'var(--copper)', fontFamily: 'var(--display)', fontSize: 20, paddingTop: 2 }}>
                  {done ? '✓' : w.week}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span className="display" style={{ fontSize: 24, display: 'block' }}>{w.passage} <span className="display-rust" style={{ fontSize: 20 }}>{w.theme}</span></span>
                  <span className="muted" style={{ fontSize: 14 }}>
                    {formatDate(w.start, { month: 'short', day: 'numeric' })} – {formatDate(w.end, { month: 'short', day: 'numeric' })} · {STATUS_LABEL[st.key]}{st.count && !done ? ` (${st.count} of ${goalFor(w)})` : ''}
                  </span>
                </span>
              </button>
            </React.Fragment>
          );
        })}

        <div className="panel-framed" style={{ padding: '14px 16px', marginTop: 18 }}>
          <div className="display display-rust" style={{ fontSize: 24 }}>Saturday, Dec 5</div>
          <p>Final Brotherhood Challenge gathering. Celebrate, and encourage one another with the theme that shaped you most.</p>
        </div>
      </div>
    );
  }

  // =========================================================================
  // ONE WEEK
  // =========================================================================
  if (view === 'week' && weekNum) {
    const w = WEEKS.find((x) => x.week === weekNum);
    const list = sorted.filter((e) => entriesForWeek([e], w).length);
    const prev = WEEKS.find((x) => x.week === weekNum - 1);
    const next = WEEKS.find((x) => x.week === weekNum + 1);
    return (
      <div className="shell">
        {toast}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 18 }}>
          <button className="btn btn-ghost btn-small" onClick={() => setView('plan')}>All weeks</button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-small" disabled={!prev} style={{ opacity: prev ? 1 : 0.35 }} onClick={() => prev && setWeekNum(prev.week)} aria-label="Previous week">‹ Wk {prev ? prev.week : ''}</button>
            <button className="btn btn-ghost btn-small" disabled={!next} style={{ opacity: next ? 1 : 0.35 }} onClick={() => next && setWeekNum(next.week)} aria-label="Next week">Wk {next ? next.week : ''} ›</button>
          </div>
        </div>
        <WeekCard w={w} count={list.length} isCurrent={today >= w.start && today <= w.end} translation={translation} onJournal={() => startNew(w.week)} />
        <h2 className="display" style={{ fontSize: 30, margin: '8px 0 12px' }}>Week {w.week} entries</h2>
        {list.length ? entryList(list) : <div className="panel" style={{ padding: 20 }}><p>No entries for this week yet.</p></div>}
        <button className="btn btn-ghost btn-small" style={{ marginTop: 20 }} onClick={goHome}>Home</button>
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

      {showInstall && <InstallGuide onClose={() => setShowInstall(false)} />}

      {installTip && (
        <div className="panel-framed" style={{ padding: '12px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <p style={{ flex: 1, fontSize: 15 }}>Put H.E.A.R. on your home screen so it’s one tap away.</p>
          <button className="btn btn-primary btn-small" style={{ width: 'auto' }} onClick={() => setShowInstall(true)}>Show me</button>
          <button className="btn btn-ghost btn-small" aria-label="Dismiss" onClick={() => { setInstallTip(false); writeJSON('hear:installTipDismissed', true); }}>✕</button>
        </div>
      )}

      {user.track === 'challenge' && (
        <>
          <button className="panel entry-card" style={{ marginBottom: 14, padding: '14px 16px' }} onClick={() => setView('plan')}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <span className="display" style={{ fontSize: 22 }}>Your challenge progress</span>
              <span className="label copper" style={{ fontSize: 14 }}>See all weeks ›</span>
            </div>
            <ProgressBar entries={entries} today={today} />
          </button>
          <WeekCard w={thisWeek} count={thisWeekCount} isCurrent={today >= thisWeek.start && today <= thisWeek.end} translation={translation} onJournal={() => startNew(thisWeek.week)} />
        </>
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
      ) : entryList(sorted)}

      <footer style={{ marginTop: 36, display: 'grid', gap: 16 }}>
        <TranslationPicker value={translation} onChange={(t) => saveUser({ ...user, translation: t })} />
        {!isInstalled() && (
          <p style={{ fontSize: 14 }}>
            <button className="link" style={{ background: 'none', border: 0, padding: 0, font: 'inherit' }} onClick={() => setShowInstall(true)}>Add H.E.A.R. to your home screen</button>
          </p>
        )}
        <p className="muted" style={{ fontSize: 14 }}>
          {syncState === 'syncing' && 'Syncing… '}
          {syncState !== 'syncing' && pendingCount > 0 && `${pendingCount} ${pendingCount === 1 ? 'entry' : 'entries'} waiting to sync. `}
          {syncState !== 'syncing' && pendingCount === 0 && 'Synced to your account. Sign in on any device to see your entries. '}
          <button className="link" style={{ background: 'none', border: 0, padding: 0, font: 'inherit' }} onClick={downloadJournal}>Download a copy</button>
        </p>
        <p className="muted" style={{ fontSize: 14 }}>
          Switch to <button className="link" style={{ background: 'none', border: 0, padding: 0, font: 'inherit' }} onClick={() => setView('track')}>{user.track === 'challenge' ? 'journaling on your own' : 'the Challenge plan'}</button>
        </p>
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Welcome + sign in: the Field Guide cover is the hero
// ---------------------------------------------------------------------------
function PinInput({ id, value, onChange, autoFocus }) {
  return (
    <input
      id={id}
      className="field"
      style={{ marginTop: 6, letterSpacing: '0.6em', fontSize: 26, textAlign: 'center', fontFamily: 'var(--display)' }}
      type="password"
      inputMode="numeric"
      pattern="[0-9]*"
      autoComplete="off"
      maxLength={4}
      autoFocus={autoFocus}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
    />
  );
}

function Welcome({ initialEmail, onSignedIn }) {
  const [step, setStep] = useState('email'); // email | pin | create
  const [email, setEmail] = useState(initialEmail || '');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (fn) => {
    setBusy(true);
    setError('');
    try { await fn(); } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  const submitEmail = (ev) => {
    ev.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setError('Enter a valid email.'); return; }
    run(async () => {
      const r = await api('auth', { method: 'POST', body: { action: 'check', email } });
      setPin('');
      setPin2('');
      if (r.exists && r.hasPin) setStep('pin');
      else { setName(r.name || ''); setStep('create'); }
    });
  };

  const submitPin = (ev) => {
    ev.preventDefault();
    if (pin.length !== 4) { setError('Enter your 4-digit PIN.'); return; }
    run(async () => {
      const r = await api('auth', { method: 'POST', body: { action: 'signin', email, pin } });
      onSignedIn(r.user, r.token);
    });
  };

  const submitCreate = (ev) => {
    ev.preventDefault();
    if (!name.trim()) { setError('Enter your first name.'); return; }
    if (pin.length !== 4) { setError('Choose a 4-digit PIN.'); return; }
    if (pin !== pin2) { setError('The two PINs don’t match.'); return; }
    run(async () => {
      const r = await api('auth', { method: 'POST', body: { action: 'signin', email, pin, name } });
      onSignedIn(r.user, r.token);
    });
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      <div style={{ maxWidth: 520, margin: '0 auto', position: 'relative' }}>
        <img src="/cover.jpg" alt="The Brotherhood Challenge. Real Manhood: Built to Last. Field Guide, the Book of James." style={{ width: '100%', display: 'block' }} />
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 120, background: 'linear-gradient(transparent, var(--ink))' }} />
      </div>
      <div className="shell" style={{ paddingTop: 8, maxWidth: 520 }}>
        <div className="ruled tracked" style={{ fontSize: 14, marginBottom: 18 }}>H.E.A.R. Journal</div>

        {step === 'email' && (
          <form onSubmit={submitEmail} noValidate style={{ display: 'grid', gap: 14 }}>
            <label>
              <span className="label">Email</span>
              <input className="field" style={{ marginTop: 6 }} type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            {error && <p role="alert" className="copper" style={{ fontSize: 15 }}>{error}</p>}
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Checking…' : 'Continue'}</button>
          </form>
        )}

        {step === 'pin' && (
          <form onSubmit={submitPin} noValidate style={{ display: 'grid', gap: 14 }}>
            <p className="muted" style={{ fontSize: 15 }}>{email}</p>
            <label htmlFor="pin">
              <span className="label">Your 4-digit PIN</span>
              <PinInput id="pin" value={pin} onChange={setPin} autoFocus />
            </label>
            {error && <p role="alert" className="copper" style={{ fontSize: 15 }}>{error}</p>}
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
            <p className="muted" style={{ fontSize: 14 }}>Forgot your PIN? Ask a Brotherhood leader to reset it, then sign in and choose a new one.</p>
            <button type="button" className="link" style={{ background: 'none', border: 0, padding: 0, font: 'inherit', justifySelf: 'start' }} onClick={() => { setStep('email'); setError(''); }}>Use a different email</button>
          </form>
        )}

        {step === 'create' && (
          <form onSubmit={submitCreate} noValidate style={{ display: 'grid', gap: 14 }}>
            <p className="muted" style={{ fontSize: 15 }}>Setting up {email}</p>
            <label>
              <span className="label">First name</span>
              <input className="field" style={{ marginTop: 6 }} autoComplete="given-name" value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label htmlFor="newpin">
              <span className="label">Choose a 4-digit PIN</span>
              <PinInput id="newpin" value={pin} onChange={setPin} />
            </label>
            <label htmlFor="newpin2">
              <span className="label">Enter it again</span>
              <PinInput id="newpin2" value={pin2} onChange={setPin2} />
            </label>
            {error && <p role="alert" className="copper" style={{ fontSize: 15 }}>{error}</p>}
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Setting up…' : 'Start journaling'}</button>
            <p className="muted" style={{ fontSize: 14 }}>You’ll use this email and PIN to see your journal on any phone or computer. Your entries are encrypted and stored under an anonymous member key, so no one browsing the Brotherhood’s records can read them or tell they’re yours.</p>
            <button type="button" className="link" style={{ background: 'none', border: 0, padding: 0, font: 'inherit', justifySelf: 'start' }} onClick={() => { setStep('email'); setError(''); }}>Use a different email</button>
          </form>
        )}

        <p className="muted" style={{ fontSize: 14, textAlign: 'center', marginTop: 22 }}>Sept 20 – Dec 5, 2026 · Heritage Church Brotherhood</p>
      </div>
    </div>
  );
}
