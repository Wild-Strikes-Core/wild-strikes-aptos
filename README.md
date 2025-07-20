# 🕹️ Wildverse Monorepo

Welcome to the Wildverse Monorepo — a modular game platform powered by **Next.js**, **Phaser**, **Socket.IO**, and **Aptos**. This architecture is designed for scalability, clean separation of concerns, and a robust multiplayer experience.

---

## 💻 Tech Stack

-   **Framework**: [Next.js](https://nextjs.org/) (React)
-   **Game Engine**: [Phaser](https://phaser.io/)
-   **Backend**: [Node.js](https://nodejs.org/) with [Socket.IO](https://socket.io/) for real-time communication
-   **Blockchain**: [Aptos](https://aptos.dev/) for wallet integration
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **Tooling**: [Turborepo](https://turbo.build/repo) for monorepo management
-   **Package Manager**: [pnpm](https://pnpm.io/)

---

## 📦 Monorepo Architecture

The structure is divided into `apps` (runnable applications) and `packages` (shared libraries). This enforces a strong Separation of Concerns (SoC).

```
wildverse-monorepo/
├── apps/
│ ├── web/              # Next.js frontend: Site pages & game canvases
│ ├── backend/          # Socket.IO server for multiplayer
│ └── wildstrikes-game/ # React component wrapper for the Wildstrikes game
│
├── packages/
│ ├── phaser-games/
│ │ └── wildstrikes/  # Pure Phaser game logic (scenes, assets)
│ ├── phaser-ui/        # Reusable Phaser UI components (buttons, etc.)
│ ├── socket-client/    # Frontend hooks for Socket.IO
│ ├── aptos-wallet/     # Aptos wallet connection and transaction helpers
│ └── shared-utils/     # Shared constants, types, and utilities
│
├── tsconfig.json       # Shared TypeScript config for path aliases
└── package.json        # Root scripts and dependencies
```

### Application Roles (`apps/`)

-   `apps/web`: The main Next.js frontend. It handles all standard web pages (homepage, profiles) and serves as the entry point for games. For example, the page at `/games/wildstrikes` is responsible for rendering the Phaser canvas by using the component from `apps/wildstrikes-game`.

-   `apps/backend`: The authoritative Node.js server for multiplayer gameplay. It uses **Socket.IO Namespaces** to manage game state, player connections, and database interactions separately for each game.

-   `apps/wildstrikes-game`: This is a "bridge" package, not a standalone app. It exports a React component (`<WildstrikesCanvas />`) that handles the logic for initializing and mounting the Phaser game instance. This isolates the game's bootstrap logic from the main `web` app.

### Shared Logic Roles (`packages/`)

-   `packages/phaser-games/wildstrikes`: Contains the **pure** game logic for Wildstrikes. This includes all Phaser Scenes, entities, assets, and constants. This code is framework-agnostic and has no knowledge of React.

-   `packages/phaser-ui`: A library of reusable UI components for use within Phaser scenes (e.g., stylized buttons, health bars).

-   `packages/socket-client`: Provides simple React hooks (`useSocket`, `useSocketEvent`) for the frontend to communicate with the `apps/backend` server.

---

## 🚀 Getting Started

1.  **Install dependencies**
    ```bash
    pnpm install
    ```

2.  **Run all apps in parallel**
    ```bash
    pnpm turbo run dev --parallel
    ```
    - Next.js frontend → `http://localhost:3000`
    - Socket.IO backend → `http://localhost:3001`

---

### 🧠 Key Concepts

#### 🔁 Separation of Concerns (SoC)

-   **Web vs. Game:** The `apps/web` app knows *how to display* a game, but `packages/phaser-games` knows *how to play* the game.
-   **Game-Specific Wrappers:** Logic to connect a Phaser game to React lives in a dedicated package like `apps/wildstrikes-game`.
-   **Backend Scalability**: The backend is kept separate. To support new games, you can add new **Socket.IO Namespaces** (e.g., `io.of('/battlezone')`) to keep the real-time logic isolated and clean.

#### 🎮 Scalable Game Support

To add a new game (e.g., "Battlezone"):
1.  Create `packages/phaser-games/battlezone` for the core game logic.
2.  Create `apps/battlezone-game` to export its React component wrapper.
3.  Add a new page in `apps/web` (e.g., `/games/battlezone`) to render it.
4.  (If multiplayer) Add a new namespace in `apps/backend` to handle its server logic.

#### 🧱 Reusable UI Components

Write once, use anywhere:

```javascript
createPhaserButton(scene, x, y, texture, onClick);
```

### 🔧 Development Tips

- Use `'use client'` and `dynamic(..., { ssr: false })` for Phaser components.
- Destroy the Phaser game properly on unmount.
- Use path aliases (`@phaser-games/*`, `@phaser-ui/*`) for clean imports.

### 📌 Common Commands

| Task                          | Command                                                  |
| ----------------------------- | -------------------------------------------------------- |
| Install dependencies          | `pnpm install`                                           |
| Run all apps                  | `pnpm turbo run dev --parallel`                          |
| Run just the frontend         | `cd apps/web && pnpm dev`                                |
| Add dep to all packages       | `pnpm add <pkg> -w`                                      |
| Add dep to specific package   | `cd packages/phaser-games/wildstrikes && pnpm add <pkg>` |

### 🤝 Contributing

- Keep your code modular.
- Don’t add Phaser logic directly to React pages.
- Use shared packages whenever possible.

### 🛠️ Troubleshooting

- **Blank canvas?** Make sure you're mounting Phaser in a `'use client'` dynamic component.
- **Path errors?** Check `tsconfig.json` and `pnpm-workspace.yaml`.
- **Socket.IO not connecting?** Confirm backend is running at port `3001`.
- 
Game on 🎮🚀

## Multiplayer Dev Workflow

1. `pnpm dev` – starts web & backend.
2. Jest tests: `pnpm --filter backend test`
3. Asset check: `pnpm ts-node packages/shared-utils/asset-check.ts`
4. Perf logging – import and start `PerformanceLogger` in any client scene.

Socket Events reference lives in `packages/shared-utils/socket-events.ts`.
