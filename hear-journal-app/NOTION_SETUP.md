# Getting Your Notion API Token & Database IDs

**This file explains where to find your Notion credentials.**

---

## 1. Get Your Notion API Token

### Step 1: Go to Notion Settings
1. Open **notion.so** in your browser
2. Click your **profile icon** (bottom left)
3. Click **"Settings"**
4. Click **"Integrations"** or **"My Integrations"**

### Step 2: Create an Integration
1. Click **"+ Create new integration"**
2. Give it a name: `H.E.A.R. Journal App`
3. Confirm the workspace is correct (Heritage Church Brotherhood)
4. Click **"Create"**

### Step 3: Copy the Token
1. You'll see an **"Internal Integration Token"**
2. Click **"Show"** → then **"Copy"**
3. This is your `REACT_APP_NOTION_TOKEN`
4. **Keep this secret!** Never share or commit to GitHub.

---

## 2. Get Your Database IDs

### For Each Database (Users, Challenges, Readings, Entries, Threads):

1. **Open the database** in Notion
2. **Copy the URL** from your browser address bar
3. The URL looks like:
   ```
   https://www.notion.so/3e2a48172a8280578003fc5a48f781c2?v=3e2a48172a8280238f62000cadaaa0e8
   ```

4. **Extract the Database ID** (the long string before the `?`):
   ```
   3e2a48172a8280578003fc5a48f781c2
   ```

5. This is one of your database IDs.

---

## 3. Create Your .env File

**Locally** (on your computer):

1. Create a file called `.env` in your project root
2. Add your credentials:

```
REACT_APP_NOTION_TOKEN=your_token_here
REACT_APP_NOTION_DB_USERS=id_from_users_db
REACT_APP_NOTION_DB_CHALLENGES=id_from_challenges_db
REACT_APP_NOTION_DB_READINGS=id_from_readings_db
REACT_APP_NOTION_DB_ENTRIES=id_from_entries_db
REACT_APP_NOTION_DB_THREADS=id_from_threads_db
```

3. **Save it** (it's in .gitignore, so it won't be committed)

---

## 4. Add to Vercel (For Production)

**Do NOT put your actual token in GitHub!**

Instead, add it to Vercel:

1. Go to **vercel.com** → Your Project
2. Click **"Settings"** → **"Environment Variables"**
3. Add all 6 variables with your real values
4. Click **"Save"**

Vercel will use these for the live app.

---

## ⚠️ Security Reminder

- ✅ `.env` file is in `.gitignore` (not committed to GitHub)
- ✅ Never put real tokens in documentation
- ✅ Add tokens to Vercel dashboard (secure)
- ✅ Keep your Notion token private

---

## Troubleshooting

**Can't find your token?**
→ Go to Notion Settings → Integrations → Your integration name → Show token

**Can't find database IDs?**
→ Open each database → Copy the URL → Extract the ID before the `?`

**Still stuck?**
→ See README.md or DEPLOYMENT.md for more details
