# Authentication Frontend - React + Tailwind CSS

Modern React.js frontend for the authentication system with Tailwind CSS styling.

## 🚀 Quick Start

### Development Setup

1. **Start Backend Server (Terminal 1):**
    ```bash
    cd "c:\Users\Al-Hussain Com\Downloads\authentication"
    npm install
    npm start
    ```

2. **Start React Frontend (Terminal 2):**
    ```bash
    cd "c:\Users\Al-Hussain Com\Downloads\authentication\frontend-react"
    npm install
    npm run dev
    ```

3. **Access Application:**
   - Frontend: `http://localhost:5173` or `http://localhost:3000`
   - Backend API: `http://localhost:5000/api`
   - Health Check: `http://localhost:5000/api/health`

### Production Build

```bash
cd frontend-react
npm run build
```

## 🛠 Technology Stack

- **React 18** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **Context API** - State management

## 📁 Project Structure

```
frontend-react/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── Button.jsx     # Custom button component
│   │   ├── Input.jsx      # Form input component
│   │   ├── ErrorMessage.jsx # Error display
│   │   ├── LoadingSpinner.jsx # Loading indicator
│   │   └── ProtectedRoute.jsx # Route protection
│   ├── context/
│   │   └── AuthContext.jsx # Authentication state
│   ├── pages/
│   │   ├── Login.jsx      # Login page
│   │   ├── Signup.jsx     # Registration page
│   │   └── Dashboard.jsx  # User dashboard
│   ├── services/
│   │   └── api.js         # API configuration
│   ├── App.jsx            # Main app component
│   ├── main.jsx           # React entry point
│   └── index.css          # Tailwind imports
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## 🔐 Authentication Flow

1. **Login/Signup** → JWT token stored in localStorage
2. **API Requests** → Token automatically attached to headers
3. **Route Protection** → Protected routes check authentication
4. **Auto Logout** → Invalid tokens trigger automatic logout

## 🌐 API Integration

The frontend communicates with backend endpoints:

- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

## 🎨 Styling with Tailwind CSS

All components use Tailwind utility classes:
- Responsive design with `sm:`, `md:`, `lg:` breakpoints
- Color scheme with `blue-600`, `gray-50`, etc.
- Hover effects with `hover:bg-blue-700`
- Focus states with `focus:ring-2`

## 🔧 Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## ⚠️ Important Notes

1. **Backend Required**: Make sure backend server is running on port 5000
2. **CORS Configured**: Backend allows requests from React dev server
3. **Environment Variables**: Uses `.env` file for API configuration
4. **Token Storage**: JWT tokens stored in localStorage
5. **Auto Redirect**: Users redirected based on authentication status

## 🐛 Troubleshooting

### Network Errors
- Ensure backend is running: `npm start` in main directory
- Check API URL in console logs
- Verify MongoDB connection

### Build Issues
- Clear node_modules: `rm -rf node_modules && npm install`
- Check for missing dependencies
- Ensure all imports are correct

### Authentication Issues
- Clear localStorage: `localStorage.clear()`
- Check JWT_SECRET in backend .env
- Verify MongoDB user creation

## 📱 Features

- ✅ User Registration & Login
- ✅ JWT Token Authentication
- ✅ Protected Routes
- ✅ Responsive Design
- ✅ Form Validation
- ✅ Error Handling
- ✅ Loading States
- ✅ Auto Logout
- ✅ Clean UI with Tailwind CSS

## 🔄 Old HTML Frontend Removed

This React frontend replaces the old HTML/CSS/JS frontend. The backend remains unchanged and fully compatible.
