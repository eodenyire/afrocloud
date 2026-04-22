# Architecture Overview

Canonical architecture references:
- `docs/04_ARCHITECTURE.md`
- `docs/09_CONTROL_PLANE.md`

## Architectural Layers
- Experience layer (auth, onboarding, console, service pages).
- Control plane domain logic (`src/lib`).
- Persistence and policy layer (Supabase schema + migrations).
- Operations and release controls (runbooks, release plan).
