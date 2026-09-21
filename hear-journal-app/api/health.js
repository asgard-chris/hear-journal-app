// GET /api/health -> confirms env vars and Notion access, without exposing any data
const { schema, handler, encKey } = require('./_lib');

module.exports = handler(async () => {
  const s = await schema();
  const missing = Object.entries({ ...s.user, ...s.entry }).filter(([k, v]) => !v && k !== 'joined').map(([k]) => k);
  const encrypted = !!encKey();
  return { ok: missing.length === 0, notion: 'connected', entryEncryption: encrypted ? 'on' : 'OFF — add ENTRY_ENCRYPTION_KEY', missingFields: missing };
});
