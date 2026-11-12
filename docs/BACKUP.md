# Backups

Two layers:

1. **Neon's own history** (point-in-time restore). In the Neon console: your project → *Branches* → *Restore*, pick a time. The free plan keeps a short window (hours); paid plans keep days. Fastest way back after a mistake.
2. **Nightly copy on GitHub** (`.github/workflows/backup.yml`, every night at 02:17 UTC): a full `pg_dump`, encrypted with a passphrase, kept 30 days as an artifact of the *Database backup* workflow. It is independent of Neon, so it also covers losing the Neon project.

## Turn on the nightly copy (owner, once)

1. Neon console → your project → *Connect* → copy the connection string **without** "pooled" (direct).
2. GitHub → repository `menuto` → *Settings* → *Secrets and variables* → *Actions* → *New repository secret*:
   - `BACKUP_DATABASE_URL` = that connection string
   - `BACKUP_PASSPHRASE` = a long password. **Write it down somewhere safe**: without it no backup can be opened.
3. *Actions* → *Database backup* → *Run workflow* to test it. A green run with an artifact `menuto-YYYY-MM-DD` means it works.

## Restore (developer)

```bash
# download the artifact from the workflow run, unzip it, then:
gpg --decrypt menuto-YYYY-MM-DD.dump.gpg > menuto.dump
# restore into an EMPTY database (a new Neon branch or project), never over the live one first:
pg_restore --no-owner --no-privileges --dbname "$NEW_DATABASE_URL" menuto.dump
```

Then point `DATABASE_URL` / `DIRECT_URL` in Vercel at the restored database and redeploy.

The backup contains customers' personal data (names, phones, addresses): it stays encrypted, in the private repository, and is deleted after 30 days.
