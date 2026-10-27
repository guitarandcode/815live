# daily-rebuild Worker

Rebuilds the production site once a day at about 4:05 AM Chicago by POSTing
the Cloudflare Pages deploy hook, so /tonight and /tomorrow roll over even if
the GitHub daily ingest (`.github/workflows/daily.yml`) runs late or fails.
It rebuilds main as it is; ingest still happens only in GitHub Actions.

- Crons `5 9 * * *` and `5 10 * * *` (UTC). 09:05 is 4:05 AM in CDT, 10:05 is
  4:05 AM in CST; the run that isn't 4 AM in Chicago exits without posting.
- The hook URL is the Worker secret `DEPLOY_HOOK_URL` (Pages project →
  Settings → Builds → Deploy hooks; the same hook as the GitHub secret
  `CF_PAGES_DEPLOY_HOOK` works). It is never stored in the repo.
- No fetch handler and `workers_dev = false`: there's no public URL.

## Deploy (by hand; the user runs these, never CI or Claude)

```sh
cd workers/daily-rebuild
npx wrangler login                          # once, if not logged in
npx wrangler deploy                         # creates the Worker and its cron triggers
npx wrangler secret put DEPLOY_HOOK_URL     # paste the hook URL at the prompt
```

Check it: `npx wrangler deployments list`, and the Worker's logs in the
dashboard (Workers & Pages → 815live-daily-rebuild → Logs) after 4:05 AM.
To try the handler locally without hitting the real hook, put a dummy URL in
`.dev.vars` (`DEPLOY_HOOK_URL=https://example.com/`; `.dev.vars` is
gitignored) and run `npx wrangler dev --test-scheduled`, then
`curl "http://localhost:8787/__scheduled?cron=5+9+*+*+*"`. Outside 4 AM
Chicago it logs "skipped", which is the guard working.
