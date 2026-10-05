# Craft AI — Your Photo. Every Story.
## Complete Production-Ready Web Application
### React + Vite + TypeScript + Tailwind CSS + Node.js + Express + Firebase + Cloudinary

Craft AI is a personalized social media Story and Status creation platform. Users upload their photo once, and the application automatically personalizes over 45+ creative 9:16 vertical templates ready for instant export in 1080 × 1920 HD and direct sharing across WhatsApp, Instagram, Facebook, and Telegram.

---

## 🎨 Design System & Storyboard Fidelity
This application faithfully reproduces both reference storyboards:
1. **Desktop Website Storyboard**:
   - Fixed left sidebar navigation with soft purple active states (`#F3E8FF`, `#7C3AED`)
   - Top navbar with search, notifications, and user avatar dropdown
   - Large workspace with responsive 4-5 column vertical 9:16 template cards
   - Template details panel with similar templates thumbnail carousel
   - Final result workspace with 1080×1920 canvas export, adjust controls, and sharing
2. **Mobile App Storyboard**:
   - Modern white theme (`#FFFFFF`) with subtle pastel category accents
   - Top bar with Craft AI stylized gradient C logo, search, and VIP crown badge
   - Floating circular gradient `+` button in bottom navigation
   - 2-column mobile template grids and safe-area padding
   - Dedicated flow: Splash → Onboarding → Signup/Login → Add Photo → Photo Processing → Mood Selection → Home

---

## 🚀 Exact Technology Stack
- **Frontend**: React 19, Vite 8, TypeScript, Tailwind CSS v4, React Router DOM v7, Framer Motion, Lucide React, HTML5 Canvas API (1080×1920 HD rendering), Canvas Confetti.
- **Backend**: Node.js, Express.js, TypeScript, TSX runtime, Multer, Cors, Dotenv.
- **Database**: Firebase Firestore (`users`, `categories`, `templates`, `generatedCreatives`, `favorites`, `notifications`, `adminUsers`).
- **Authentication**: Firebase Authentication (Google, Email/Password, Apple & Facebook integration hooks).
- **Asset Storage & Cloud**: Cloudinary SDK (Direct and signed buffer uploads, secure transformations).
- **Personalization Engine**: Data-driven normalized coordinate slots (`subjectSlot: { x, y, width, height, fit, removeBackground, rotation }`) with zero hardcoded layouts.

---

## 📂 Project Structure
```
craft-ai/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/         # Logo, StoryCard
│   │   │   ├── layout/         # DesktopLayout, MobileLayout, ResponsiveLayout
│   │   │   └── modals/         # ShareModal, AdjustModal
│   │   ├── constants/          # 48+ pre-seeded templates, categories & demo assets
│   │   ├── contexts/           # AuthContext, CreativesContext
│   │   ├── firebase/           # Client Firebase initialization & fallback handling
│   │   ├── pages/
│   │   │   ├── admin/          # AdminDashboard
│   │   │   ├── public/         # Splash, Onboarding, Signup, Login, ForgotPassword, AddPhoto, PhotoProcessing, MoodSelection
│   │   │   └── user/           # HomeDashboard, Categories, TemplateGrid, TemplatePreview, FinalResult, VideoStories, MyCreations, Profile, Settings, Search
│   │   ├── services/           # api.ts (backend client), canvasRenderer.ts (1080x1920 engine)
│   │   ├── types/              # Type definitions
│   │   ├── App.tsx             # Application router
│   │   ├── index.css           # Brand gradient tokens, fonts & Tailwind utilities
│   │   └── main.tsx
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── backend/
│   ├── src/
│   │   ├── config/             # firebase.ts, cloudinary.ts
│   │   ├── controllers/        # upload, template, category, creative, user, admin
│   │   ├── middleware/         # auth, admin, errorHandler
│   │   ├── routes/             # upload, template, category, creative, user, admin
│   │   ├── services/           # cloudinary, firebase, image, template
│   │   ├── types/              # Data models
│   │   ├── app.ts              # Express application config
│   │   └── server.ts           # Server entrypoint (Port 5000)
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── package.json
└── README.md
```

---

## 🛠️ Getting Started Locally

### 1. Start Both Frontend and Backend
From the root workspace:

```bash
# Start backend on http://localhost:5000
npm run dev:backend

# Start frontend on http://localhost:5173
npm run dev
```

### 2. Environment Variables Configuration

#### Backend (`backend/.env`):
```env
PORT=5000
NODE_ENV=development

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Firebase Admin
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

#### Frontend (`frontend/.env`):
```env
VITE_API_BASE_URL=http://localhost:5000/api

# Firebase Web App
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-app
VITE_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef
```

*Note: When environment keys are not yet provided, the application gracefully activates in-memory local state and offline mock authentication with realistic demo data, ensuring complete zero-crash usability.*

---

## ✨ Features Implemented
1. **Logo Animation**: 2-second Framer Motion splash sequence with glowing pastel shapes, gradient C icon, and progress indicator.
2. **Landing Page**: Desktop hero with 3D overlapping fan of story cards and mobile onboarding.
3. **Authentication**: Google popup authentication, email/password signup, password reset email, and session persistence.
4. **Photo Upload & Processing**: Dashed upload frame, camera badge, front photo tips, 80% circular progress ring, and checklist.
5. **Mood Selection**: 2-column pastel categories matching reference icons and colors.
6. **Automatic Personalization**: User's photo is automatically positioned into 48+ 9:16 templates across 10 categories (Morning, Love, Sad, Breakup, Motivation, Attitude, Birthday, Festival, Trending, Video Stories).
7. **1080 × 1920 HD Export**: Client-side canvas engine renders high-res stories with typography, quotes, and badges.
8. **Adjust Controls**: Modal allowing interactive scale/zoom, horizontal shift, vertical shift, and rotation.
9. **Share Bottom Sheet**: Supports WhatsApp, Instagram, Facebook, Telegram, Web Share API, and clipboard copy.
10. **Admin Dashboard**: Overview metrics (users, templates, downloads, shares), table view, and slot coordinate adjuster.
