# CodeSync 🚀

[![Vercel Deployment](https://img.shields.io/badge/Vercel-View_Live-000000?style=for-the-badge&logo=vercel)](https://codesync-seven.vercel.app)

**CodeSync** is a premium, high-performance real-time collaborative code editor designed for modern development teams. Built with a "Top 1%" luxury aesthetic, it provides a seamless and immersive environment for pair programming, team collaboration, and AI-assisted building.

## ✨ Features

- **Real-time Synchronization**: Powered by **Yjs** and **WebSockets**, experience absolute zero latency. Your code stays in sync across all clients, instantly.
- **Shared Presence**: Multi-cursor support and presence indicators let you see exactly what your team is working on in real-time.
- **Bespoke UI/UX**: A luxury ultra-dark theme (Pure Black & Charcoal) with high-end typography (**Inter**, **Outfit**) and soft, velvety animations.
- **Modern Tech**: Recently upgraded to **Next.js 16** with **React 19** for peak performance and stability.
- **Extreme Robustness**: Intelligent error handling that gracefully manages missing environment variables, ensuring an uninterrupted experience.

## 🛠 Tech Stack

- **[Next.js 16](https://nextjs.org/)**: The latest in production-grade web frameworks.
- **[React 19](https://react.dev/)**: Building interactive and modern user interfaces.
- **[Supabase SSR](https://supabase.com/)**: Secure authentication and high-performance server-side rendering.
- **[Monaco Editor](https://microsoft.github.io/monaco-editor/)**: The powering engine behind VS Code.
- **[Yjs](https://yjs.dev/)**: High-performance CRDT library for seamless collaboration.
- **[Framer Motion](https://www.framer.com/motion/)**: For premium, smooth animations and transitions.

## 🚀 Live Demo

Check out the live deployment here:  
👉 **[codesync-seven.vercel.app](https://codesync-seven.vercel.app)**

## ⚙️ Setup

1. **Clone & Install**
   ```bash
   git clone https://github.com/Chehak7/codesync.git
   npm install
   ```

2. **Environment Variables**
   Create a `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   # Exact public origin used for server-side authentication redirects.
   APP_ORIGIN=http://localhost:3000
   ```

3. **Run**
   ```bash
   npm run dev
   ```

## 📜 License

MIT License - Copyright (c) 2026.
