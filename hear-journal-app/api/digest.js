// Weekly digest for Brotherhood leaders.
//   /api/digest?key=DIGEST_KEY           -> renders the digest as a web page (sends nothing)
//   /api/digest?key=DIGEST_KEY&send=1    -> renders it AND emails it
//   Vercel cron calls it daily with the CRON_SECRET header; only Sunday actually sends.
//
// Counts only. No names, no member keys, and no journal text is read or decrypted.
const { httpError, queryAll, readProp, schema, handler, GROUPS, ALL_GROUPS } = require('./_lib');

const WEEKS = [
  { week: 1, start: '2026-09-20', end: '2026-09-26', passage: 'James 1–5', theme: 'Faith that Works', focus: 'Identify what real, active faith looks like in your life.' },
  { week: 2, start: '2026-09-27', end: '2026-10-03', passage: 'James 1', theme: 'Trials & Discipline', focus: 'How God builds strength through pressure.' },
  { week: 3, start: '2026-10-04', end: '2026-10-10', passage: 'James 2', theme: 'Faith in Action', focus: 'Living out belief through actions.' },
  { week: 4, start: '2026-10-11', end: '2026-10-17', passage: 'James 3', theme: 'Words & Wisdom', focus: 'Controlling Speech and choosing wisdom.' },
  { week: 5, start: '2026-10-18', end: '2026-10-24', passage: 'James 4', theme: 'Humility & Surrender', focus: 'Letting go of pride and submitting to God.' },
  { week: 6, start: '2026-10-25', end: '2026-10-31', passage: 'James 5', theme: 'Endurance & Prayer', focus: 'Staying steady and relying on prayer.' },
  { week: 7, start: '2026-11-01', end: '2026-11-07', passage: 'James 1–2', theme: 'Integrity in Faith', focus: 'Aligning belief with behavior.' },
  { week: 8, start: '2026-11-08', end: '2026-11-14', passage: 'James 3–4', theme: 'Mature Manhood', focus: 'Wisdom, humility, and perseverance.' },
  { week: 9, start: '2026-11-15', end: '2026-11-21', passage: 'James 5', theme: 'Finishing Strong', focus: 'What does endurance, patience, and faithful prayer look like in your daily life.' },
  { week: 10, start: '2026-11-22', end: '2026-11-28', passage: 'No reading', theme: 'Thanksgiving Break', focus: 'Pause, reflect, and practice gratitude.' },
  { week: 11, start: '2026-11-29', end: '2026-12-04', passage: 'James 1–5', theme: 'Final Immersion', focus: 'Read the full book again; focus on what stands out most and apply it daily.' },
];

const CHICAGO = 'America/Chicago';
const ymdChicago = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: CHICAGO, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
const weekdayChicago = (d) => new Intl.DateTimeFormat('en-US', { timeZone: CHICAGO, weekday: 'short' }).format(d);

function weekFor(ymd) {
  if (ymd < WEEKS[0].start) return WEEKS[0];
  return WEEKS.find((w) => ymd >= w.start && ymd <= w.end) || WEEKS[WEEKS.length - 1];
}

const fmt = (ymd) => new Date(`${ymd}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

async function gather() {
  const s = await schema();
  const today = ymdChicago(new Date());
  const wk = weekFor(today);
  const next = WEEKS.find((w) => w.week === wk.week + 1) || null;
  const since = new Date(Date.now() - 7 * 864e5).toISOString();

  const users = await queryAll(s.usersId);
  const entries = await queryAll(s.entriesId);

  // Participation counted by member key only — never resolved to a person
  const perKey = {};
  entries.forEach((p) => {
    const w = readProp(p, 'Week');
    const d = readProp(p, s.entry.date) || p.created_time.slice(0, 10);
    const inWeek = w ? Number(w) === wk.week : (d >= wk.start && d <= wk.end);
    if (!inWeek) return;
    const key = readProp(p, 'Member Key') || 'unknown';
    perKey[key] = (perKey[key] || 0) + 1;
  });
  const counts = Object.values(perKey);
  const twice = counts.filter((n) => n >= 2).length;
  const once = counts.filter((n) => n === 1).length;

  const data = {
    week: wk,
    next,
    newUsers: users.filter((p) => p.created_time >= since).length,
    totalUsers: users.length,
    newEntries: entries.filter((p) => p.created_time >= since).length,
    totalEntries: entries.length,
    twice,
    once,
    none: Math.max(0, users.length - twice - once),
    groups: null,
    videos: 0,
  };

  if (s.postsId) {
    const posts = await queryAll(s.postsId, { property: 'Week', number: { equals: wk.week } });
    const live = posts.filter((p) => (readProp(p, 'Status') || 'Visible').trim() !== 'Removed');
    data.groups = [...GROUPS, ALL_GROUPS].map((g) => {
      const mine = live.filter((p) => (readProp(p, 'Group') || '') === g);
      return {
        group: g === ALL_GROUPS ? 'Church-wide messages' : g,
        posts: mine.filter((p) => !readProp(p, 'Parent Post')).length,
        replies: mine.filter((p) => readProp(p, 'Parent Post')).length,
      };
    }).filter((r) => r.posts || r.replies);
    data.videos = live.filter((p) => p.properties['Video URL'] && p.properties['Video URL'].url).length;
  }
  return data;
}

const card = (n, label, accent) => `<td width="50%" style="padding:0 8px 16px 0;">
  <div style="border:1px solid #e3dacd;border-radius:5px;padding:16px;">
    <div style="font-size:34px;font-weight:700;color:${accent};line-height:1;">${n}</div>
    <div style="font-size:13px;color:#5e564e;margin-top:6px;">${label}</div>
  </div></td>`;

const row = (l, r) => `<tr><td style="padding:9px 0;border-bottom:1px solid #efe9e0;">${l}</td>
  <td align="right" style="padding:9px 0;border-bottom:1px solid #efe9e0;font-weight:700;">${r}</td></tr>`;

function render(d, appUrl) {
  const board = d.groups && d.groups.length ? `
    <tr><td style="padding:20px 28px 4px;">
      <div style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#9a4f2b;font-weight:700;border-top:1px solid #e3dacd;padding-top:18px;">Group board</div>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="font-size:15px;color:#2b2724;margin-top:10px;">
        ${d.groups.map((g) => row(g.group, `${g.posts} post${g.posts === 1 ? "" : "s"} &middot; ${g.replies} repl${g.replies === 1 ? "y" : "ies"}`)).join('')}
      </table>
      ${d.videos ? `<p style="font-size:13px;color:#7a6a5c;margin:12px 0 0;">${d.videos} video${d.videos === 1 ? '' : 's'} posted this week.</p>` : ''}
    </td></tr>` : '';

  const next = d.next ? `
    <tr><td style="padding:22px 28px 6px;">
      <div style="background:#f6f1e9;border:1px solid #e3dacd;border-radius:5px;padding:16px 18px;">
        <div style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#9a4f2b;font-weight:700;">Coming up &mdash; Week ${d.next.week}</div>
        <div style="font-size:17px;color:#121110;font-weight:700;margin-top:6px;">${d.next.passage} &middot; ${d.next.theme}</div>
        <div style="font-size:14px;color:#5e564e;margin-top:4px;">${fmt(d.next.start)} &ndash; ${fmt(d.next.end)} &middot; H.E.A.R. Focus: ${d.next.focus}</div>
      </div>
    </td></tr>` : '';

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Weekly Digest</title></head>
<body style="margin:0;padding:24px 12px;background:#e9e4dc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #ddd4c8;border-radius:6px;overflow:hidden;">
  <tr><td style="background:#121110;padding:26px 28px;">
    <div style="font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:#cf8150;">The Brotherhood Challenge</div>
    <div style="font-size:26px;color:#e8e0d6;font-weight:700;margin-top:6px;">Weekly Digest</div>
    <div style="font-size:14px;color:#a1968a;margin-top:6px;">Week ${d.week.week} of 11 &middot; ${d.week.passage} &middot; ${d.week.theme}</div>
    <div style="font-size:13px;color:#7f766c;margin-top:2px;">${fmt(d.week.start)} &ndash; ${fmt(d.week.end)}, 2026</div>
  </td></tr>
  <tr><td style="padding:24px 28px 8px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>${card(d.newUsers, 'new men this week', '#9a4f2b')}${card(d.totalUsers, 'men signed up in total', '#121110')}</tr>
      <tr>${card(d.newEntries, 'new journal entries this week', '#9a4f2b')}${card(d.totalEntries, 'journal entries in total', '#121110')}</tr>
    </table>
  </td></tr>
  <tr><td style="padding:8px 28px 4px;">
    <div style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#9a4f2b;font-weight:700;border-top:1px solid #e3dacd;padding-top:18px;">Participation this week</div>
    <p style="font-size:13px;color:#7a6a5c;margin:6px 0 14px;">&ldquo;Did you journal at least twice using H.E.A.R.?&rdquo; &mdash; counts only, no names.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="font-size:15px;color:#2b2724;">
      ${row('Journaled twice or more', `${d.twice} men`)}
      ${row('Journaled once', `${d.once} men`)}
      ${row('Haven&rsquo;t journaled this week', `${d.none} men`)}
    </table>
  </td></tr>
  ${board}
  ${next}
  <tr><td align="center" style="padding:22px 28px 26px;">
    <a href="${appUrl}" style="display:inline-block;background:#9a4f2b;color:#fbf6ef;text-decoration:none;font-size:15px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:14px 28px;border-radius:4px;">Open the app</a>
  </td></tr>
  <tr><td style="background:#121110;padding:20px 28px;text-align:center;">
    <div style="font-size:14px;color:#a1968a;">Built to glorify God and equip men for eternal impact.</div>
    <div style="font-size:12px;color:#6f675e;margin-top:8px;">Sent to Brotherhood leaders each Sunday evening. Counts only &mdash; no names and no journal content.</div>
  </td></tr>
</table></body></html>`;
}

async function sendEmail(html, subject) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  const to = process.env.DIGEST_TO;
  if (!user || !pass || !to) throw httpError(500, 'Email not set up: add GMAIL_USER, GMAIL_APP_PASSWORD, and DIGEST_TO.');
  // eslint-disable-next-line global-require
  const nodemailer = require('nodemailer');
  const transport = nodemailer.createTransport({ service: 'gmail', auth: { user, pass } });
  await transport.sendMail({
    from: `Brotherhood Challenge <${user}>`,
    to: to.split(',').map((x) => x.trim()).filter(Boolean),
    subject,
    html,
  });
  return to;
}

module.exports = handler(async (req, res) => {
  const q = req.query || {};
  const fromCron = !!process.env.CRON_SECRET && (req.headers.authorization || '') === `Bearer ${process.env.CRON_SECRET}`;
  const keyOk = !!process.env.DIGEST_KEY && q.key === process.env.DIGEST_KEY;
  if (!fromCron && !keyOk) throw httpError(401, 'Not authorized.');

  // The cron runs daily; only Sunday evening actually sends.
  if (fromCron && weekdayChicago(new Date()) !== 'Sun') {
    return { skipped: `not Sunday in Chicago (${weekdayChicago(new Date())})` };
  }

  const data = await gather();
  const html = render(data, process.env.APP_URL || 'https://hear-journal-app.vercel.app');
  const subject = `Brotherhood Challenge — Week ${data.week.week}: ${data.newEntries} entries, ${data.newUsers} new men`;

  let sentTo = null;
  if (fromCron || q.send === '1') sentTo = await sendEmail(html, subject);

  if (q.format === 'json') return { data, sentTo };
  res.__sent = true;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(`${sentTo ? `<div style="max-width:600px;margin:0 auto 12px;font-family:Helvetica,Arial;font-size:13px;color:#2b6a3a;text-align:center;">Emailed to ${sentTo}</div>` : ''}${html}`);
  return undefined;
});
