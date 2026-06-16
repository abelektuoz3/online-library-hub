// utils/email.js
// Brevo HTTP API email sender — with console fallback for debugging

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

console.log('📧 EMAIL.JS HAS BEEN LOADED!');

/**
 * Send a transactional email via Brevo HTTP API
 * @param {string} toEmail   - recipient email address
 * @param {string} toName    - recipient display name
 * @param {string} subject   - email subject
 * @param {string} htmlContent - HTML body of the email
 */
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

        if (!response.ok) {
            const error = await response.json();
            console.error('❌ Brevo API error:', error);
            throw new Error(`Brevo error: ${JSON.stringify(error)}`);
        }

        const result = await response.json();
        console.log('✅ Email sent successfully via Brevo!');
        return result;
    } catch (err) {
        console.error('❌ Failed to send email via Brevo:', err.message);
        throw err;
    }
}

/**
 * Send OTP verification email (with console fallback)
 */
async function sendOTPEmail(toEmail, toName, otp, type = 'verify') {
    console.log('\n==========================================');
    console.log('🔐 sendOTPEmail FUNCTION WAS CALLED!');
    console.log('==========================================');
    console.log(`   To: ${toEmail}`);
    console.log(`   Name: ${toName}`);
    console.log(`   Type: ${type}`);
    console.log(`   OTP CODE: ${otp}`);
    console.log('==========================================\n');
    
    let subject, htmlContent;
    
    if (type === 'reset') {
        subject = 'Reset Your Password - Online Library Hub';
        htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2563eb;">Password Reset Request</h2>
                <p>Hello <strong>${toName}</strong>,</p>
                <p>You requested to reset your password. Use the code below:</p>
                <div style="background: #f3f4f6; padding: 15px; text-align: center; font-size: 32px; letter-spacing: 5px; font-weight: bold;">
                    ${otp}
                </div>
                <p>This code expires in 10 minutes.</p>
                <hr>
                <p style="color: #6b7280; font-size: 12px;">If you didn't request this, ignore this email.</p>
            </div>
        `;
    } else {
        subject = 'Verify Your Email - Online Library Hub';
        htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2563eb;">Verify Your Email Address</h2>
                <p>Hello <strong>${toName}</strong>,</p>
                <p>Thanks for registering! Use the code below to verify your email:</p>
                <div style="background: #f3f4f6; padding: 15px; text-align: center; font-size: 32px; letter-spacing: 5px; font-weight: bold;">
                    ${otp}
                </div>
                <p>This code expires in 10 minutes.</p>
                <hr>
                <p style="color: #6b7280; font-size: 12px;">If you didn't create an account, ignore this email.</p>
            </div>
        `;
    }
    
    // Try to send via Brevo if API key exists
    if (process.env.BREVO_API_KEY && process.env.SENDER_EMAIL) {
        console.log('📧 Attempting to send real email via Brevo...');
        try {
            await sendEmail(toEmail, toName, subject, htmlContent);
            console.log('✅ OTP email sent successfully!');
        } catch (err) {
            console.error('❌ Failed to send OTP email, but OTP is still valid:', otp);
            console.log('📝 Use this OTP code for testing:', otp);
        }
    } else {
        console.log('⚠️ Email not sent - missing BREVO_API_KEY or SENDER_EMAIL in .env');
        console.log('📝 Please use this OTP code for testing:', otp);
        console.log('💡 To fix: Add BREVO_API_KEY and SENDER_EMAIL to your .env file');
        console.log('📧 Example .env entry:');
        console.log('   BREVO_API_KEY=xkeysib-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
        console.log('   SENDER_EMAIL=your_verified_email@gmail.com');
        console.log('   SENDER_NAME=Online Library Hub');
    }
    
    console.log('✅ sendOTPEmail function completed');
    // Always return success for development (so OTP verification works)
    return { success: true, message: 'OTP generated (check console for code)', otp: otp };
}

/**
 * Send welcome email
 */
async function sendWelcomeEmail(toEmail, toName) {
    console.log(`📧 Welcome email would be sent to: ${toEmail} (${toName})`);
    
    const subject = 'Welcome to Online Library Hub! 🎉';
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">Welcome to LibraryHub, ${toName}! 🎉</h2>
            <p>Your account has been successfully verified.</p>
            <p>You can now log in and start exploring thousands of resources.</p>
            <a href="http://localhost:5000/pages/login.html" style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Login Now</a>
        </div>
    `;
    
    if (process.env.BREVO_API_KEY && process.env.SENDER_EMAIL) {
        try {
            await sendEmail(toEmail, toName, subject, htmlContent);
            console.log('✅ Welcome email sent!');
        } catch (err) {
            console.error('❌ Failed to send welcome email');
        }
    } else {
        console.log('📝 Welcome email not sent (no API key), but user is verified');
    }
}

module.exports = { sendEmail, sendOTPEmail, sendWelcomeEmail };