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
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f5f7fa;
            margin: 0;
            padding: 0;
        }
        .email-wrapper {
            max-width: 520px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }
        .email-header {
            background: #ffffff;
            padding: 32px 30px 20px;
            text-align: center;
            border-bottom: 1px solid #e8ecf1;
        }
        .email-header .logo {
            font-size: 24px;
            font-weight: 700;
            color: #1a1a2e;
            letter-spacing: -0.3px;
        }
        .email-header .logo span {
            color: #2563eb;
        }
        .email-header .subtitle {
            color: #6b7280;
            font-size: 13px;
            margin-top: 4px;
            font-weight: 400;
        }
        .email-body {
            padding: 28px 30px 20px;
        }
        .email-body h2 {
            color: #1a1a2e;
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 8px;
            line-height: 1.3;
        }
        .email-body p {
            color: #4a5568;
            font-size: 15px;
            line-height: 1.7;
            margin-bottom: 14px;
        }
        .email-body .greeting {
            font-size: 15px;
            color: #1a1a2e;
        }
        .otp-box {
            background: #f7f9fc;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 20px 0 16px;
            border: 1px solid #e8ecf1;
        }
        .otp-box .otp-label {
            font-size: 12px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 500;
        }
        .otp-box .otp-code {
            font-size: 36px;
            font-weight: 700;
            color: #1a1a2e;
            letter-spacing: 10px;
            font-family: 'Courier New', monospace;
            margin: 6px 0 4px;
        }
        .otp-box .otp-expiry {
            font-size: 12px;
            color: #9ca3af;
        }
        .divider {
            border: none;
            border-top: 1px solid #e8ecf1;
            margin: 20px 0;
        }
        .btn-link {
            color: #2563eb;
            text-decoration: none;
            font-weight: 500;
        }
        .btn-link:hover {
            text-decoration: underline;
        }
        .email-footer {
            padding: 16px 30px 24px;
            text-align: center;
            border-top: 1px solid #e8ecf1;
            background: #fafbfc;
        }
        .email-footer p {
            color: #9ca3af;
            font-size: 12px;
            line-height: 1.6;
            margin: 0;
        }
        .email-footer .footer-links {
            margin-top: 6px;
        }
        .email-footer .footer-links a {
            color: #6b7280;
            text-decoration: none;
            font-size: 12px;
            margin: 0 6px;
        }
        .email-footer .footer-links a:hover {
            color: #2563eb;
            text-decoration: underline;
        }
        @media (max-width: 480px) {
            .email-body { padding: 20px 16px; }
            .email-header { padding: 24px 16px 16px; }
            .otp-box .otp-code { font-size: 28px; letter-spacing: 6px; }
            .email-footer { padding: 12px 16px 16px; }
        }
    </style>
`;

// ==================== EMAIL TEMPLATE BUILDER ====================
function buildEmailTemplate(content) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Online Library Hub</title>
            ${getEmailStyles()}
        </head>
        <body style="background-color: #f5f7fa; padding: 24px 0;">
            <div class="email-wrapper">
                <div class="email-header">
                    <div class="logo">Library<span>Hub</span></div>
                    <div class="subtitle">Online Library Hub</div>
                </div>
                <div class="email-body">
                    ${content}
                </div>
                <div class="email-footer">
                    <p>Online Library Hub</p>
                    <div class="footer-links">
                        <a href="https://online-library-hub.netlify.app">Home</a>
                        <a href="https://online-library-hub.netlify.app/pages/catalog.html">Catalog</a>
                        <a href="https://online-library-hub.netlify.app/pages/contact.html">Contact</a>
                    </div>
                    <p style="margin-top: 8px; font-size: 11px; color: #d1d5db;">
                        &copy; ${new Date().getFullYear()} Online Library Hub
                    </p>
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
        subject = 'Reset your password - Online Library Hub';
        contentHtml = `
            <h2>Reset your password</h2>
            <p class="greeting">Hi ${toName || 'there'},</p>
            <p>We got a request to reset your password. Use the code below to create a new one.</p>
            
            <div class="otp-box">
                <div class="otp-label">Your verification code</div>
                <div class="otp-code">${otp}</div>
                <div class="otp-expiry">Expires in 10 minutes</div>
            </div>
            
            <p style="font-size: 14px; color: #6b7280;">
                If you didn't request this, you can safely ignore this email.
            </p>
        `;
    } else {
        subject = 'Verify your email - Online Library Hub';
        contentHtml = `
            <h2>Verify your email address</h2>
            <p class="greeting">Hi ${toName || 'there'},</p>
            <p>Thanks for signing up! Enter the code below to verify your email and get started.</p>
            
            <div class="otp-box">
                <div class="otp-label">Your verification code</div>
                <div class="otp-code">${otp}</div>
                <div class="otp-expiry">Expires in 10 minutes</div>
            </div>
            
            <p style="font-size: 14px; color: #6b7280;">
                If you didn't create an account, you can ignore this email.
            </p>
        `;
    }
    
    const fullHtml = buildEmailTemplate(contentHtml);
    
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
        return { success: true, message: 'OTP generated (check console for code)', otp: otp, fallback: true };
    }
}

// ==================== SEND WELCOME EMAIL ====================
async function sendWelcomeEmail(toEmail, toName) {
    console.log(`📧 Welcome email would be sent to: ${toEmail} (${toName})`);
    
    const subject = 'Welcome to Online Library Hub';
    const contentHtml = `
        <h2>Welcome to LibraryHub</h2>
        <p class="greeting">Hi ${toName || 'there'},</p>
        <p>Your account is all set. Here's what you can do next:</p>
        
        <ul style="color: #4a5568; font-size: 14px; line-height: 2; padding-left: 20px; margin: 12px 0 16px;">
            <li>Browse the catalog and find resources</li>
            <li>Join study groups and discussions</li>
            <li>Track your learning progress</li>
            <li>Connect with other learners</li>
        </ul>
        
        <p style="text-align: center; margin: 20px 0 12px;">
            <a href="https://online-library-hub.netlify.app/pages/dashboard.html" style="display: inline-block; background: #2563eb; color: #ffffff; padding: 10px 28px; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 14px;">
                Go to Dashboard
            </a>
        </p>
        
        <hr class="divider">
        
        <p style="font-size: 13px; color: #6b7280; text-align: center;">
            Questions? <a href="https://online-library-hub.netlify.app/pages/contact.html" style="color: #2563eb; text-decoration: none;">Contact us</a>
        </p>
    `;
    
    const fullHtml = buildEmailTemplate(contentHtml);
    
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
        return { success: true, fallback: true };
    }
}

module.exports = { sendEmail, sendOTPEmail, sendWelcomeEmail };