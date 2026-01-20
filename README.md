# Refer and Earn App

A simple React app with Google OAuth authentication and Express.js backend.

## Project Structure

```
refer-and-earn/
├── client/          # React frontend
└── server/          # Express.js backend
```

## Setup Instructions

### Backend Setup

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the server directory:
```bash
PORT=8000
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

4. Set up Google OAuth:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable Google+ API
   - Go to "Credentials" and create OAuth 2.0 Client ID
   - Add authorized redirect URI: `http://localhost:5000/api/auth/google/callback`
   - Copy the Client ID and Client Secret to your `.env` file

5. Start the server:
```bash
npm start
# or for development with auto-reload:
npm run dev
```

### Frontend Setup

1. Navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The app will open at `http://localhost:3000`

## Features

- Google OAuth login
- Protected routes
- JWT token authentication
- Modern UI with Tailwind CSS

## Tech Stack

### Frontend
- React
- React Router
- Tailwind CSS

### Backend
- Express.js
- Passport.js (Google OAuth)
- JWT for token authentication
- CORS enabled
