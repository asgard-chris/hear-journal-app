// GET    /api/entries            -> { entries }
// POST   /api/entries  {entry}   -> { entry }   (create, or update when entry.id is a Notion id)
// DELETE /api/entries?id=...     -> { ok }
//
// Entries carry only the man's Member Key, never his name, email, or a link to Users.
// The four H.E.A.R. answers are encrypted when ENTRY_ENCRYPTION_KEY is set.
const { httpError, notion, queryAll, toRich, readProp, schema, readToken, handler, seal, unseal } = require('./_lib');

const NOTION_ID = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;
const FIELDS = ['highlight', 'explain', 'apply', 'respond'];

function toEntry(s, page) {
  const e = s.entry;
  const out = {
    id: page.id,
    date: readProp(page, e.date) || page.created_time.slice(0, 10),
    week: readProp(page, 'Week') || '',
    passage: readProp(page, 'Passage') || '',
    created: Date.parse(page.created_time),
  };
  FIELDS.forEach((f) => { out[f] = unseal(readProp(page, e[f]) || ''); });
  return out;
}

function toProps(s, key, entry) {
  const e = s.entry;
  const passage = String(entry.passage || '').slice(0, 200);
  const props = {
    [e.title]: { title: toRich(`${key} · ${entry.date}`) },
    'Member Key': { rich_text: toRich(key) },
    [e.date]: { date: { start: entry.date } },
    Week: { number: entry.week ? Number(entry.week) : null },
    Passage: { rich_text: toRich(passage) },
  };
  FIELDS.forEach((f) => { props[e[f]] = { rich_text: toRich(seal(entry[f])) }; });
  return props;
}

async function ownedPage(key, id) {
  if (!NOTION_ID.test(String(id || ''))) throw httpError(400, 'Unknown entry.');
  const page = await notion(`/pages/${id}`);
  if (page.archived || readProp(page, 'Member Key') !== key) throw httpError(404, 'Entry not found.');
  return page;
}

module.exports = handler(async (req) => {
  const { key } = readToken(req);
  if (!key) throw httpError(401, 'Please sign in again.');
  const s = await schema();

  if (req.method === 'GET') {
    const pages = await queryAll(s.entriesId, { property: 'Member Key', rich_text: { equals: key } });
    return { entries: pages.map((p) => toEntry(s, p)) };
  }

  if (req.method === 'POST') {
    const entry = (req.body && req.body.entry) || {};
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(entry.date || ''))) throw httpError(400, 'Entry needs a date.');
    if (entry.id && NOTION_ID.test(entry.id)) {
      await ownedPage(key, entry.id);
      const page = await notion(`/pages/${entry.id}`, 'PATCH', { properties: toProps(s, key, entry) });
      return { entry: toEntry(s, page) };
    }
    const page = await notion('/pages', 'POST', { parent: { database_id: s.entriesId }, properties: toProps(s, key, entry) });
    return { entry: toEntry(s, page) };
  }

  if (req.method === 'DELETE') {
    const id = req.query && req.query.id;
    await ownedPage(key, id);
    await notion(`/pages/${id}`, 'PATCH', { archived: true });
    return { ok: true };
  }

  throw httpError(405, 'Method not allowed.');
});
