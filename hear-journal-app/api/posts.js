// Weekly group message board. Posts are NOT encrypted and DO carry the man's name:
// this is a conversation, not the private journal. The two never mix.
//
// GET  /api/posts?week=N                         -> { posts, me, group }
// POST /api/posts { action, ... }
//        create  { week, body, videoUrl, parentId }
//        edit    { id, body, videoUrl }      author, or a facilitator of that group
//        remove  { id }                      facilitator / admin only (soft delete)
//        restore { id }                      facilitator / admin only
//        flag    { id }                      any man in the group
const { httpError, notion, queryAll, toRich, readProp, schema, readToken, handler, loadUser, canModerate, isAdmin, roomsFor, OPEN_GROUP, ALL_GROUPS } = require('./_lib');

const NOTION_ID = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;
const MAX_BODY = 4000;

// Only links we can render or trust. Instagram opens in its own app.
const VIDEO_HOSTS = /^(www\.|m\.)?(youtube\.com|youtu\.be|vimeo\.com|player\.vimeo\.com|instagram\.com|instagr\.am|loom\.com|drive\.google\.com|dropbox\.com)$/i;

function cleanVideo(url) {
  const raw = String(url || '').trim();
  if (!raw) return '';
  let parsed;
  try { parsed = new URL(raw); } catch (e) { throw httpError(400, 'That video link doesn’t look like a web address.'); }
  if (parsed.protocol !== 'https:') throw httpError(400, 'Video links need to start with https://');
  if (!VIDEO_HOSTS.test(parsed.hostname)) {
    throw httpError(400, 'Use an Instagram, YouTube, Loom, Vimeo, Google Drive, or Dropbox link.');
  }
  return parsed.toString().slice(0, 500);
}

function toPost(page) {
  return {
    id: page.id,
    memberKey: readProp(page, 'Member Key') || '',
    author: readProp(page, 'Display Name') || 'A brother',
    group: readProp(page, 'Group') || '',
    week: readProp(page, 'Week') || '',
    body: readProp(page, 'Body') || '',
    videoUrl: (page.properties['Video URL'] && page.properties['Video URL'].url) || '',
    parentId: readProp(page, 'Parent Post') || '',
    status: (readProp(page, 'Status') || 'Visible').trim(),
    flags: readProp(page, 'Flags') || 0,
    likes: readProp(page, 'Likes') || 0,
    likedBy: String(readProp(page, 'Liked By') || '').split(',').map((x) => x.trim()).filter(Boolean),
    announcement: (readProp(page, 'Group') || '') === ALL_GROUPS,
    allowReplies: String(readProp(page, 'Allow Replies') || '').toLowerCase() === 'yes',
    moderatedBy: readProp(page, 'Moderated By') || '',
    created: Date.parse(page.created_time),
    editedAt: readProp(page, 'Edited At') || null,
  };
}

async function board(s) {
  if (!s.postsId) throw httpError(404, 'The message board isn’t turned on yet.');
  return s.postsId;
}

async function getPost(s, id) {
  if (!NOTION_ID.test(String(id || ''))) throw httpError(400, 'Unknown post.');
  const page = await notion(`/pages/${id}`);
  if (page.archived) throw httpError(404, 'Post not found.');
  return { page, post: toPost(page) };
}

module.exports = handler(async (req) => {
  const { uid } = readToken(req);
  const s = await schema();
  const postsId = await board(s);
  const me = await loadUser(uid);
  if (!me.group) throw httpError(403, 'You’re not in a small group yet. Ask your facilitator to add you.');

  if (req.method === 'GET') {
    const week = Number((req.query && req.query.week) || 0);
    if (!week) throw httpError(400, 'Which week?');
    const room = String((req.query && req.query.room) || OPEN_GROUP);
    if (!roomsFor(me).includes(room)) throw httpError(403, 'That isn’t one of your groups.');
    const pages = await queryAll(postsId, {
      and: [
        { property: 'Week', number: { equals: week } },
        { or: [
          { property: 'Group', rich_text: { equals: room } },
          { property: 'Group', rich_text: { equals: ALL_GROUPS } },
        ] },
      ],
    });
    const all = pages.map(toPost).sort((a, b) => a.created - b.created);
    const visible = canModerate(me)
      ? all
      : all.filter((p) => p.status !== 'Removed' || p.memberKey === me.key);
    return {
      posts: visible.map((p) => (p.status === 'Removed' && p.memberKey === me.key && !canModerate(me)
        ? { ...p, body: '', videoUrl: '' } : p)),
      me: { key: me.key, name: me.name, group: me.group, rooms: roomsFor(me), canModerate: canModerate(me), isAdmin: isAdmin(me) },
      room,
    };
  }

  if (req.method !== 'POST') throw httpError(405, 'Method not allowed.');
  const { action } = req.body || {};

  if (action === 'create') {
    const { week, parentId } = req.body;
    const body = String(req.body.body || '').trim().slice(0, MAX_BODY);
    const videoUrl = cleanVideo(req.body.videoUrl);
    if (!body && !videoUrl) throw httpError(400, 'Write something, or add a video link.');
    if (!Number(week)) throw httpError(400, 'Which week?');
    const announce = !!req.body.announcement;
    if (announce && !isAdmin(me)) throw httpError(403, 'Only a pastor or admin can post to every group.');
    let room = announce ? ALL_GROUPS : String(req.body.room || OPEN_GROUP);
    if (!announce && !roomsFor(me).includes(room)) throw httpError(403, 'You can post to Open Discussion or your own small group.');

    if (parentId) {
      const { post: parent } = await getPost(s, parentId);
      if (parent.announcement) {
        if (!parent.allowReplies) throw httpError(403, 'This announcement is read-only.');
        // Replies to a church-wide message stay inside the man's own room
        room = roomsFor(me).includes(String(req.body.room || '')) ? String(req.body.room) : me.group;
      } else if (!roomsFor(me).includes(parent.group)) {
        throw httpError(403, 'That post isn’t in one of your groups.');
      } else {
        room = parent.group;
      }
    }
    const page = await notion('/pages', 'POST', {
      parent: { database_id: postsId },
      properties: {
        [s.postsTitle]: { title: toRich(`${announce ? 'ANNOUNCEMENT' : room} · Week ${week} · ${me.name}`) },
        'Member Key': { rich_text: toRich(me.key) },
        'Display Name': { rich_text: toRich(me.name) },
        Group: { rich_text: toRich(room) },
        Week: { number: Number(week) },
        Body: { rich_text: toRich(body) },
        'Video URL': { url: videoUrl || null },
        'Parent Post': { rich_text: toRich(parentId || '') },
        Status: { rich_text: toRich('Visible') },
        Flags: { number: 0 },
        Likes: { number: 0 },
        'Liked By': { rich_text: toRich('') },
        'Allow Replies': { rich_text: toRich(announce && req.body.allowReplies ? 'yes' : 'no') },
      },
    });
    return { post: toPost(page) };
  }

  const { post } = await getPost(s, req.body && req.body.id);
  if (!post.announcement && !roomsFor(me).includes(post.group) && !isAdmin(me)) throw httpError(403, 'That post isn’t in one of your groups.');
  const mine = post.memberKey === me.key;

  if (action === 'edit') {
    if (!mine && !canModerate(me)) throw httpError(403, 'You can only edit your own post.');
    const body = String(req.body.body || '').trim().slice(0, MAX_BODY);
    const videoUrl = cleanVideo(req.body.videoUrl);
    if (!body && !videoUrl) throw httpError(400, 'Write something, or add a video link.');
    const page = await notion(`/pages/${post.id}`, 'PATCH', {
      properties: {
        Body: { rich_text: toRich(body) },
        'Video URL': { url: videoUrl || null },
        'Edited At': { date: { start: new Date().toISOString() } },
        ...(mine ? {} : { 'Moderated By': { rich_text: toRich(`${me.name} (edited)`) } }),
      },
    });
    return { post: toPost(page) };
  }

  if (action === 'remove' || action === 'restore') {
    const removing = action === 'remove';
    if (!canModerate(me) && !(mine && removing)) throw httpError(403, 'Only a facilitator can do that.');
    const page = await notion(`/pages/${post.id}`, 'PATCH', {
      properties: {
        Status: { rich_text: toRich(removing ? 'Removed' : 'Visible') },
        'Moderated By': { rich_text: toRich(removing ? `${me.name} · ${new Date().toISOString().slice(0, 10)}` : '') },
      },
    });
    return { post: toPost(page) };
  }

  if (action === 'like') {
    const liked = post.likedBy.includes(me.key);
    const next = liked ? post.likedBy.filter((k) => k !== me.key) : [...post.likedBy, me.key];
    const page = await notion(`/pages/${post.id}`, 'PATCH', {
      properties: { Likes: { number: next.length }, 'Liked By': { rich_text: toRich(next.join(',')) } },
    });
    return { post: toPost(page) };
  }

  if (action === 'flag') {
    const page = await notion(`/pages/${post.id}`, 'PATCH', {
      properties: { Flags: { number: (post.flags || 0) + 1 }, Status: { rich_text: toRich(post.status === 'Removed' ? 'Removed' : 'Flagged') } },
    });
    return { post: toPost(page) };
  }

  throw httpError(400, 'Unknown action.');
});
