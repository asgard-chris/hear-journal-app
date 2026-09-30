// Shared helpers for the H.E.A.R. Journal API (files starting with _ are not routes on Vercel)
const crypto = require('crypto');

const NOTION_VERSION = '2022-06-28';

// The rooms. OPEN_GROUP is where everyone starts; add small groups to this list as they form.
const OPEN_GROUP = 'Open Discussion';
const GROUPS = [OPEN_GROUP, 'Nate · Tuesdays 6:30pm'];
const ALL_GROUPS = 'ALL'; // church-wide announcements from a pastor or admin
const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;
const SESSION_DAYS = 180;

function env(name) {
  const v = process.env[name];
  if (!v) throw httpError(500, `Server setup incomplete: missing ${name} in Vercel environment variables.`);
  return v;
}

function httpError(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

async function notion(path, method = 'GET', body) {
  const res = await fetch(`https://api.notion.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${env('NOTION_TOKEN')}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data && data.message ? data.message : `Notion error ${res.status}`;
    const e = httpError(res.status === 404 ? 502 : 502, `Notion: ${msg}`);
    e.notionStatus = res.status;
    throw e;
  }
  return data;
}

async function queryAll(dbId, filter) {
  const out = [];
  let cursor;
  do {
    const body = { page_size: 100 };
    if (filter) body.filter = filter;
    if (cursor) body.start_cursor = cursor;
    // eslint-disable-next-line no-await-in-loop
    const data = await notion(`/databases/${dbId}/query`, 'POST', body);
    out.push(...data.results);
    cursor = data.has_more ? data.next_cursor : null;
  } while (cursor);
  return out;
}

// ---------- rich text in/out (Notion caps each text chunk at 2000 chars)
function toRich(text) {
  const s = String(text || '');
  if (!s) return [];
  const chunks = [];
  for (let i = 0; i < s.length && chunks.length < 100; i += 1900) {
    chunks.push({ type: 'text', text: { content: s.slice(i, i + 1900) } });
  }
  return chunks;
}
const fromRich = (arr) => (arr || []).map((t) => t.plain_text || (t.text && t.text.content) || '').join('');

function readProp(page, name) {
  const p = page.properties[name];
  if (!p) return undefined;
  switch (p.type) {
    case 'title': return fromRich(p.title);
    case 'rich_text': return fromRich(p.rich_text);
    case 'number': return p.number;
    case 'email': return p.email;
    case 'date': return p.date ? p.date.start : null;
    case 'relation': return (p.relation || []).map((r) => r.id);
    default: return undefined;
  }
}

// ---------- schema discovery + self-setup
let schemaCache = null;

function findProp(props, test) {
  return Object.keys(props).find((k) => test(k, props[k]));
}

async function schema() {
  if (schemaCache) return schemaCache;
  const usersId = env('NOTION_USERS_DB');
  const entriesId = env('NOTION_ENTRIES_DB');

  let users = await notion(`/databases/${usersId}`);
  let entries = await notion(`/databases/${entriesId}`);

  // Add the fields the app needs if they aren't there yet. Never changes existing fields.
  const addUsers = {};
  if (!users.properties['PIN Hash']) addUsers['PIN Hash'] = { rich_text: {} };
  if (!users.properties['Failed PIN Attempts']) addUsers['Failed PIN Attempts'] = { number: {} };
  if (!users.properties['PIN Locked Until']) addUsers['PIN Locked Until'] = { date: {} };
  if (!findProp(users.properties, (k, p) => p.type === 'email')) addUsers.Email = { email: {} };
  if (!users.properties['Member Key']) addUsers['Member Key'] = { rich_text: {} };
  if (Object.keys(addUsers).length) users = await notion(`/databases/${usersId}`, 'PATCH', { properties: addUsers });

  const addEntries = {};
  if (!entries.properties['Member Key']) addEntries['Member Key'] = { rich_text: {} };
  if (!entries.properties.Week) addEntries.Week = { number: {} };
  if (!entries.properties.Passage) addEntries.Passage = { rich_text: {} };
  if (!findProp(entries.properties, (k, p) => p.type === 'date')) addEntries['Date Created'] = { date: {} };
  const heard = { Highlight: 'Highlight (H)', Explain: 'Explain (E)', Apply: 'Apply (A)', Respond: 'Respond (R)' };
  Object.entries(heard).forEach(([word, full]) => {
    if (!findProp(entries.properties, (k) => k.toLowerCase().startsWith(word.toLowerCase()))) addEntries[full] = { rich_text: {} };
  });
  if (Object.keys(addEntries).length) entries = await notion(`/databases/${entriesId}`, 'PATCH', { properties: addEntries });

  // Users also carry small-group assignment (set by hand in Notion)
  if (!users.properties['Small Group']) {
    const add = { 'Small Group': { rich_text: {} } };
    users = await notion(`/databases/${usersId}`, 'PATCH', { properties: add });
  }

  // Message board is optional: it only exists when NOTION_POSTS_DB is configured
  const postsId = process.env.NOTION_POSTS_DB || null;
  let postsTitle = null;
  if (postsId) {
    let posts = await notion(`/databases/${postsId}`);
    const addPosts = {};
    const want = {
      'Member Key': { rich_text: {} },
      'Display Name': { rich_text: {} },
      Group: { rich_text: {} },
      Week: { number: {} },
      Body: { rich_text: {} },
      'Video URL': { url: {} },
      'Parent Post': { rich_text: {} },
      Status: { rich_text: {} },
      Flags: { number: {} },
      Likes: { number: {} },
      'Liked By': { rich_text: {} },
      'Allow Replies': { rich_text: {} },
      'Moderated By': { rich_text: {} },
      'Edited At': { date: {} },
    };
    Object.entries(want).forEach(([k, v]) => { if (!posts.properties[k]) addPosts[k] = v; });
    if (Object.keys(addPosts).length) posts = await notion(`/databases/${postsId}`, 'PATCH', { properties: addPosts });
    postsTitle = findProp(posts.properties, (k, pr) => pr.type === 'title');
  }

  const up = users.properties;
  const ep = entries.properties;
  const startsWith = (w) => findProp(ep, (k) => k.toLowerCase().startsWith(w));

  schemaCache = {
    usersId,
    entriesId,
    postsId,
    postsTitle,
    user: {
      title: findProp(up, (k, p) => p.type === 'title'),
      role: findProp(up, (k) => /^role$/i.test(k)),
      email: findProp(up, (k, p) => p.type === 'email'),
      joined: findProp(up, (k, p) => p.type === 'date' && /join/i.test(k)),
    },
    entry: {
      title: findProp(ep, (k, p) => p.type === 'title'),
      date: findProp(ep, (k, p) => p.type === 'date' && /date/i.test(k)) || findProp(ep, (k, p) => p.type === 'date'),
      highlight: startsWith('highlight'),
      explain: startsWith('explain'),
      apply: startsWith('apply'),
      respond: startsWith('respond'),
    },
  };
  return schemaCache;
}

// Who is this signed-in man? Read fresh so group and role changes take effect right away.
async function loadUser(uid) {
  const s = await schema();
  const page = await notion(`/pages/${uid}`);
  const roleRaw = String((s.user.role && readProp(page, s.user.role)) || (page.properties.Role && page.properties.Role.select && page.properties.Role.select.name) || '');
  return {
    id: page.id,
    key: readProp(page, 'Member Key') || '',
    name: readProp(page, s.user.title) || '',
    group: ((readProp(page, 'Small Group') || '').trim()) || OPEN_GROUP,
    role: roleRaw.toLowerCase(),
  };
}

const canModerate = (u) => u.role === 'facilitator' || u.role === 'admin' || u.role === 'leader' || u.role === 'pastor';
const isAdmin = (u) => u.role === 'admin' || u.role === 'pastor';

// Which rooms may this man post into?
function roomsFor(u) {
  const rooms = [OPEN_GROUP];
  if (u.group && u.group !== OPEN_GROUP && GROUPS.includes(u.group)) rooms.push(u.group);
  return rooms;
}

// ---------- member keys: random, not derived from name or email
const KEY_ALPHABET = 'ABCDEFGHJKMNPQRSTVWXYZ23456789';
function newMemberKey() {
  const bytes = crypto.randomBytes(8);
  let out = '';
  for (let i = 0; i < 8; i += 1) out += KEY_ALPHABET[bytes[i] % KEY_ALPHABET.length];
  return `HB-${out}`;
}

// ---------- entry encryption (AES-256-GCM). Stored as "enc1:<base64 iv|tag|ciphertext>"
function encKey() {
  const hex = process.env.ENTRY_ENCRYPTION_KEY;
  if (!hex) return null;
  const key = Buffer.from(hex, 'hex');
  if (key.length !== 32) throw httpError(500, 'Server setup: ENTRY_ENCRYPTION_KEY must be 64 hex characters.');
  return key;
}

function seal(text) {
  const s = String(text || '');
  const key = encKey();
  if (!s || !key) return s;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([cipher.update(s, 'utf8'), cipher.final()]);
  return `enc1:${Buffer.concat([iv, cipher.getAuthTag(), ct]).toString('base64')}`;
}

function unseal(text) {
  const s = String(text || '');
  if (!s.startsWith('enc1:')) return s;
  const key = encKey();
  if (!key) throw httpError(500, 'Server setup: entries are encrypted but ENTRY_ENCRYPTION_KEY is missing.');
  const raw = Buffer.from(s.slice(5), 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, raw.subarray(0, 12));
  decipher.setAuthTag(raw.subarray(12, 28));
  try {
    return Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString('utf8');
  } catch (e) {
    throw httpError(500, 'Server setup: could not unlock an entry. ENTRY_ENCRYPTION_KEY may have changed.');
  }
}

// ---------- PIN hashing
function hashPin(pin) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(pin), salt, 32).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

function checkPin(pin, stored) {
  const [, salt, hash] = String(stored || '').split(':');
  if (!salt || !hash) return false;
  const test = crypto.scryptSync(String(pin), salt, 32);
  const want = Buffer.from(hash, 'hex');
  return want.length === test.length && crypto.timingSafeEqual(want, test);
}

// ---------- session tokens (signed, no database needed)
const b64 = (buf) => Buffer.from(buf).toString('base64url');

function signToken(payload) {
  const body = b64(JSON.stringify({ ...payload, exp: Date.now() + SESSION_DAYS * 864e5 }));
  const sig = b64(crypto.createHmac('sha256', env('SESSION_SECRET')).update(body).digest());
  return `${body}.${sig}`;
}

function readToken(req) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  const [body, sig] = token.split('.');
  if (!body || !sig) throw httpError(401, 'Please sign in again.');
  const want = b64(crypto.createHmac('sha256', env('SESSION_SECRET')).update(body).digest());
  if (want.length !== sig.length || !crypto.timingSafeEqual(Buffer.from(want), Buffer.from(sig))) throw httpError(401, 'Please sign in again.');
  let data;
  try { data = JSON.parse(Buffer.from(body, 'base64url').toString()); } catch (e) { throw httpError(401, 'Please sign in again.'); }
  if (!data.exp || data.exp < Date.now()) throw httpError(401, 'Your session expired. Please sign in again.');
  return data;
}

function handler(fn) {
  return async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    try {
      const out = await fn(req, res);
      res.status(200).json(out);
    } catch (e) {
      const status = e.status || 500;
      if (status >= 500) console.error(e);
      res.status(status).json({ error: e.message || 'Something went wrong.' });
    }
  };
}

module.exports = {
  MAX_ATTEMPTS, LOCK_MINUTES, env, httpError, notion, queryAll, toRich, fromRich, readProp,
  schema, hashPin, checkPin, signToken, readToken, handler, newMemberKey, seal, unseal, encKey,
  loadUser, canModerate, isAdmin, roomsFor, fromRich, GROUPS, OPEN_GROUP, ALL_GROUPS,
};
