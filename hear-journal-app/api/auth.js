// POST /api/auth
//   { action: 'check', email }                      -> { exists, hasPin }
//   { action: 'signin', email, pin, name? }         -> { token, user }
const {
  MAX_ATTEMPTS, LOCK_MINUTES, httpError, notion, queryAll, toRich, readProp,
  schema, hashPin, checkPin, signToken, handler, newMemberKey,
} = require('./_lib');

const cleanEmail = (e) => String(e || '').trim().toLowerCase();

async function findUser(s, email) {
  const rows = await queryAll(s.usersId, { property: s.user.email, email: { equals: email } });
  return rows[0] || null;
}

module.exports = handler(async (req) => {
  if (req.method !== 'POST') throw httpError(405, 'Use POST.');
  const { action, pin, name } = req.body || {};
  const email = cleanEmail(req.body && req.body.email);
  if (!/^\S+@\S+\.\S+$/.test(email)) throw httpError(400, 'Enter a valid email.');

  const s = await schema();
  const user = await findUser(s, email);

  if (action === 'check') {
    return { exists: !!user, hasPin: !!(user && readProp(user, 'PIN Hash')), name: user ? readProp(user, s.user.title) : null };
  }

  if (action !== 'signin') throw httpError(400, 'Unknown action.');
  if (!/^\d{4}$/.test(String(pin || ''))) throw httpError(400, 'Your PIN is 4 digits.');

  // New man: create his record with the PIN he chose
  if (!user) {
    const memberKey = newMemberKey();
    const first = String(name || '').trim();
    if (!first) throw httpError(400, 'Enter your first name.');
    const props = {
      [s.user.title]: { title: toRich(first) },
      [s.user.email]: { email },
      'PIN Hash': { rich_text: toRich(hashPin(pin)) },
      'Failed PIN Attempts': { number: 0 },
      'Member Key': { rich_text: toRich(memberKey) },
    };
    if (s.user.joined) props[s.user.joined] = { date: { start: new Date().toISOString().slice(0, 10) } };
    const created = await notion('/pages', 'POST', { parent: { database_id: s.usersId }, properties: props });
    return { token: signToken({ uid: created.id, key: memberKey }), user: { name: first, email } };
  }

  const displayName = readProp(user, s.user.title) || String(name || '').trim() || email;
  let memberKey = readProp(user, 'Member Key');
  if (!memberKey) {
    memberKey = newMemberKey();
    await notion(`/pages/${user.id}`, 'PATCH', { properties: { 'Member Key': { rich_text: toRich(memberKey) } } });
  }
  const stored = readProp(user, 'PIN Hash');

  // Existing record with no PIN yet (pre-added by a leader, or PIN reset): this PIN becomes his
  if (!stored) {
    await notion(`/pages/${user.id}`, 'PATCH', {
      properties: { 'PIN Hash': { rich_text: toRich(hashPin(pin)) }, 'Failed PIN Attempts': { number: 0 }, 'PIN Locked Until': { date: null } },
    });
    return { token: signToken({ uid: user.id, key: memberKey }), user: { name: displayName, email } };
  }

  const lockedUntil = readProp(user, 'PIN Locked Until');
  if (lockedUntil && new Date(lockedUntil) > new Date()) {
    throw httpError(429, `Too many wrong tries. Try again after ${new Date(lockedUntil).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Chicago' })}.`);
  }

  if (!checkPin(pin, stored)) {
    const fails = (readProp(user, 'Failed PIN Attempts') || 0) + 1;
    const props = { 'Failed PIN Attempts': { number: fails >= MAX_ATTEMPTS ? 0 : fails } };
    if (fails >= MAX_ATTEMPTS) props['PIN Locked Until'] = { date: { start: new Date(Date.now() + LOCK_MINUTES * 60000).toISOString() } };
    await notion(`/pages/${user.id}`, 'PATCH', { properties: props });
    const left = MAX_ATTEMPTS - fails;
    throw httpError(401, left > 0 ? `That PIN doesn’t match. ${left} ${left === 1 ? 'try' : 'tries'} left.` : `Too many wrong tries. Wait ${LOCK_MINUTES} minutes and try again.`);
  }

  if (readProp(user, 'Failed PIN Attempts')) {
    await notion(`/pages/${user.id}`, 'PATCH', { properties: { 'Failed PIN Attempts': { number: 0 }, 'PIN Locked Until': { date: null } } });
  }
  return { token: signToken({ uid: user.id, key: memberKey }), user: { name: displayName, email } };
});
