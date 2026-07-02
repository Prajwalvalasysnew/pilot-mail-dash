## Goal
Move the Valasys AI from a floating launcher into the platform as a dedicated workspace, add layout upgrades (breadcrumbs, upgraded ⌘K, right-rail insights), and do a full-sweep polish so every page reads production-grade.

## 1. AI moves into the platform
- New route `src/routes/_app.ai.tsx` — full-page AI workspace:
  - Left column: conversation list (localStorage-persisted threads) + "New chat" + suggested prompts by category (Analytics, Drafting, Deliverability, Docs).
  - Center: transcript reusing `AgentChatPanel`'s render logic (extracted into `ChatTranscript` + `ChatComposer` primitives so both the page and the docked variant share code).
  - Right: live tool timeline, pending confirmations queue, and agent health/settings card.
- Sidebar (`AppSidebar.tsx`): add pinned "Valasys AI" item with Beta badge at the top of nav.
- Remove `AgentLauncher` floating button from `_app.tsx`. Replace with a header `Ask AI` button (⌘J) that navigates to `/ai` with the query prefilled via search param `?q=`.
- `ai-agent-client.ts`: add lightweight thread persistence (localStorage: `{id,title,updatedAt,messages}`) — one conversation shape, since backend already tracks conversation_id.

## 2. Layout upgrades
- `TopHeader.tsx`:
  - Breadcrumb strip derived from current route (Home / Section / Page) with icons.
  - Page-context action slot (via a small `PageContext` provider) so pages can inject actions into the header bar.
  - Upgraded ⌘K command palette: grouped (Navigate, Create, AI actions, Docs, Recent) with keyboard hints, icons, and route preloading on hover.
  - Header "Ask AI" pill button + notifications + env selector kept.
- New `src/components/layout/RightRail.tsx` — optional right-side insights panel each page can mount (collapsible, remembers state). Pages opt-in via prop on a new `PageShell` wrapper.
- New `src/components/PageShell.tsx` — standard page frame: breadcrumb-aware title, description, primary/secondary actions, optional right rail, consistent spacing. Replaces ad-hoc `PageHeader` usage per page.

## 3. Per-page polish (full sweep)
Standard treatment applied to every `_app.*` page:
- Wrap in `PageShell` with real breadcrumbs, description, contextual actions.
- Replace basic tables with sticky headers, zebra rows, row hover, empty states, skeleton loaders, and pagination footer with counts.
- Charts: axis polish, gradient fills, tooltips styled with card tokens, legends aligned, empty states.
- Add right-rail insights per page (see below).
- KPI cards: consistent trend indicator, sparklines where relevant.

Page-specific rail content:
- Dashboard → "Today at a glance" + AI insight card ("Ask AI why bounces rose")
- Analytics → Top domains + AI "Explain this trend" card
- Messages → Filter presets, saved views, sender reputation
- Logs → Event type legend, live tail toggle, export
- Send Email → Send checklist (SPF/DKIM/DMARC status pulled from demo), preview device switch
- Templates → Category tree, recently used, variables palette
- Domains → DNS health checklist, propagation status
- Suppressions → Import/export, list stats by reason
- Webhooks → Delivery health, secret rotation status, recent failures
- Usage → Plan card, upgrade CTA, projected overage
- API Keys → Scope legend, rotation reminders, security tips
- Settings → Section nav, profile summary
- Docs → TOC rail + copy-code polish

## 4. Technical details
- Extract `ChatTranscript`, `ChatComposer`, `PendingConfirmationCard`, `ToolStepList` from `AgentChatPanel.tsx` into `src/components/ai/chat/*`. Keep `AgentChatPanel` as a slim wrapper (in case we want the docked variant later; not enabled now).
- Add `src/lib/ai-threads.ts` for localStorage thread CRUD.
- Add `src/lib/breadcrumbs.ts` map: pathname → crumbs.
- Add `src/context/page-context.tsx` for pages to register title/actions/rail with the shell.
- No backend changes; still uses `ai-agent-client` streaming.

## 5. Out of scope
- Backend API changes.
- Auth flow changes.
- Real thread server persistence (localStorage only, per project pattern).

## Files touched (high-level)
- New: `src/routes/_app.ai.tsx`, `src/components/PageShell.tsx`, `src/components/layout/RightRail.tsx`, `src/components/ai/chat/*`, `src/lib/ai-threads.ts`, `src/lib/breadcrumbs.ts`, `src/context/page-context.tsx`.
- Edited: `_app.tsx` (remove launcher, add PageContext), `AppSidebar.tsx` (AI entry), `TopHeader.tsx` (breadcrumbs, ⌘K upgrade, Ask AI button), all `_app.*.tsx` pages (PageShell + polish).

## Estimate
~18–22 file edits, ~6 new files. Single large batch.
