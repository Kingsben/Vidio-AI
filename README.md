# Vidio AI

Vidio AI pairs a photography-led public concept page with a local project-brief workspace. Video generation, editing, publishing, and account sync are not implemented.

## Run locally

```sh
npm install
npm run dev
```

The public page is at `/`. Open the workspace at `/app` to create, view, edit, and delete project briefs.

## Project drafts

Drafts contain a title, brief, intended format (landscape, portrait, or square), and creation/update timestamps. They are stored in the current browser's `localStorage` under the versioned `vidio-ai.projects.v1` key. Drafts are not uploaded, synced between browsers, or backed up. Clearing browser storage removes them.

The workspace uses a `ProjectRepository` interface so a future remote data source can be introduced without coupling dashboard components to browser storage. No authentication or AI service is connected.

## Checks

```sh
npm run build
npm run lint
npm test
```
