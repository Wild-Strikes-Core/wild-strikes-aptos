# Wildstrikes Multiplayer MVP – Task Tracker

> This file mirrors the internal TODO list and will be updated as work progresses.

| ID | Task | Status | Description/Acceptance Criteria |
|----|------|--------|---------------------------------|
| arch-audit | Architecture audit | in_progress | Map current client ↔ server socket flow, document discrepancies, decide refactor points. Deliver architecture diagram + notes. |
| shared-utils | Consolidate shared utils | completed | Barrel exports (`index.ts`) + socket‐events typing file added. Aliases resolvable from `@shared/*`. |
| socket-types | Strict socket typings | completed | All event names & payloads defined in `packages/shared-utils/socket-events.ts`. |
| backend-refactor | Authoritative server logic | pending | • Replace legacy `playerMoved` with `playerInput` ingestion  • Integrate movement/jump/attack each tick  • Guard inputs, broadcast authoritative state  • Use `SOCKET_EVENTS` constants everywhere |
| arena-networking | Client networking wrap | completed | `ArenaNetworking` typed, new emit path, reconciles authoritative state. |
| arena-client | Prediction + reconciliation + interpolation | completed | Local input buffering, server reconciliation, smoothing of remote sprites, duplicate-sprite guard. |
| tests-core | Backend unit tests | pending | Jest tests for:   1. match creation   2. timer expiry   3. attack hit-detection;  all pass. |
| tests-e2e | Headless 2-client integration test | pending | Spin two Phaser headless clients w/ fake latency; assert convergence & KO flow. |
| asset-check | Asset verification script | pending | Node script scans every asset-pack referenced in BootScene & ensures files exist; produces warning list. |
| perf-profile | Performance & latency metrics | pending | Log FPS, RTT, packet sizes every 5 s in dev; export CSV for analysis. |
| docs | README / Developer docs | pending | Update repo README sections: setup, dev workflow, socket events, tests, deployment. |

---

## How to update this file

When completing a task:
1. Change its **Status** to `completed` (or `in_progress`, `cancelled`).
2. Optionally add a short note in *Description* of what was delivered.
3. Commit the edit with the implementation commit.

This keeps the project roadmap visible to all contributors. 👍 