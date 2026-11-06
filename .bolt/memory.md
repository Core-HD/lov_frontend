# Project memory

## Product intent & audience

- Chat application with conversation list, active conversation view, and info panel.
- Session-based authentication with sign-in and registration flows.
- Intended contact workflow: create contacts, view personal contacts, and create chats or groups by selecting contacts.
- Multi-user/opponent-based chat context remains inferred from existing utilities and is not fully confirmed.

## Brand personality & voice

- No explicit brand guidance inferred.
- Existing user interaction is primarily Russian-language, so new UI copy may need Russian localization.

## Visual design & UX direction

- Three-panel chat layout: chat list (left), conversation (center), info panel (right).
- Authentication screens should allow the main form/content to scroll on small screens so fields and actions are not clipped.
- Contact actions should be discoverable from the chat experience: create contact, view contacts, and start a chat/group from a contact selection flow.
- CSS stylesheet drives layout and component styling; no utility-first styling pattern observed.
- Responsive behavior, accessibility, and overall visual polish remain unverified in a browser.

## Decisions, constraints & rationale

- Stack: Vite + React + TypeScript.
- Root flow: session check → authentication screen when unauthenticated, otherwise the chat layout.
- State management uses a store pattern, likely Zustand or a similar lightweight solution.
- A sync/persistence layer exists, but contact persistence and API integration are not defined.
- Authentication-screen scrolling was adjusted for small screens; the project build passes, but this change has not been manually browser-tested.
- Contact creation, contact listing, and chat/group creation from selected contacts are blocked until the storage/backend contract is known.
- No external server endpoints, request formats, or confirmed Supabase integration details are currently available.

## Open questions & assumptions

- Where should contacts be stored: existing external server, Supabase, or another persistence layer?
- What API/database schema and authentication context should contact operations use?
- Should groups have a name, avatar, owner/admin, or other metadata?
- How should duplicate contacts, pending requests, blocking, and contact removal work?
- Need browser verification of authentication scrolling and the existing chat flow.
- No tests have been written or run yet.