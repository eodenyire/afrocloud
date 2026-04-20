# Supabase migration pipeline

This repository includes a GitHub Actions workflow that auto-applies SQL migrations to your linked Supabase project when migration files change on `main`.

## Workflow file
- `.github/workflows/supabase-migrations.yml`

## Trigger
- `push` to `main` when files under `supabase/migrations/**` change.
- Manual trigger via `workflow_dispatch`.

## Required GitHub repository secrets
Set these in **GitHub → Settings → Secrets and variables → Actions**:

1. `SUPABASE_ACCESS_TOKEN`
   - Create from Supabase dashboard: **Account → Access Tokens**.
2. `SUPABASE_PROJECT_ID`
   - Your project ref, e.g. `xvqabdbcecmiddlujjyw`.
3. `SUPABASE_DB_PASSWORD`
   - Database password for the target project.

## What it does
1. Checks out the repo.
2. Installs Supabase CLI.
3. Validates required secrets are present.
4. Links to the target Supabase project.
5. Runs `supabase db push` to apply unapplied migrations.

## Notes
- Keep migration files idempotent and forward-only.
- For production safety, protect `main` and use pull requests.
- You can run the workflow manually from the Actions tab when needed.
