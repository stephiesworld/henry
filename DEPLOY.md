# Deploying HENRY to Vercel

This gets HENRY onto a permanent URL (e.g. `henry-xxxx.vercel.app`) you can open
on any device and share — no terminal, no `npm run dev`, ever, once it's live.

## One-time setup

### 1. Log in (you do this — it opens a browser)

```bash
cd ~/henry
npx vercel login
```

Pick how you want to sign in (GitHub / Google / email), click the link it shows,
approve in the browser. Done — your machine is now linked to Vercel.

### 2. Deploy (this creates the project)

```bash
npx vercel --yes
```

Accept the defaults. It uploads the app and gives you a **preview URL**.

### 3. Add your API key in the Vercel dashboard

1. Go to https://vercel.com/dashboard → open the **henry** project.
2. **Settings → Environment Variables**.
3. Add:
   - Name: `ANTHROPIC_API_KEY`  ·  Value: your key  ·  Environments: all
   - (Optional) `KEEPA_API_KEY` and `KEEPA_DOMAIN=1` for live pricing.
4. Save.

### 4. Deploy to production (with the key live)

```bash
npx vercel --prod
```

That URL is now your shareable, always-on HENRY.

## Updating later

Any time you change the code, run `npx vercel --prod` again to push the update.
(Or connect the project to a GitHub repo in the Vercel dashboard, and it will
auto-deploy on every push.)

## Notes

- `.env.local` is **not** uploaded (it's gitignored) — that's why the key goes in
  the Vercel dashboard instead.
- Free (Hobby) plan limits serverless functions to 60s; the chat route is capped
  at 60s to match. Very long web-search answers could hit that ceiling on free —
  upgrade to Pro (up to 300s) if it ever bites during a demo.
