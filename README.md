# 💬 Whisper — Real-time DM Chat App

A beautiful private messaging app built with React + Firebase.

---

## 🔥 Firebase Setup (Step-by-step)

### 1. Create a Firebase Project
1. Go to https://console.firebase.google.com
2. Click **"Add project"** → name it (e.g. `whisper-chat`) → continue
3. Disable Google Analytics if you don't need it → **Create project**

### 2. Enable Authentication
1. In the Firebase console sidebar: **Build → Authentication**
2. Click **"Get started"**
3. Under **Sign-in providers**, enable **Google**
4. Set a support email → **Save**

### 3. Create Firestore Database
1. Sidebar: **Build → Firestore Database**
2. Click **"Create database"**
3. Choose **"Start in test mode"** for now (we'll add rules later)
4. Pick a region close to you → **Done**

### 4. Add a Web App & Get Credentials
1. Go to **Project Settings** (gear icon ⚙️ next to "Project Overview")
2. Scroll to **"Your apps"** → click the **`</>`** (Web) icon
3. Register the app (any nickname) → **Register app**
4. Copy the `firebaseConfig` object shown

### 5. Paste Your Credentials
Open `src/lib/firebase.js` and replace the placeholder values:

```js
const firebaseConfig = {
  apiKey: "AIza...",           // ← your real values
  authDomain: "your-app.firebaseapp.com",
  projectId: "your-app",
  storageBucket: "your-app.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:123:web:abc"
};
```

### 6. Set Firestore Security Rules
1. In Firebase Console: **Firestore → Rules** tab
2. Delete all existing content
3. Copy & paste everything from `firestore.rules` in this project
4. Click **Publish**

---

## 🚀 Running the App

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Open http://localhost:5173

---

## 🗂 Project Structure

```
src/
├── lib/
│   └── firebase.js         # Firebase config & exports
├── hooks/
│   └── useAuth.js          # Auth context + Google sign-in
├── components/
│   ├── Sidebar.jsx         # Conversations list + user search
│   └── ChatWindow.jsx      # Real-time message thread
├── pages/
│   ├── Login.jsx           # Google sign-in page
│   └── Home.jsx            # Main app layout
├── App.jsx                 # Router + protected routes
├── main.jsx                # Entry point
└── index.css               # All styles
```

---

## ✨ Features

- **Google Sign-in** — one-click auth
- **User search** — find anyone by name or email
- **Real-time messages** — Firestore live listeners
- **Typing indicators** — animated dots when the other person types
- **Message timestamps** — grouped by date
- **Conversation list** — sorted by latest message
- **Secure** — Firestore rules ensure privacy between users

---

## 🏗 Build for Production

```bash
npm run build
```

Deploy the `dist/` folder to Firebase Hosting, Vercel, or Netlify.
