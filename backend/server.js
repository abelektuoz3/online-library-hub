const dotenv = require("dotenv");
const path = require("path");

// Force dotenv to load .env from the correct location
const envPath = path.join(__dirname, '.env');
console.log('📂 Looking for .env at:', envPath);
dotenv.config({ path: envPath });

// Also try loading from parent directory if not found
if (!process.env.BREVO_API_KEY) {
    console.log('⚠️ BREVO_API_KEY not found, trying parent directory...');
    dotenv.config({ path: path.join(__dirname, '../.env') });
}

const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const session = require("express-session");
const passport = require("passport");
const connectDB = require("./config/db");
const Admin = require("./models/Admin");
const User = require("./models/User");
const { sendOTPEmail, sendWelcomeEmail } = require("./utils/email");

console.log("🚀 Starting server...");
console.log("📧 Environment variables loaded:");
console.log(`   BREVO_API_KEY: ${process.env.BREVO_API_KEY ? '✅ SET' : '❌ NOT SET'}`);
console.log(`   SENDER_EMAIL: ${process.env.SENDER_EMAIL || '❌ NOT SET'}`);
console.log(`   MONGO_URI: ${process.env.MONGO_URI ? '✅ SET' : '❌ NOT SET'}`);
console.log(`   GITHUB_CLIENT_ID: ${process.env.GITHUB_CLIENT_ID ? '✅ SET' : '❌ NOT SET'}`);
console.log(`   GOOGLE_CLIENT_ID: ${process.env.GOOGLE_CLIENT_ID ? '✅ SET' : '❌ NOT SET'}`);

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_DIR = path.join(__dirname, "../frontend");
const UPLOADS_DIR = path.join(__dirname, "uploads");

// ==================== PRODUCTION SETTINGS ====================
if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
}

// ==================== SESSION CONFIGURATION ====================
app.use(session({
    secret: process.env.SESSION_SECRET || 'your_session_secret_here',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// ==================== PASSPORT INITIALIZATION ====================
app.use(passport.initialize());
app.use(passport.session());

// ==================== CORS CONFIGURATION ====================
const allowedOrigins = [
    "http://localhost:5000",
    "http://localhost:3000",
    "http://localhost:5500",
    "https://online-library-hub.netlify.app",
    process.env.FRONTEND_URL,
].filter(Boolean);

console.log("✅ Allowed origins:", allowedOrigins);

app.use(
    cors({
        origin: function (origin, callback) {
            // Allow requests with no origin (like mobile apps or curl requests)
            if (!origin) return callback(null, true);
            if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== "production") {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allowedHeaders: [
            "Content-Type",
            "Authorization",
            "X-Requested-With",
            "Accept",
            "Origin",
        ],
        exposedHeaders: ["Content-Range", "X-Content-Range"],
    })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Serve uploaded files
app.use("/uploads", express.static(UPLOADS_DIR));

// Serve static frontend files (only in development)
if (process.env.NODE_ENV !== "production") {
    app.use(express.static(FRONTEND_DIR));
}

// Client config served by the backend
app.get("/scripts/api-config.js", (req, res) => {
    const apiBase = process.env.API_BASE || "/api";
    const uploadsBase = process.env.UPLOADS_BASE || "/uploads";
    res
        .type("application/javascript")
        .send(
            `window.API_BASE='${apiBase}';\nwindow.UPLOADS_BASE='${uploadsBase}';\n`
        );
});

// ==================== OTP STORES ====================
global.verificationOtpStore = {};
global.resetOtpStore = {};

console.log("✅ OTP stores initialized");

// ==================== ROUTE MODULES ====================
const authRoutes = require("./routes/auth");
const catalogRoutes = require("./routes/catalog");
const contactRoutes = require("./routes/contact");
const announcementRoutes = require("./routes/announcement");
const adminRoutes = require("./routes/admin");
const googleAuthRoutes = require("./routes/google-auth");
const githubAuthRoutes = require("./routes/github-auth");
const courseRoutes = require("./routes/courseRoutes");

// ==================== PASSPORT STRATEGIES ====================
// Initialize Passport strategies
require("./config/passport")(passport);

// ==================== API ROUTES ====================
app.use("/api/auth", authRoutes);
app.use("/api/catalog", catalogRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/courses", courseRoutes); // ✅ ADDED: Course routes

// ==================== OAUTH ROUTES ====================
// GitHub Routes
app.use("/api/auth/github", githubAuthRoutes);
app.use("/auth/github", githubAuthRoutes);

// Google Routes
app.use("/api/auth/google", googleAuthRoutes);
app.use("/auth/google", googleAuthRoutes);

// ==================== OTP ROUTES ====================
app.post("/api/otp/send", async (req, res) => {
    try {
        const { email, name } = req.body;
        if (!email) return res.status(400).json({ error: "Email is required" });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        if (!global.verificationOtpStore) global.verificationOtpStore = {};
        global.verificationOtpStore[email] = {
            otp,
            expiresAt: Date.now() + 10 * 60 * 1000,
        };

        console.log(`📧 Sending OTP to ${email}`);
        await sendOTPEmail(email, name || "User", otp, "verify");
        res.json({ success: true, message: "OTP sent to your email" });
    } catch (err) {
        console.error("OTP send error:", err);
        res.status(500).json({ error: "Failed to send OTP" });
    }
});

app.post("/api/otp/verify", async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp)
            return res.status(400).json({ error: "Email and OTP are required" });

        const record = global.verificationOtpStore[email];
        if (!record) return res.status(400).json({ error: "No OTP found" });
        if (Date.now() > record.expiresAt)
            return res.status(400).json({ error: "OTP expired" });
        if (record.otp !== otp.trim())
            return res.status(400).json({ error: "Incorrect OTP" });

        const user = await User.findOne({ email: email.toLowerCase() });
        if (user) {
            user.isVerified = true;
            await user.save();
            try {
                await sendWelcomeEmail(email, user.name);
            } catch (e) {}
        }

        delete global.verificationOtpStore[email];
        res.json({ success: true, message: "Email verified successfully" });
    } catch (err) {
        console.error("OTP verify error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

app.post("/api/otp/send-reset", async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: "Email is required" });

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return res.status(404).json({ error: "No account found" });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        global.resetOtpStore[email] = {
            otp,
            expiresAt: Date.now() + 10 * 60 * 1000,
        };

        await sendOTPEmail(email, user.name, otp, "reset");
        res.json({ success: true, message: "Reset OTP sent" });
    } catch (err) {
        console.error("Reset OTP send error:", err);
        res.status(500).json({ error: "Failed to send OTP" });
    }
});

app.post("/api/otp/verify-reset", (req, res) => {
    try {
        const { email, otp } = req.body;
        const record = global.resetOtpStore[email];
        if (!record) return res.status(400).json({ error: "No reset code found" });
        if (Date.now() > record.expiresAt)
            return res.status(400).json({ error: "Code expired" });
        if (record.otp !== otp.trim())
            return res.status(400).json({ error: "Incorrect code" });

        global.resetOtpStore[email].verified = true;
        res.json({ success: true, message: "OTP verified" });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

app.post("/api/auth/reset-password", async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        const record = global.resetOtpStore[email];
        if (!record) return res.status(400).json({ error: "No reset code found" });
        if (record.otp !== otp)
            return res.status(400).json({ error: "Invalid code" });

        const bcrypt = require("bcryptjs");
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await User.findOneAndUpdate(
            { email: email.toLowerCase() },
            { password: hashedPassword }
        );

        delete global.resetOtpStore[email];
        res.json({ success: true, message: "Password reset successful" });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// ==================== FIRST ADMIN SETUP ====================
app.post("/api/setup/first-admin", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const existingAdminCount = await Admin.countDocuments();
        if (existingAdminCount > 0)
            return res.status(403).json({ error: "Admin already exists" });

        const admin = new Admin({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password,
        });
        await admin.save();

        const token = jwt.sign(
            { id: admin.id, email: admin.email, role: "admin" },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );
        res.json({
            success: true,
            token,
            admin: {
                id: admin.id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
            },
        });
    } catch (err) {
        console.error("First admin setup error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// ==================== HEALTH CHECK ====================
app.get("/api/health", (req, res) => {
    res.json({ success: true, message: "Online Library Hub API is running" });
});

// ==================== API 404 HANDLER ====================
app.use("/api", (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
});

// ==================== ERROR HANDLING ====================
app.use((err, req, res, next) => {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal server error" });
});

// ==================== START SERVER ====================
app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(
        `📚 Frontend: ${process.env.FRONTEND_URL || `http://localhost:${PORT}/index.html`}`
    );
    console.log(`🔌 API base: http://localhost:${PORT}/api`);
    console.log(`📚 Course API: http://localhost:${PORT}/api/courses`);
    console.log(`✅ CORS enabled (all origins allowed for testing)`);
    console.log(`📁 Uploads directory: ${UPLOADS_DIR}`);
});