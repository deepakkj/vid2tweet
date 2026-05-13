# Contributing to Vid2Tweet

Vid2Tweet is a workflow-driven project, so changes usually touch both implementation and documentation.

## Where To Change Things

- `kestra/workflows/` — orchestrator and task subflows
- `frontend/src/app/` — UI pages and Next.js route handlers
- `frontend/src/lib/` — Kestra API client helpers
- `frontend/src/types/` — shared execution and task types
- `scripts/` — local setup and flow deployment helpers
- `docs/` — architecture, setup, and flow reference docs

## Workflow Changes

If you change any Kestra flow:

1. Update the YAML in `kestra/workflows/`
2. Keep inputs and descriptions consistent between `content-pipeline.yml` and any mirrored subflow inputs
3. Update [Flow Reference](FLOWS.md)
4. Update [Architecture & Design](ARCHITECTURE.md) if the end-to-end behavior changed
5. Update diagrams in `docs/diagrams/` if the sequence or system shape changed

## Frontend Changes

If you change the frontend trigger, polling, approval, or auth behavior:

1. Update the relevant files in `frontend/src/app/` and `frontend/src/lib/`
2. Update setup docs if env vars or credentials changed
3. Update architecture docs if the interaction between frontend and Kestra changed

## Verification Checklist

Before opening a PR:

1. `podman compose up -d`
2. `./scripts/deploy-flows.sh`
3. `cd frontend && npm install && npm run build`
4. Trigger a local pipeline run if your change affects flow behavior
5. Update documentation for any changed user flow, architecture, env var, or workflow contract

## Documentation Rules

- Keep README and `docs/` aligned with the live flow YAML and frontend behavior
- Do not leave stale setup steps after env var or auth changes
- Prefer documenting exact flow names, input names, and artifact names

## Design Principles

- **DRY** — extract shared logic when it reduces repetition
- **SOLID** — keep each flow or UI module focused
- **KISS** — optimize for hackathon clarity and fast iteration
- **YAGNI** — avoid speculative abstractions
