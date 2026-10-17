# Vidio AI

Vidio AI is being built as a broad AI video creation platform for cinematic films, image-to-video, children's cartoons and animation, marketing, music and motion, education, and social video. The public page includes original concept artwork and independently produced, licensed reference films; they are credited third-party examples, not Vidio AI outputs. AI generation, editing, and publishing are planned, not available.

## Run locally

```sh
npm install
npm run dev
```

The public page is at `/`. Register or sign in to open the protected workspace at `/app`. Project briefs can be created, viewed, edited, and deleted there.

## Supabase authentication setup

Create an ignored `.env.local` file with the Supabase project URL and **publishable** key:

```sh
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_public_key
```

Never place a service-role key, secret key, or database password in a `VITE_` variable. Frontend environment variables are public in the built application.

In the Supabase dashboard, enable email authentication, decide whether email confirmation is required, configure the email templates, and add the local and deployed callback paths (`/auth/callback` and `/auth/recovery`) to the allowed redirect URLs. Email confirmation and password recovery require Supabase email delivery to be configured. The app uses the Supabase browser session, PKCE, automatic token refresh, and session restoration; it does not log credentials or session tokens.

Authentication gates workspace access. Database access must still be protected by Supabase RLS. This phase does not change database tables or policies and does not move local drafts to the cloud.

## Project briefs and cloud storage

Signed-in users can create, view, edit, and delete project briefs stored in the existing Supabase `public.projects` table. Each operation uses the authenticated user's ID and is scoped by it; Supabase Row Level Security must remain enabled with owner-only policies for authenticated users. The application does not use a service-role or secret key.

Existing browser-local drafts under `vidio-ai.projects.v1` are not read by the signed-in workspace, migrated, or deleted. They remain separate from account-backed projects. AI generation, editing, and publishing are not available yet.

## Checks

```sh
npm run build
npm run lint
npm test
```
