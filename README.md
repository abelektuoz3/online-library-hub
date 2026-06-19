# 📚 Online Library Hub

<div align="center">

![Online Library Hub](https://github.com/abelektuoz3/online-library-hub/blob/main/online-library-logo.png)

**A modern, full-featured digital library platform for students and learners**

[![Netlify Status](https://api.netlify.com/api/v1/badges/your-badge-id/deploy-status)](https://app.netlify.com/sites/online-library-hub/deploys)
[![Render](https://img.shields.io/badge/Render-Deployed-success)](https://online-library-hub.onrender.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

</div>

---

## 📖 Table of Contents

- [About The Project](#-about-the-project)
- [✨ Features](#-features)
- [🛠️ Tech Stack](#%EF%B8%8F-tech-stack)
- [📁 Project Structure](#-project-structure)
- [🚀 Getting Started](#-getting-started)
- [🔧 Environment Variables](#-environment-variables)
- [📡 API Endpoints](#-api-endpoints)
- [📦 Deployment](#-deployment)
- [🤝 Contributing](#-contributing)
- [👥 Contributors](#-contributors)
- [📄 License](#-license)
- [📞 Contact](#-contact)

---

## 📚 About The Project

**Online Library Hub** is a comprehensive digital library platform designed to provide students, educators, and lifelong learners with easy access to a vast collection of books, courses, and learning resources. The platform features a modern, intuitive interface with powerful search capabilities, user authentication, and administrative tools for content management.

### 🎯 What Makes It Special

- **📖 Extensive Resource Library** – Access thousands of books, e-books, textbooks, and reference materials across multiple categories and grade levels.
- **🎓 Course Management** – Browse and enroll in structured courses with modules, lessons, and multimedia content.
- **🔐 Secure Authentication** – Supports traditional email/password login as well as OAuth2 authentication via Google and GitHub.
- **👑 Admin Dashboard** – Comprehensive admin panel for managing users, resources, announcements, and messages.
- **📱 Responsive Design** – Works seamlessly across desktop, tablet, and mobile devices.

### 🎯 Built For

- **Students** – Access learning materials, track progress, and explore new subjects.
- **Educators** – Share resources, create courses, and engage with learners.
- **Librarians** – Manage digital collections and curate content.
- **Administrators** – Oversee platform operations and user management.

---

## ✨ Features

### 🔐 Authentication System
- Email/Password registration and login
- Google OAuth2 integration
- GitHub OAuth2 integration
- Email verification via OTP (One-Time Password)
- Password reset functionality with OTP verification
- Session management with JWT tokens
- "Remember Me" functionality
- Account suspension and user management

### 📚 Resource Management
- **Books & Resources**
  - Upload PDF, video, and audio files
  - Categorize by subject and grade level
  - Search and filter functionality
  - View and download resources
  - Availability status management

- **Courses**
  - Create structured courses with modules
  - Add lessons with multimedia content
  - Publish/unpublish courses
  - Organize by subject and grade level
  - Track lesson completion

### 👥 User Features
- User registration and profile management
- Learning progress tracking
- Resource bookmarking and favorites
- Community discussions and study groups
- Activity feed and notifications
- Study tools and learning analytics

### 🛡️ Admin Dashboard
- **Dashboard Overview** – Real-time stats and analytics
- **Resource Management** – Add, edit, and delete resources
- **User Management** – View, suspend, promote, and delete users
- **Announcements** – Post platform-wide updates
- **Message Management** – Read and respond to contact messages
- **Course Management** – Create and manage courses

### 🔍 Additional Features
- Advanced search with filters
- Responsive, mobile-first design
- Dark/light mode support
- Quick access to recent resources
- Study tools and learning aids
- Community discussion forums

---

## 🛠️ Tech Stack

### Frontend

| Technology | Purpose |
|------------|---------|
| **HTML5** | Structure and semantic markup |
| **CSS3** | Styling and responsive design |
| **JavaScript (Vanilla)** | Interactive functionality |
| **Font Awesome 6** | Icon library |
| **Google Fonts (Inter)** | Typography |

### Backend

| Technology | Purpose |
|------------|---------|
| **Node.js** | JavaScript runtime |
| **Express.js** | Web application framework |
| **MongoDB** | NoSQL database |
| **Mongoose** | MongoDB object modeling |
| **JWT (jsonwebtoken)** | Authentication |
| **Passport.js** | OAuth2 authentication strategy |
| **Multer** | File upload handling |
| **bcryptjs** | Password hashing |
| **Nodemailer/Brevo** | Email sending |

### Deployment & Hosting

| Service | Purpose |
|---------|---------|
| **Render** | Backend hosting and deployment |
| **Netlify** | Frontend hosting and deployment |
| **MongoDB Atlas** | Cloud database hosting |

### OAuth Providers
- **GitHub OAuth2** – GitHub account login
- **Google OAuth2** – Google account login

---

## 📁 Project Structure

```
online-library-hub/
│
├── backend/
│   ├── config/
│   │   ├── db.js                # MongoDB connection configuration
│   │   ├── multer.js            # Multer/GridFS configuration for file uploads
│   │   └── passport.js          # Google & GitHub OAuth strategy setup
│   │
│   ├── middleware/
│   │   └── upload.js            # Middleware handling file uploads
│   │
│   ├── models/
│   │   ├── Admin.js             # Schema defining administrative accounts
│   │   ├── Announcement.js      # Schema defining platform announcements
│   │   ├── Book.js              # Schema defining books and resource elements
│   │   ├── Contact.js           # Schema for user contact/inquiry messages
│   │   ├── Course.js            # Schema for structured interactive courses
│   │   ├── Feedback.js          # Schema for user feedback submissions
│   │   └── User.js              # Schema defining learner accounts
│   │
│   ├── routes/
│   │   ├── admin.js             # Route endpoints for administrator tasks
│   │   ├── announcement.js      # Route endpoints for system-wide announcements
│   │   ├── auth.js              # Route endpoints for standard credentials and OTP validation
│   │   ├── catalog.js           # Route endpoints for catalogs and downloads
│   │   ├── contact.js           # Route endpoints processing contact inquiries
│   │   ├── github-auth.js       # Route endpoints for GitHub login redirect and callback
│   │   └── google-auth.js       # Route endpoints for Google login redirect and callback
│   │
│   ├── utils/
│   │   └── email.js             # Central utility for SMTP emails and Brevo integration
│   │
│   ├── .env                     # Local environment configurations (ignored by Git)
│   ├── package.json             # Backend dependencies and startup scripts
│   ├── render.yaml              # Render deployment blueprints
│   └── server.js                # Core entry point starting the Express application
│
├── frontend/
│   ├── pages/
│   │   ├── about.html           # Platform informational page
│   │   ├── admin-announcements.html  # Manage announcements view
│   │   ├── admin-courses.html        # Create and manage courses view
│   │   ├── admin-dashboard.html      # Main admin statistics view
│   │   ├── admin-login.html          # Administrator login portal
│   │   ├── admin-messages.html       # Message inbox view for admins
│   │   ├── admin-register.html       # Create new administrators view
│   │   ├── admin-resources.html      # Add, edit, delete books view
│   │   ├── admin-users.html          # View/suspend user accounts view
│   │   ├── catalog.html         # Public resource catalog view
│   │   ├── contact.html         # Public feedback and inquiry page
│   │   ├── dashboard.html       # Personal student workspace and progress tracker
│   │   ├── faq.html             # FAQs page
│   │   ├── forgot-password.html # Recover password page
│   │   ├── login.html           # User login portal page
│   │   ├── otp-verification.html# Two-factor verification/registration entry page
│   │   ├── register.html        # Account creation page for learners
│   │   ├── reset-password.html  # Secure password reset page
│   │   ├── setup-admn.html      # Initialization view for system setup
│   │   └── study-tool.html      # Study tools workspace with a Pomodoro timer and notepad
│   │
│   ├── scripts/
│   │   ├── api-config.js        # Host definition configurations choosing production vs local
│   │   ├── catalog.js           # Interactive grid logic for catalog actions
│   │   ├── faq.js               # Event bindings for accordion interactions
│   │   ├── main.js              # Central scripts (theme settings, navbar, dynamic user data)
│   │   ├── timer.js             # Client functionality for study clocks and Pomodoro trackers
│   │   └── validation.js        # Form validation checks and rules
│   │
│   ├── style/
│   │   ├── catalog.css          # Rules defining catalog grid and filters layout
│   │   ├── forms.css            # Common layouts for forms, login pages, and inputs
│   │   └── style.css            # Primary core stylesheet with typography, headers, and dashboard widgets
│   │
│   ├── _redirects               # SPA URL redirects configured for Netlify
│   ├── auth-callback.html       # Landing handler verifying successful OAuth credentials
│   ├── auth-success.html        # Callback destination for success notifications
│   ├── index.html               # Main homepage portal
│   ├── netlify.toml             # Configuration instructions for deploying frontend on Netlify
│   └── oauth-verify.html        # Verification workflow page for OAuth logins
│
├── .gitignore               # List of ignored patterns for Git tracking
├── README.md                # Document containing workspace info and startup manuals
└── online-library-logo.png  # Application branding logo image
```

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or later)
- **npm** (v8 or later)
- **MongoDB** (local or Atlas account)
- **Git**

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/your-username/online-library-hub.git
cd online-library-hub
```

#### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb://localhost:27017/libraryhub

# JWT
JWT_SECRET=your_jwt_secret_here

# Session
SESSION_SECRET=your_session_secret_here

# Email (Brevo)
BREVO_API_KEY=your_brevo_api_key
SENDER_EMAIL=your_sender_email
SENDER_NAME=Online Library Hub

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Frontend URL
FRONTEND_URL=http://localhost:5500
```

#### 3. Frontend Setup

```bash
cd ../frontend
```

Create a `scripts/api-config.js` file:

```javascript
// scripts/api-config.js
const isProduction = window.location.hostname !== 'localhost' && 
                     window.location.hostname !== '127.0.0.1';

window.API_BASE = isProduction 
    ? 'https://online-library-hub.onrender.com/api'
    : 'http://localhost:5000/api';

window.BACKEND_BASE = isProduction
    ? 'https://online-library-hub.onrender.com'
    : 'http://localhost:5000';

window.UPLOADS_BASE = isProduction
    ? 'https://online-library-hub.onrender.com/uploads'
    : 'http://localhost:5000/uploads';

console.log('🔧 API Base URL:', window.API_BASE);
console.log('📁 Uploads Base URL:', window.UPLOADS_BASE);
```

#### 4. Run the Application

**Start the Backend:**

```bash
cd backend
npm run dev   # For development with nodemon
# OR
npm start     # For production
```

**Start the Frontend:**

You can use any static server like Live Server in VS Code or:

```bash
cd frontend
npx serve
```

#### 5. Access the Application

- **Frontend:** http://localhost:5500 (or port served by Live Server)
- **Backend:** http://localhost:5000
- **API Health Check:** http://localhost:5000/api/health

---

## 🔧 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 5000) |
| `NODE_ENV` | Environment | No (default: development) |
| `MONGO_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `SESSION_SECRET` | Session encryption secret | Yes |
| `BREVO_API_KEY` | Brevo email API key | No (fallback to console) |
| `SENDER_EMAIL` | Sender email address | No (fallback to console) |
| `SENDER_NAME` | Sender display name | No |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID | Yes (for GitHub login) |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret | Yes (for GitHub login) |
| `GITHUB_CALLBACK_URL` | GitHub OAuth callback URL | Yes (for GitHub login) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Yes (for Google login) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Yes (for Google login) |
| `GOOGLE_CALLBACK_URL` | Google OAuth callback URL | Yes (for Google login) |
| `FRONTEND_URL` | Frontend URL for redirects | No (default: netlify URL) |

---

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/verify` | Verify JWT token |
| POST | `/api/auth/change-password` | Change password |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password with OTP |
| POST | `/api/auth/verify-oauth-otp` | Verify OAuth OTP |

### OAuth

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/github` | Initiate GitHub login |
| GET | `/api/auth/github/callback` | GitHub callback |
| GET | `/api/auth/google` | Initiate Google login |
| GET | `/api/auth/google/callback` | Google callback |

### OTP

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/otp/send` | Send OTP for verification |
| POST | `/api/otp/verify` | Verify OTP |
| POST | `/api/otp/send-reset` | Send reset OTP |
| POST | `/api/otp/verify-reset` | Verify reset OTP |
| POST | `/api/auth/resend-oauth-otp` | Resend OAuth OTP |

### Catalog

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/catalog` | Get all resources |
| GET | `/api/catalog/:id` | Get single resource |

### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/login` | Admin login |
| GET | `/api/admin/verify` | Verify admin token |
| GET | `/api/admin/resources` | Get all resources |
| POST | `/api/admin/resources` | Create resource |
| PUT | `/api/admin/resources/:id` | Update resource |
| DELETE | `/api/admin/resources/:id` | Delete resource |
| GET | `/api/admin/users` | Get all users |
| DELETE | `/api/admin/users/:id` | Delete user |
| PATCH | `/api/admin/users/:id/role` | Update user role |
| PUT | `/api/admin/users/:id/make-admin` | Promote to admin |
| PUT | `/api/admin/users/:id/suspension` | Toggle user suspension |
| GET | `/api/admin/announcements` | Get announcements |
| POST | `/api/admin/announcements` | Create announcement |
| DELETE | `/api/admin/announcements/:id` | Delete announcement |
| GET | `/api/admin/messages` | Get contact messages |
| PUT | `/api/admin/messages/:id/read` | Mark message as read |
| DELETE | `/api/admin/messages/:id` | Delete message |
| GET | `/api/admin/stats` | Get admin statistics |

---

## 📦 Deployment

### Deploying Backend to Render

1. Push your code to GitHub
2. Go to [Render.com](https://render.com)
3. Click **New → Web Service**
4. Connect your GitHub repository
5. Configure:
   - **Name:** `online-library-hub`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
6. Add environment variables
7. Click **Create Web Service**

### Deploying Frontend to Netlify

1. Push your code to GitHub
2. Go to [Netlify.com](https://netlify.com)
3. Click **Add new site → Import an existing project**
4. Connect your GitHub repository
5. Configure:
   - **Build Command:** `echo 'No build needed'`
   - **Publish Directory:** `frontend`
   - **Base Directory:** (leave empty)
6. Click **Deploy site**

### Netlify Redirects (for SPA routing)

Create `frontend/_redirects`:

```text
# Redirect all 404s to index.html
/*  /index.html  200

# Redirect admin pages
/admin-dashboard  /pages/admin/admin-dashboard.html  200
/admin-dashboard.html  /pages/admin/admin-dashboard.html  200
/admin-resources  /pages/admin/admin-resources.html  200
/admin-resources.html  /pages/admin/admin-resources.html  200
/admin-users  /pages/admin/admin-users.html  200
/admin-users.html  /pages/admin/admin-users.html  200
/admin-messages  /pages/admin/admin-messages.html  200
/admin-messages.html  /pages/admin/admin-messages.html  200
/admin-announcements  /pages/admin/admin-announcements.html  200
/admin-announcements.html  /pages/admin/admin-announcements.html  200
/admin-courses  /pages/admin/admin-courses.html  200
/admin-courses.html  /pages/admin/admin-courses.html  200
```

---

## 🤝 Contributing

We welcome contributions to the Online Library Hub project! Here's how you can help:

### 🐛 Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/your-username/online-library-hub/issues)
2. If not, create a new issue with:
   - A clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Environment details (OS, browser, etc.)

### 💡 Suggesting Enhancements

1. Check if the feature has already been suggested
2. Create a feature request issue with:
   - Clear description of the feature
   - Why it would be useful
   - How it should work

### 📝 Pull Requests

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Test your changes thoroughly
5. Commit with a clear message: `git commit -m "Add: your feature description"`
6. Push to your fork: `git push origin feature/your-feature-name`
7. Create a Pull Request

### 📋 Coding Guidelines

- Follow existing code style and conventions
- Use meaningful variable and function names
- Comment complex logic
- Test your changes before submitting
- Update documentation if needed

---

## 👥 Contributors

A huge thank you to all the amazing people who have contributed to this project!

### Project Leader
- **Abel Eskinder**

### Group Members
1. Yabsra Chalachew
2. Dawit Israel 
3. Mekdelawit
4. Adoniyas samson
5. Addisu
6. Daniel Gebru
7. Meskerem Wondoson
8. Fromsi Mengesha
9. Eyerusalem Ataklti

### Want to Contribute?

We're always looking for new contributors! Here are some areas where you can help:

- 🎨 **UI/UX Improvements** – Make the interface more beautiful and intuitive
- 🌍 **Localization** – Add support for more languages
- 📚 **Content Creation** – Add more educational resources
- 🧪 **Testing** – Write tests and fix bugs
- 📖 **Documentation** – Improve documentation and guides
- ⚡ **Performance** – Optimize loading times and performance

---

## 📄 License

This project is licensed under the **MIT License** – see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2026 Online Library Hub

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 📞 Contact

### Connect with Us

- **Project Repository:** [GitHub](https://github.com/your-username/online-library-hub)
- **Live Demo:** [Netlify](https://online-library-hub.netlify.app)
- **API:** [Render](https://online-library-hub.onrender.com)

### Support

- 📧 **Email:** support@online-library-hub.com
- 🐛 **Issues:** [GitHub Issues](https://github.com/your-username/online-library-hub/issues)
- 💬 **Discussions:** [GitHub Discussions](https://github.com/your-username/online-library-hub/discussions)

### Social Media

- 🌐 **Website:** [online-library-hub.netlify.app](https://online-library-hub.netlify.app)
- 🐦 **Twitter:** [@LibraryHub](https://twitter.com/LibraryHub)
- 📸 **Instagram:** [@libraryhub](https://instagram.com/libraryhub)

---

<div align="center">

**Built with ❤️ by the Online Library Hub Team**

⭐ **If you like this project, please give it a star on GitHub!** ⭐

</div>
