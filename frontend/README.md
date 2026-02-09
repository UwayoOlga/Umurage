# Umurage Frontend

Modern PWA for Umurage Savings Groups platform.

## Features

- ✅ **PWA Ready**: Installable, offline-capable (needs service worker config)
- ✅ **Responsive**: Mobile-first design for all devices
- ✅ **Modern UI**: Clean, minimal fintech aesthetic
- ✅ **Tailwind CSS v4**: Fast, flexible styling
- ✅ **Components**: Reusable UI components (Card, StatCard)
- ✅ **Layouts**: Sidebar for desktop, Bottom Nav for mobile

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript
- **Icons**: Lucide React

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
frontend/
├── app/
│   ├── layout.tsx       # Main layout (Sidebar + Mobile Nav)
│   ├── page.tsx         # Dashboard page
│   └── globals.css      # Global styles & Tailwind theme
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx  # Desktop navigation
│   │   └── MobileNav.tsx # Mobile navigation
│   └── ui/
│       └── card.tsx     # Card components
├── lib/
│   └── utils.ts         # Utility functions
└── public/
    └── manifest.json    # PWA manifest
```

## Next Steps

- [ ] Implement robust service worker for offline support
- [ ] Connect API endpoints
- [ ] Add more screens (Members, Savings, Loans)
- [ ] Implement authentication flow
