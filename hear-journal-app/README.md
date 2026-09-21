# H.E.A.R. Journal

A personal Scripture journaling app built for **Heritage Church Brotherhood's "Real Manhood: Built to Last" challenge** (September 20 – December 5, 2026).

## The H.E.A.R. Method

- **H – Highlight:** Verse(s) that stood out
- **E – Explain:** Context and meaning  
- **A – Apply:** How it changes how I live as a man
- **R – Respond:** Prayer or commitment to God

## Features

✅ **Personal journaling** with the H.E.A.R. method  
✅ **Challenge mode:** 11-week Book of James reading schedule, pre-populated  
✅ **Independent mode:** User-determined Scripture passages  
✅ **Offline support:** Uses browser localStorage  
✅ **Notion integration:** Backend connected to Heritage Church Brotherhood workspace  
✅ **Mobile-responsive:** Works on phone, tablet, and desktop  

## Tech Stack

- **Frontend:** React 18 + TailwindCSS
- **Backend:** Notion (via Notion API)
- **Deployment:** Vercel
- **Storage:** LocalStorage (fallback) → Notion (production)

---

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/asgard-chris/hear-journal-app.git
cd hear-journal-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Environment Variables

Create a `.env` file in the project root (copy from `.env.example`):

```
REACT_APP_NOTION_TOKEN=your_token_here
REACT_APP_NOTION_DB_USERS=your_db_id_here
REACT_APP_NOTION_DB_CHALLENGES=your_db_id_here
REACT_APP_NOTION_DB_READINGS=your_db_id_here
REACT_APP_NOTION_DB_ENTRIES=your_db_id_here
REACT_APP_NOTION_DB_THREADS=your_db_id_here
```

**Note:** Use `.env.example` as a template. Add real values only in `.env` (which is in .gitignore and not committed to GitHub). For production, add these to Vercel's Environment Variables in the dashboard.

### 4. Run Locally

```bash
npm start
```

The app will open at `http://localhost:3000`.

---

## Deployment to Vercel

### Step 1: Create a Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Sign up with your GitHub account (asgard-chris)

### Step 2: Import the Repository

1. Click **"New Project"**
2. Select **"Import Git Repository"**
3. Paste: `https://github.com/asgard-chris/hear-journal-app.git`
4. Click **"Import"**

### Step 3: Configure Environment Variables

In Vercel dashboard:

1. Go to **Settings** → **Environment Variables**
2. Add all 6 variables from your `.env` file
3. Click **"Save"**

### Step 4: Deploy

1. Click **"Deploy"**
2. Vercel will automatically build and deploy
3. Your app is live at `https://hear-journal.vercel.app` (or custom domain)

---

## Notion Database Structure

The app uses 5 Notion databases in the Heritage Church Brotherhood workspace:

### 1. **Users**
- Name (Title)
- Email
- Role (Participant/Facilitator/Administrator)
- Joined Date

### 2. **Challenges**
- Title
- Start Date
- End Date
- Book
- Description
- Status (Planning/Active/Completed)

### 3. **Readings** ← Pre-populated with 11-week James schedule
- Passage (Title)
- Week
- Reading Date
- Book
- Chapter
- Verses
- Full Text
- Theme
- Study Notes

### 4. **Journal Entries** ← User entries are saved here
- Title
- User (relation to Users)
- Reading (relation to Readings)
- Challenge (relation to Challenges)
- Date Created
- Highlight (H)
- Explain (E)
- Apply (A)
- Respond (R)
- Status (Draft/Submitted/Private)
- Is Public (checkbox)

### 5. **Discussion Threads** ← For Phase 3
- Title
- Reading (relation to Readings)
- Challenge (relation to Challenges)
- Created By (relation to Users)
- Created Date

---

## 11-Week Reading Schedule

### Phase 1: Big Picture Pass (Week 1)
- **Week 1 (Sept 20–26):** James 1–5 — Theme: Faith that Works

### Phase 2: Chapter by Chapter (Weeks 2–6)
- **Week 2 (Sept 27–Oct 3):** James 1 — Trials & Discipline
- **Week 3 (Oct 4–10):** James 2 — Faith in Action
- **Week 4 (Oct 11–17):** James 3 — Words & Wisdom
- **Week 5 (Oct 18–24):** James 4 — Humility & Surrender
- **Week 6 (Oct 25–31):** James 5 — Endurance & Prayer

### Phase 3: Themes (Weeks 7–11)
- **Week 7 (Nov 1–7):** James 1–2 — Integrity in Faith
- **Week 8 (Nov 8–14):** James 3–4 — Mature Manhood
- **Week 9 (Nov 15–21):** James 5 — Finishing Strong
- **Week 10 (Nov 22–28):** Thanksgiving Break — No reading
- **Week 11 (Nov 29–Dec 4):** James 1–5 — Final Immersion
- **Final Gathering:** Dec 5 — Celebration

---

## Developer Notes

### LocalStorage vs. Notion

Currently, the app uses **browser localStorage** for persistence (fallback). To fully enable Notion API integration:

1. **Verify database sharing** in Notion workspace settings
2. **Test API calls** from the app to Notion databases
3. **Migrate data** from localStorage to Notion once production-ready

### Future Phases

**Phase 2 – Facilitator Dashboard**
- View who completed entries
- Track completion rates
- Analytics on engagement

**Phase 3 – Discussion Board**
- Threads per reading ("What impacted you most in James 1?")
- Comments and replies
- Community interaction

---

## Troubleshooting

### App won't connect to Notion
- Check that the Notion PAT token is correctly set in `.env`
- Verify database IDs match exactly (copy from browser URL)
- Ensure Notion databases are shared with the token owner

### Can't access app after deployment
- Check Vercel build logs for errors
- Verify all environment variables are set in Vercel dashboard
- Clear browser cache and hard refresh (Ctrl+Shift+R)

### localStorage entries disappeared
- Entries are saved per device in browser storage
- Clear browser data will delete entries
- Use Notion as the source of truth once migration complete

---

## Support

For issues or questions, contact Chris at:
- **Email:** chris@data-whisperers.com  
- **GitHub:** @asgard-chris

---

## License

This project is built for Heritage Church Brotherhood. All rights reserved.

**Challenge:** Real Manhood: Built to Last  
**Duration:** September 20 – December 5, 2026  
**Text:** Book of James (11 weeks)
