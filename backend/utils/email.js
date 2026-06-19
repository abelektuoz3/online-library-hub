// utils/email.js
// Brevo HTTP API email sender — with console fallback for debugging

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

console.log('📧 EMAIL.JS HAS BEEN LOADED!');

// ==================== EMAIL TEMPLATE STYLES ====================
const getEmailStyles = () => `
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f5f7fa;
            margin: 0;
            padding: 0;
        }
        .email-wrapper {
            max-width: 560px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
        }
        .email-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 30px 30px;
            text-align: center;
            position: relative;
        }
        .email-header .logo {
            font-size: 28px;
            font-weight: 800;
            color: #ffffff;
            letter-spacing: -0.5px;
        }
        .email-header .logo span {
            color: rgba(255, 255, 255, 0.8);
        }
        .email-header .tagline {
            color: rgba(255, 255, 255, 0.8);
            font-size: 14px;
            margin-top: 6px;
            font-weight: 400;
            letter-spacing: 1px;
        }
        .email-header .header-icon {
            font-size: 48px;
            margin-bottom: 12px;
            display: block;
        }
        .email-body {
            padding: 40px 35px 35px;
        }
        .email-body h2 {
            color: #1a1a2e;
            font-size: 22px;
            font-weight: 700;
            margin-bottom: 12px;
            line-height: 1.3;
        }
        .email-body p {
            color: #4a5568;
            font-size: 15px;
            line-height: 1.7;
            margin-bottom: 16px;
        }
        .email-body .greeting {
            font-size: 16px;
            font-weight: 600;
            color: #1a1a2e;
        }
        .otp-container {
            background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%);
            border-radius: 12px;
            padding: 28px 20px;
            text-align: center;
            margin: 24px 0 20px;
            border: 2px dashed #c7d2fe;
        }
        .otp-container .otp-label {
            font-size: 13px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 2px;
            font-weight: 600;
        }
        .otp-container .otp-code {
            font-size: 42px;
            font-weight: 800;
            color: #1a1a2e;
            letter-spacing: 12px;
            font-family: 'Courier New', monospace;
            margin: 8px 0;
            background: white;
            padding: 12px 20px;
            border-radius: 8px;
            display: inline-block;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }
        .otp-container .otp-expiry {
            font-size: 12px;
            color: #94a3b8;
            margin-top: 8px;
        }
        .email-divider {
            border: none;
            border-top: 1px solid #e2e8f0;
            margin: 24px 0;
        }
        .email-footer {
            padding: 20px 35px 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
            background: #fafbfc;
        }
        .email-footer p {
            color: #94a3b8;
            font-size: 12px;
            line-height: 1.6;
            margin: 0;
        }
        .email-footer .footer-links {
            margin-top: 8px;
        }
        .email-footer .footer-links a {
            color: #667eea;
            text-decoration: none;
            font-size: 12px;
            margin: 0 8px;
        }
        .email-footer .footer-links a:hover {
            text-decoration: underline;
        }
        .btn-primary {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #ffffff !important;
            padding: 12px 32px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            font-size: 15px;
            transition: all 0.3s ease;
            border: none;
            cursor: pointer;
        }
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
        }
        .security-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: #f1f5f9;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 11px;
            color: #64748b;
            margin-top: 12px;
        }
        @media (max-width: 480px) {
            .email-wrapper { border-radius: 0; }
            .email-body { padding: 25px 20px; }
            .email-header { padding: 30px 20px 25px; }
            .otp-container .otp-code { font-size: 32px; letter-spacing: 8px; }
            .email-footer { padding: 15px 20px 20px; }
        }
    </style>
`;

// ==================== EMAIL TEMPLATE BUILDER ====================
function buildEmailTemplate(content, isReset = false) {
    const icon = isReset ? '🔐' : '📚';
    const title = isReset ? 'Password Reset Request' : 'Verify Your Email Address';
    const tagline = isReset ? 'Secure your account' : 'Complete your registration';
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${title}</title>
            ${getEmailStyles()}
        </head>
        <body style="background-color: #f5f7fa; padding: 30px 0;">
            <div class="email-wrapper">
                <!-- Header -->
                <div class="email-header">
                    <span class="header-icon">${icon}</span>
                    <div class="logo">Library<span>Hub</span></div>
                    <div class="tagline">${tagline}</div>
                </div>
                
                <!-- Body -->
                <div class="email-body">
                    ${content}
                </div>
                
                <!-- Footer -->
                <div class="email-footer">
                    <p>
                        <strong>Online Library Hub</strong> — Your digital learning companion
                    </p>
                    <div class="footer-links">
                        <a href="https://online-library-hub.netlify.app">Home</a>
                        <a href="https://online-library-hub.netlify.app/pages/catalog.html">Catalog</a>
                        <a href="https://online-library-hub.netlify.app/pages/contact.html">Contact</a>
                    </div>
                    <p style="margin-top: 12px; font-size: 11px; color: #cbd5e1;">
                        &copy; ${new Date().getFullYear()} Online Library Hub. All rights reserved.
                    </p>
                    <div class="security-badge">
                        🔒 This is an automated message. Do not reply.
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;
}

// ==================== SEND EMAIL FUNCTION ====================
async function sendEmail(toEmail, toName, subject, htmlContent) {
    console.log('📧 sendEmail function called');
    const apiKey = process.env.BREVO_API_KEY;
    
    console.log(`📧 Attempting to send email to: ${toEmail}`);
    console.log(`📧 Subject: ${subject}`);
    console.log(`📧 API Key present: ${apiKey ? 'YES' : 'NO'}`);
    if (apiKey) {
        console.log(`📧 API Key first 10 chars: ${apiKey.substring(0, 10)}...`);
    }
    console.log(`📧 SENDER_EMAIL: ${process.env.SENDER_EMAIL || 'NOT SET'}`);
    console.log(`📧 SENDER_NAME: ${process.env.SENDER_NAME || 'NOT SET'}`);
    
    if (!apiKey) {
        console.error('❌ BREVO_API_KEY is not set in environment variables');
        console.log('📝 Falling back to console logging only...');
        return { success: false, fallback: true, message: 'No API key - email logged to console' };
    }

    if (!process.env.SENDER_EMAIL) {
        console.error('❌ SENDER_EMAIL is not set in environment variables');
        console.log('📝 Falling back to console logging only...');
        return { success: false, fallback: true, message: 'No sender email - email logged to console' };
    }

    try {
        console.log('📡 Sending request to Brevo API...');
        const response = await fetch(BREVO_API_URL, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': apiKey,
                'content-type': 'application/json',
            },
            body: JSON.stringify({
                sender: {
                    name: process.env.SENDER_NAME || 'Online Library Hub',
                    email: process.env.SENDER_EMAIL,
                },
                to: [{ email: toEmail, name: toName }],
                subject,
                htmlContent,
            }),
        });

        console.log(`📡 Brevo response status: ${response.status}`);

        let responseBody;
        try {
            responseBody = await response.json();
            console.log('📡 Brevo response body:', JSON.stringify(responseBody, null, 2));
        } catch (e) {
            console.log('📡 Could not parse response body');
        }

        if (!response.ok) {
            const error = responseBody || await response.json();
            console.error('❌ Brevo API error:', error);
            throw new Error(`Brevo error: ${JSON.stringify(error)}`);
        }

        console.log('✅ Email sent successfully via Brevo!');
        return responseBody;
    } catch (err) {
        console.error('❌ Failed to send email via Brevo:', err.message);
        throw err;
    }
}

// ==================== SEND OTP EMAIL ====================
async function sendOTPEmail(toEmail, toName, otp, type = 'verify') {
    console.log('\n==========================================');
    console.log('🔐 sendOTPEmail FUNCTION WAS CALLED!');
    console.log('==========================================');
    console.log(`   To: ${toEmail}`);
    console.log(`   Name: ${toName}`);
    console.log(`   Type: ${type}`);
    console.log(`   OTP CODE: ${otp}`);
    console.log('==========================================\n');
    
    let subject, contentHtml;
    const isReset = type === 'reset';
    
    if (isReset) {
        subject = '🔐 Reset Your Password - Online Library Hub';
        contentHtml = `
            <h2>Forgot your password? No worries!</h2>
            <p class="greeting">Hello ${toName || 'User'},</p>
            <p>We received a request to reset your password for your <strong>Online Library Hub</strong> account.</p>
            <p>Use the verification code below to reset your password. This code is valid for <strong>10 minutes</strong>.</p>
            
            <div class="otp-container">
                <div class="otp-label">🔑 Verification Code</div>
                <div class="otp-code">${otp}</div>
                <div class="otp-expiry">⏱️ Expires in 10 minutes</div>
            </div>
            
            <p style="font-size: 14px; color: #64748b;">
                <strong>💡 Security Tip:</strong> Never share this code with anyone. Our team will never ask for it.
            </p>
            
            <hr class="email-divider">
            
            <p style="font-size: 13px; color: #94a3b8;">
                If you didn't request this password reset, please ignore this email or 
                <a href="https://online-library-hub.netlify.app/pages/contact.html" style="color: #667eea; text-decoration: none;">contact support</a>.
            </p>
        `;
    } else {
        subject = '📚 Verify Your Email - Online Library Hub';
        contentHtml = `
            <h2>Welcome to Online Library Hub! 🎉</h2>
            <p class="greeting">Hello ${toName || 'User'},</p>
            <p>Thanks for joining <strong>Online Library Hub</strong> — your digital gateway to thousands of learning resources!</p>
            <p>To complete your registration and start exploring, please verify your email address using the code below.</p>
            
            <div class="otp-container">
                <div class="otp-label">✅ Verification Code</div>
                <div class="otp-code">${otp}</div>
                <div class="otp-expiry">⏱️ Expires in 10 minutes</div>
            </div>
            
            <p style="text-align: center; margin: 20px 0;">
                <a href="https://online-library-hub.netlify.app/pages/otp-verification.html" class="btn-primary">
                    Verify Your Email
                </a>
            </p>
            
            <p style="font-size: 14px; color: #64748b;">
                <strong>📖 What's next?</strong> After verification, you'll get access to:
            </p>
            <ul style="color: #4a5568; font-size: 14px; line-height: 1.8; padding-left: 20px; margin-bottom: 16px;">
                <li>📚 Thousands of e-books and resources</li>
                <li>🎓 Interactive learning courses</li>
                <li>👥 Community discussions and study groups</li>
                <li>📊 Track your learning progress</li>
            </ul>
            
            <hr class="email-divider">
            
            <p style="font-size: 13px; color: #94a3b8;">
                If you didn't create an account, please ignore this email or 
                <a href="https://online-library-hub.netlify.app/pages/contact.html" style="color: #667eea; text-decoration: none;">contact support</a>.
            </p>
        `;
    }
    
    // Wrap content in full template
    const fullHtml = buildEmailTemplate(contentHtml, isReset);
    
    // Try to send via Brevo if API key exists
    if (process.env.BREVO_API_KEY && process.env.SENDER_EMAIL) {
        console.log('📧 Attempting to send real email via Brevo...');
        try {
            await sendEmail(toEmail, toName, subject, fullHtml);
            console.log('✅ OTP email sent successfully!');
            console.log(`📧 Check your inbox at: ${toEmail}`);
            return { success: true, message: 'OTP email sent successfully' };
        } catch (err) {
            console.error('❌ Failed to send OTP email, but OTP is still valid:', otp);
            console.log('📝 Use this OTP code for testing:', otp);
            return { success: false, error: err.message, otp: otp };
        }
    } else {
        console.log('⚠️ Email not sent - missing BREVO_API_KEY or SENDER_EMAIL in .env');
        console.log('📝 Please use this OTP code for testing:', otp);
        console.log('💡 To fix: Add BREVO_API_KEY and SENDER_EMAIL to your .env file');
        console.log('📧 Email preview:');
        console.log('========================================');
        console.log(`Subject: ${subject}`);
        console.log('----------------------------------------');
        console.log(fullHtml);
        console.log('========================================');
        return { success: true, message: 'OTP generated (check console for code)', otp: otp, fallback: true };
    }
}

// ==================== SEND WELCOME EMAIL ====================
async function sendWelcomeEmail(toEmail, toName) {
    console.log(`📧 Welcome email would be sent to: ${toEmail} (${toName})`);
    
    const subject = '🎉 Welcome to Online Library Hub!';
    const contentHtml = `
        <h2>Welcome aboard, ${toName || 'Reader'}! 🚀</h2>
        <p class="greeting">Hello ${toName || 'User'},</p>
        <p>Your email has been successfully verified. Welcome to the <strong>Online Library Hub</strong> community!</p>
        
        <div style="background: linear-gradient(135deg, #eef2ff 0%, #f8fafc 100%); border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #667eea;">
            <p style="margin: 0; font-weight: 600; color: #1a1a2e;">🎯 Your Learning Journey Starts Here</p>
            <p style="margin: 6px 0 0; font-size: 14px; color: #4a5568;">
                Start exploring thousands of resources, join study groups, and track your progress.
            </p>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 20px 0;">
            <div style="background: #f8fafc; padding: 14px; border-radius: 8px; text-align: center;">
                <div style="font-size: 24px;">📚</div>
                <div style="font-size: 13px; font-weight: 600; color: #1a1a2e; margin-top: 4px;">Browse Catalog</div>
            </div>
            <div style="background: #f8fafc; padding: 14px; border-radius: 8px; text-align: center;">
                <div style="font-size: 24px;">🎓</div>
                <div style="font-size: 13px; font-weight: 600; color: #1a1a2e; margin-top: 4px;">Start Learning</div>
            </div>
            <div style="background: #f8fafc; padding: 14px; border-radius: 8px; text-align: center;">
                <div style="font-size: 24px;">👥</div>
                <div style="font-size: 13px; font-weight: 600; color: #1a1a2e; margin-top: 4px;">Join Community</div>
            </div>
            <div style="background: #f8fafc; padding: 14px; border-radius: 8px; text-align: center;">
                <div style="font-size: 24px;">📊</div>
                <div style="font-size: 13px; font-weight: 600; color: #1a1a2e; margin-top: 4px;">Track Progress</div>
            </div>
        </div>
        
        <p style="text-align: center; margin: 20px 0;">
            <a href="https://online-library-hub.netlify.app/pages/dashboard.html" class="btn-primary">
                🚀 Go to Dashboard
            </a>
        </p>
        
        <hr class="email-divider">
        
        <p style="font-size: 13px; color: #94a3b8; text-align: center;">
            Have questions? <a href="https://online-library-hub.netlify.app/pages/contact.html" style="color: #667eea; text-decoration: none;">Contact our team</a>
        </p>
    `;
    
    const fullHtml = buildEmailTemplate(contentHtml, false);
    
    if (process.env.BREVO_API_KEY && process.env.SENDER_EMAIL) {
        try {
            await sendEmail(toEmail, toName, subject, fullHtml);
            console.log('✅ Welcome email sent!');
            return { success: true };
        } catch (err) {
            console.error('❌ Failed to send welcome email');
            return { success: false, error: err.message };
        }
    } else {
        console.log('📝 Welcome email not sent (no API key), but user is verified');
        console.log('📧 Email preview:');
        console.log('========================================');
        console.log(`Subject: ${subject}`);
        console.log('----------------------------------------');
        console.log(fullHtml);
        console.log('========================================');
        return { success: true, fallback: true };
    }
}

module.exports = { sendEmail, sendOTPEmail, sendWelcomeEmail };