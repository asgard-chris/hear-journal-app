# H.E.A.R. Journal – Deployment Checklist

**Goal:** Get the app from your computer to live on the web by Sept 20, 2026  
**Time to deploy:** ~30 minutes  
**Difficulty:** Beginner (all steps are guided)

---

## ✅ Pre-Deployment Verification

- [ ] All files downloaded/copied from `/home/claude/` to your computer
- [ ] Notion workspace created (Heritage Church Brotherhood)
- [ ] All 5 Notion databases created and have their IDs
- [ ] GitHub account ready (asgard-chris)
- [ ] Vercel account ready (or will create during deployment)

---

## Step 1: Create GitHub Repository (5 min)

1. **Open terminal** in the project folder:
   ```bash
   cd path/to/hear-journal-app
   ```

2. **Initialize git and commit:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: H.E.A.R. Journal v1.0"
   ```

3. **Create repo on GitHub.com:**
   - Go to github.com (logged in as asgard-chris)
   - Click "New" → "New repository"
   - Name: `hear-journal-app`
   - **DO NOT** check "Add .gitignore" or "Add README" (we have them)
   - Click "Create repository"

4. **Connect local to GitHub:**
   ```bash
   git remote add origin https://github.com/asgard-chris/hear-journal-app.git
   git branch -M main
   git push -u origin main
   ```
   (Enter GitHub credentials when prompted)

5. **Verify:** Refresh github.com/asgard-chris/hear-journal-app and see your code ✅

**Checklist:**
- [ ] GitHub repo created at github.com/asgard-chris/hear-journal-app
- [ ] Code pushed to GitHub
- [ ] Can see all files on GitHub

---

## Step 2: Deploy to Vercel (10 min)

1. **Go to Vercel.com:**
   - Sign up with GitHub (asgard-chris) if you haven't
   - Or log in if you already have an account

2. **Import project:**
   - Click "Add New" → "Project"
   - Select "Import Git Repository"
   - Paste: `https://github.com/asgard-chris/hear-journal-app`
   - Click "Import"

3. **Add environment variables** (before clicking Deploy):
   - Scroll to "Environment Variables"
   - Add all 6 variables (get from your Notion workspace):
     | Variable | Source |
     |----------|--------|
     | REACT_APP_NOTION_TOKEN | Your Notion API Token |
     | REACT_APP_NOTION_DB_USERS | Users database ID |
     | REACT_APP_NOTION_DB_CHALLENGES | Challenges database ID |
     | REACT_APP_NOTION_DB_READINGS | Readings database ID |
     | REACT_APP_NOTION_DB_ENTRIES | Journal Entries database ID |
     | REACT_APP_NOTION_DB_THREADS | Discussion Threads database ID |

4. **Deploy:**
   - Click "Deploy"
   - Wait for build to finish (usually 2-3 min)
   - When complete, you'll see a ✅ and live URL

5. **Test the app:**
   - Click the live URL (e.g., https://hear-journal.vercel.app)
   - Fill in name and email
   - Choose "Brotherhood Challenge"
   - Try creating an entry

**Checklist:**
- [ ] Vercel account created/logged in
- [ ] Project imported to Vercel
- [ ] All 6 environment variables added
- [ ] Deployment successful (green checkmark)
- [ ] Live app works at https://hear-journal.vercel.app

---

## Step 3: Pre-Populate Notion Readings (5 min)

The app has the 11-week schedule hardcoded. To add to Notion:

### Option A: Manual (Easiest for now)

1. **Open Notion:** Heritage Church Brotherhood workspace
2. **Go to Readings database**
3. **Click "Add" or "+ New page"** and add entries for each week:
   - Week 1: James 1-5, Theme: "Faith that Works"
   - Week 2: James 1, Theme: "Trials & Discipline"
   - etc.
4. **Use the hardcoded schedule** in app at `src/HEARJournal.jsx` lines 46–135 as reference

### Option B: Programmatic (Advanced)
- Contact Chris if you want to write a script to bulk-insert

**Checklist:**
- [ ] At least Week 1 added to Notion Readings
- [ ] All 11 weeks added (or scheduled to add)

---

## 🎉 Done!

Your app is now **LIVE** and ready for the Sept 20 launch!

### What's Next
1. **Promote the app:**
   - Share the link: https://hear-journal.vercel.app
   - Let members know it's live

2. **Monitor:**
   - Watch Vercel analytics for usage
   - Check for errors in logs

3. **Maintain:**
   - Any bugs? Fix locally, commit, push — Vercel auto-deploys
   - Plan Phase 2 (facilitator dashboard) for late October

---

## Troubleshooting Quick Links

**Can't push to GitHub?**
→ Check SSH key is set up: `git config --list | grep user.name`

**Deployment failed in Vercel?**
→ Check build logs in Vercel dashboard. Usually missing npm dependency.

**App shows blank page?**
→ Check browser console (F12) for errors. Check Vercel logs.

**Notion not connecting?**
→ Verify token and database IDs in Vercel Settings → Environment Variables are correct.

---

## Support & Questions

- **README.md** — Full documentation on how the app works
- **DEPLOYMENT.md** — Step-by-step walkthrough of this process
- **GitHub Issues** — Report bugs at github.com/asgard-chris/hear-journal-app/issues
- **Email:** chris@data-whisperers.com

---

## Final URLs

| Item | URL |
|------|-----|
| **Live App** | https://hear-journal.vercel.app |
| **GitHub Repo** | https://github.com/asgard-chris/hear-journal-app |
| **Vercel Dashboard** | https://vercel.com/dashboard |
| **Notion Workspace** | Heritage Church Brotherhood (chris@data-whisperers.com) |

**You did it! 🚀**
