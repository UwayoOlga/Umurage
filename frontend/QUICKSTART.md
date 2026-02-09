# Umurage Frontend - Quick Start

## ✅ What's Been Set Up

The frontend is fully configured with a modern PWA architecture!

### Tech Stack
- **Next.js 15** (App Router)
- **Tailwind CSS v4** (Modern logic-based styling)
- **TypeScript**
- **Lucide React** (Icons)
- **PWA** (Manifest ready)

### Project Structure
```
frontend/
├── app/
│   ├── layout.tsx       ✅ Responsive Shell (Sidebar/MobileNav)
│   ├── page.tsx         ✅ Modern Dashboard UI
│   └── globals.css      ✅ Fintech Theme Configuration
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx  ✅ Desktop Navigation
│   │   └── MobileNav.tsx ✅ Mobile Bottom Navigation
│   └── ui/
│       └── card.tsx     ✅ Reusable Card Components
├── lib/
│   └── utils.ts         ✅ CSS Utilities
└── public/
    └── manifest.json    ✅ PWA Config
```

## 🚀 How to Run

1. **Install dependencies** (if not done):
   ```bash
   cd frontend
   npm install
   ```
   *Note: If you see errors about `lucide-react` or `clsx`, run:*
   ```bash
   npm install lucide-react clsx tailwind-merge
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```

3. **Open Browser**:
   Go to [http://localhost:3000](http://localhost:3000)

## 📱 Mobile features

To test mobile view:
- Open Developer Tools (F12)
- Toggle Device Toolbar (Ctrl+Shift+M)
- Select a mobile device (e.g., iPhone 12)
- You'll see the **Bottom Navigation** appear and Sidebar disappear!

## 🎨 Customization

- **Colors**: Edit `app/globals.css` to change the `--color-primary` variables.
- **Navigation**: Update `components/layout/Sidebar.tsx` and `MobileNav.tsx`.
- **Dashboard**: Edit `app/page.tsx` to add real data.

## 🔜 Next Steps

1. Connect to Backend API (in `backend/` folder)
2. Create pages for Members, Savings, Loans
3. Add Authentication forms (Login/Register)
