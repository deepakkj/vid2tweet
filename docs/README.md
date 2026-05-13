# Vid2Tweet Documentation

## Core Docs

- [Architecture & Design](ARCHITECTURE.md)
- [Flow Reference](FLOWS.md)
- [Local Setup Guide](setup/LOCAL_SETUP.md)
- [Contributing](CONTRIBUTING.md)
- [Future Scope & Roadmap](ROADMAP.md)
- [Design System](../DESIGN.md)

## Diagrams

- [System Context](diagrams/architecture/system-context.puml)
- [Container Diagram](diagrams/architecture/container-diagram.puml)
- [Pipeline Flow](diagrams/flows/pipeline-flow.puml)
- [Trigger Sequence](diagrams/sequences/trigger-pipeline.puml)

## Implementation Anchors

- Main flow: `kestra/workflows/content-pipeline.yml`
- Task subflows: `kestra/workflows/tasks/*.yml`
- Frontend trigger route: `frontend/src/app/api/pipeline/trigger/route.ts`
- Frontend poll/resume helpers: `frontend/src/lib/kestra-client.ts`
- X auth routes: `frontend/src/app/api/auth/twitter/*`
- Pipeline UI: `frontend/src/app/pipeline/[id]/page.tsx`
