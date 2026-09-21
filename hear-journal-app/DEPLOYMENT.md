# H.E.A.R. Journal – Deployment Guide

Complete walkthrough to get the app from your computer to live on the web.

---

## Part 1: Set Up GitHub Repository

### Step 1: Initialize Local Repository

```bash
cd /home/claude
git init
git add .
git commit -m "Initial commit: H.E.A.R. Journal v1.0"
```

### Step 2: Create Repository on GitHub

1. Go to [github.com](https://github.com) (logged in as `asgard-chris`)
2. Click **"New"** (top left) → **"New repository"**
3. **Repository name:** `hear-journal-app`
4. **Description:** H.E.A.R. Journal - Personal Scripture journaling app for Heritage Church Brotherhood
5. **Visibility:** Public
6. **DO NOT** initialize with README, .gitignore, or license (we have them locally)
7. Click **"Create repository"**

### Step 3: Connect Local to GitHub

Copy the two lines from GitHub's "…or push an existing repository from the command line" section:

```bash
git remote add origin https://github.com/asgard-chris/hear-journal-app.git
git branch -M main
git push -u origin main
```

Run these commands:

```bash
git remote add origin https://github.com/asgard-chris/hear-journal-app.git
git branch -M main
git push -u origin main
```

**Enter your GitHub credentials** when prompted.

Verify: Refresh github.com/asgard-chris/hear-journal-app and see your code.

---

## Part 2: Deploy to Vercel

### Step 1: Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"**
3. Select **"Continue with GitHub"**
4. Authorize Vercel to access your GitHub account
5. You're now signed in as asgard-chris

### Step 2: Import Project

1. On Vercel dashboard, click **"Add New"** → **"Project"**
2. Select **"Import Git Repository"**
3. Paste: `https://github.com/asgard-chris/hear-journal-app`
4. Click **"Import"**

### Step 3: Configure Environment Variables

On the Vercel import screen, before clicking "Deploy":

1. Scroll to **"Environment Variables"**
2. Add all 6 variables (get values from your Notion workspace and `.env.example`):

| Key | Where to get the value |
|-----|-------|
| `REACT_APP_NOTION_TOKEN` | Your Notion API token (from Notion Settings) |
| `REACT_APP_NOTION_DB_USERS` | Users database ID (from Notion URL) |
| `REACT_APP_NOTION_DB_CHALLENGES` | Challenges database ID (from Notion URL) |
| `REACT_APP_NOTION_DB_READINGS` | Readings database ID (from Notion URL) |
| `REACT_APP_NOTION_DB_ENTRIES` | Journal Entries database ID (from Notion URL) |
| `REACT_APP_NOTION_DB_THREADS` | Discussion Threads database ID (from Notion URL) |

3. Click **"Deploy"**

### Step 4: Wait for Deployment

Vercel will:
1. Clone your repo
2. Install dependencies (`npm install`)
3. Build the app (`npm build`)
4. Deploy to CDN

**Status page shows:**
- ✅ Ready when you see a green checkmark
- 🔗 Live URL appears at top (e.g., `https://hear-journal.vercel.app`)

### Step 5: Test the Live App

1. Click the live URL in Vercel
2. Create a test entry
3. Verify all H.E.A.R. sections work
4. Test on mobile (tap the responsive icon in browser)

---

## Part 3: Custom Domain (Optional)

To use a custom domain like `hear-journal.heritagechurch.org`:

### In Vercel Dashboard

1. Go to your project → **"Settings"** → **"Domains"**
2. Click **"Add"**
3. Enter your custom domain
4. Vercel shows DNS records to add

### In Your Domain Provider

1. Add Vercel's DNS records to your domain registrar
2. Wait 24–48 hours for propagation
3. Refresh Vercel → domain is active

---

## Part 4: Continuous Deployment (Auto-Update)

Now that GitHub + Vercel are connected:

1. **Make changes** to your local code
2. **Commit & push** to GitHub:
   ```bash
   git add .
   git commit -m "Add new feature"
   git push
   ```
3. **Vercel automatically:**
   - Detects the push
   - Rebuilds the app
   - Deploys to the live URL
   - You see status in Vercel dashboard

**No manual deployment needed** — it's fully automated.

---

## Part 5: Pre-Populate Notion Readings Database

The app comes with the 11-week James schedule hardcoded, but to sync with Notion:

### Option A: Manual in Notion (Quick)

1. Open Notion workspace → **Readings** database
2. Click **"+ Add a page"** for each week
3. Fill in: Passage, Week, Date, Theme, Description
4. Use the hardcoded schedule in `src/HEARJournal.jsx` lines 46–135

### Option B: Programmatic via Notion API (Advanced)

Write a one-time setup script to insert all readings. Contact Chris if you need help.

---

## Part 6: Monitor & Maintain

### Vercel Dashboard Checks

- **Deployments tab:** View all deploys and rollback if needed
- **Analytics tab:** See traffic and performance
- **Logs tab:** Debug build/runtime errors

### GitHub Maintenance

- Keep dependencies updated: `npm outdated`
- Run tests before pushing: `npm test`
- Review changes before merge

---

## Troubleshooting

### Build Failed on Vercel

**"npm ERR! 404"** or **missing dependency**

→ Run `npm install` locally, then `npm list` to check. Push working `package-lock.json` to GitHub.

### App Shows Blank Page

→ Check browser console (F12) for errors. View Vercel logs for build issues.

### Notion Not Syncing

→ Verify token and database IDs in Vercel **Settings** → **Environment Variables**. Restart deployment.

### Can't Push to GitHub

→ Verify SSH/HTTPS credentials. Use `git remote -v` to check remote URL. Ensure GitHub CLI or SSH key is set up.

---

## What Happens Next

1. **App launches:** Sept 20, 2026 (challenge kickoff)
2. **Users sign up** with name/email
3. **Challenge mode activated** for the 11 weeks
4. **Entries saved** to Notion automatically
5. **Phase 2 (facilitator dashboard):** Later in Oct
6. **Phase 3 (discussion board):** Late Nov

---

## Credentials Reference

| Service | Account | Token/ID |
|---------|---------|----------|
| **GitHub** | asgard-chris | [GitHub PAT if needed] |
| **Vercel** | asgard-chris@gmail.com | [Vercel dashboard] |
| **Notion** | chris@data-whisperers.com | See NOTION_SETUP.md |

---

## Support

Issues during deployment? Reach out:
- **Email:** chris@data-whisperers.com
- **GitHub Issues:** github.com/asgard-chris/hear-journal-app/issues

**Live app URL once deployed:** https://hear-journal.vercel.app
