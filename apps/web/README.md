<div align="center">

# 🌐 Web Frontend - Wild Strikes 🥊

### ⚡ Next.js 15 Frontend Application with React 19 & TailwindCSS 4 ⚡

<img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js" alt="Next.js 15" />
<img src="https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react" alt="React 19" />
<img src="https://img.shields.io/badge/TailwindCSS-4-06b6d4?style=for-the-badge&logo=tailwindcss" alt="TailwindCSS 4" />
<img src="https://img.shields.io/badge/TypeScript-5-3178c6?style=for-the-badge&logo=typescript" alt="TypeScript" />

**🎮 The ultimate fighting game frontend experience**
**🌍 Built for performance, scalability, and developer happiness**

</div>

---

## 🚀 Quick Start

<div align="center">

### 🎯 **Get your frontend running in seconds!** 🎯

</div>

```bash
# 🏠 From root directory
pnpm install
pnpm dev

# 📁 Or run individually
cd apps/web
pnpm dev
```

<div align="center">

🌐 **The web app will be available at `http://localhost:3000`** 🌐

</div>

## 📁 Project Structure

<div align="center">

```
🌐 apps/web/
├── 📱 app/                        # Next.js App Router
│   ├── 🎨 globals.css            # Global Styles
│   ├── 🏗️ layout.tsx             # Root Layout
│   ├── 🏠 page.tsx               # Home Page
│   ├── 🧩 components/            # Shared Components
│   ├── 🛬 landing/               # Landing Page
│   └── 🎮 wildstrikes/           # Game Page
├── 🌍 public/                     # Static Assets
│   ├── 🎨 assets/                # Game Assets
│   └── 🌟 favicon.svg            # Site Favicon
├── 🛬 Landing/                    # Landing Page Components
├── 📦 package.json               # Dependencies & Scripts
├── ⚙️ next.config.ts             # Next.js Configuration
├── 🎨 tailwind.config.js         # TailwindCSS Configuration
└── 🔧 tsconfig.json              # TypeScript Configuration
```

</div>

## 🛠 Available Scripts

<div align="center">

| Command | Description | Icon |
|---------|-------------|------|
| `pnpm dev` | 🚀 Start development server (with platform detection) | ⚡ |
| `pnpm dev:webpack` | 🔄 Start with webpack (fallback) | 📦 |
| `pnpm dev:turbo` | ⚡ Start with turbopack | 🚀 |
| `pnpm build` | 🏗️ Build for production | 📦 |
| `pnpm start` | ▶️ Start production server | 🌐 |
| `pnpm lint` | 🔍 Run ESLint | ✅ |

</div>

## 🎮 Game Integration

<div align="center">

### 🔗 **Seamless Multi-Service Integration** 🔗

</div>

<table align="center">
<tr>
<td align="center">
<h4>🎮 Phaser Game</h4>
<p><code>@phaser-games/wildstrikes</code></p>
<p><em>Core Game Engine Package</em></p>
</td>
<td align="center">
<h4>🔌 Socket.IO</h4>
<p><em>Real-time Communication</em></p>
<p><em>Multiplayer Backend</em></p>
</td>
<td align="center">
<h4>🖼️ Game Canvas</h4>
<p><code>WildstrikesCanvas.tsx</code></p>
<p><em>Game Rendering Component</em></p>
</td>
</tr>
</table>

## 🔧 Configuration

### ⚙️ Environment Variables
Create `.env.local` in this directory:

```bash
# 🌐 Backend Connection
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001

# 🎮 Development Mode
NEXT_PUBLIC_GAME_MODE=development
```

### 🎯 Platform Detection
The app automatically detects your platform and optimizes the development experience:

<div align="center">

| Platform | Optimization | Status |
|----------|-------------|--------|
| 🐧 **Linux/macOS** | Uses Turbopack by default | ✅ Optimized |
| 🪟 **Windows** | Falls back to webpack if needed | ✅ Supported |

</div>

## 🎨 Styling

<div align="center">

### 💅 **Modern Styling Architecture** 💅

</div>

<table align="center">
<tr>
<th>Technology</th>
<th>Purpose</th>
<th>Location</th>
</tr>
<tr>
<td>🎨 <strong>TailwindCSS 4</strong></td>
<td>Latest version with improved performance</td>
<td>Utility-First CSS Framework</td>
</tr>
<tr>
<td>🌐 <strong>Global Styles</strong></td>
<td>Base application styles</td>
<td><code>app/globals.css</code></td>
</tr>
<tr>
<td>🧩 <strong>Component Styles</strong></td>
<td>Co-located with components</td>
<td>Individual Component Files</td>
</tr>
<tr>
<td>🎮 <strong>Game Assets</strong></td>
<td>Organized game resources</td>
<td><code>public/assets/</code></td>
</tr>
</table>

## 🔗 Links

<div align="center">

### 🌐 **Service Connections** 🌐

</div>

<table align="center">
<tr>
<td align="center">
<h4>🔌 Backend API</h4>
<p>Socket.IO server on port 3001</p>
<p><code>http://localhost:3001</code></p>
</td>
<td align="center">
<h4>🎮 Game Package</h4>
<p>Uses <code>@phaser-games/wildstrikes</code></p>
<p><em>Automatically linked</em></p>
</td>
<td align="center">
<h4>🛬 Landing Page</h4>
<p>Separate components in <code>Landing/</code></p>
<p><em>Modular design</em></p>
</td>
</tr>
</table>

## 📝 Development Notes

<div align="center">

### ⚡ **Modern Development Experience** ⚡

</div>

<table align="center">
<tr>
<th>Feature</th>
<th>Technology</th>
<th>Benefit</th>
</tr>
<tr>
<td>🛣️ <strong>App Router</strong></td>
<td>Next.js App Router (not Pages Router)</td>
<td>Modern routing system</td>
</tr>
<tr>
<td>🔒 <strong>Type Safety</strong></td>
<td>TypeScript strict mode enabled</td>
<td>Compile-time error checking</td>
</tr>
<tr>
<td>📏 <strong>Code Quality</strong></td>
<td>ESLint v9 with flat config</td>
<td>Consistent code style</td>
</tr>
<tr>
<td>🔥 <strong>Hot Reloading</strong></td>
<td>Built-in development server</td>
<td>Rapid development cycle</td>
</tr>
<tr>
<td>🌍 <strong>Platform Independent</strong></td>
<td>Universal build process</td>
<td>Works on any OS</td>
</tr>
</table>

## 🐛 Troubleshooting

<div align="center">

### 🔧 **Common Issues & Quick Fixes** 🔧

</div>

<details>
<summary><strong>🚦 Port Issues</strong></summary>

**Problem**: Port 3000 is busy
**Solution**: Next.js will automatically use the next available port.

</details>

<details>
<summary><strong>🏗️ Build Errors</strong></summary>

```bash
# 🧹 Clear Next.js cache
rm -rf .next
pnpm build
```

</details>

<details>
<summary><strong>🔍 TypeScript Errors</strong></summary>

```bash
# ✅ Check types
pnpm type-check
```

</details>

---

<div align="center">

### 🆘 **Need More Help?**

For additional troubleshooting, see the **[main README](../../README.md)** troubleshooting section.

**🎮 Happy Frontend Development! ✨**

</div>
