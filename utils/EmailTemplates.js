const passwordRecoveryTemplate = (resetLink) => `
    <!DOCTYPE html>
    <html>
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
            background-color: #f8faf9;
            color: #333333;
            margin: 0;
            padding: 0;
            line-height: 1.6;
        }
        .email-wrapper {
            background-color: #f8faf9;
            padding: 2rem 1rem;
            min-height: 100vh;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 16px;
            box-shadow: 0 12px 24px rgba(42, 129, 91, 0.12);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #2a815b 0%, #3a9970 100%);
            padding: 2rem;
            text-align: center;
            color: white;
        }
        .header h1 {
            font-size: 2rem;
            font-weight: 700;
            margin: 0;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .brand-subtitle {
            font-size: 0.9rem;
            opacity: 0.9;
            margin-top: 0.5rem;
            letter-spacing: 1px;
            text-transform: uppercase;
        }
        .content {
            padding: 2.5rem;
            font-size: 1rem;
            line-height: 1.6;
            color: #5e9c7f;
        }
        .content h2 {
            color: #2a815b;
            font-size: 1.4rem;
            font-weight: 600;
            margin-bottom: 1.5rem;
        }
        .content p {
            margin-bottom: 1.5rem;
            color: #6c757d;
        }
        .button-container {
            text-align: center;
            margin: 2.5rem 0;
        }
        .button {
            display: inline-block;
            padding: 0.875rem 2rem;
            background-color: #2a815b;
            color: #ffffff !important;
            text-decoration: none !important;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            text-align: center;
            transition: all 0.3s ease;
            box-shadow: 0 4px 8px rgba(42, 129, 91, 0.2);
        }
        .button:hover {
            background-color: #3a9970 !important;
            color: #ffffff !important;
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(42, 129, 91, 0.3);
        }
        .button:visited {
            color: #ffffff !important;
        }
        .button:active {
            color: #ffffff !important;
        }
        .info-box {
            background-color: #e6f0eb;
            border-left: 4px solid #2a815b;
            padding: 1rem 1.5rem;
            margin: 1.5rem 0;
            border-radius: 0 8px 8px 0;
        }
        .info-box p {
            margin: 0;
            color: #2a815b;
            font-size: 0.9rem;
        }
        .footer {
            background-color: #e9f5f0;
            padding: 1.5rem 2rem;
            text-align: center;
            border-top: 1px solid #e6f0eb;
        }
        .footer p {
            margin: 0;
            font-size: 0.9rem;
            color: #5e9c7f;
        }
        .footer .company-name {
            font-weight: 600;
            color: #2a815b;
        }
        .link-fallback {
            word-break: break-all;
            color: #2a815b;
            font-size: 0.9rem;
            background-color: #f8faf9;
            padding: 0.75rem;
            border-radius: 4px;
            border: 1px solid #e6f0eb;
        }
        @media only screen and (max-width: 600px) {
            .email-wrapper {
                padding: 1rem 0.5rem;
            }
            .header {
                padding: 1.5rem;
            }
            .header h1 {
                font-size: 1.5rem;
            }
            .content {
                padding: 2rem 1.5rem;
            }
            .button {
                padding: 1rem 1.5rem;
                font-size: 0.9rem;
            }
        }
    </style>
    </head>
    <body>
    <div class="email-wrapper">
        <div class="container">
            <div class="header">
                <h1>Password Recovery</h1>
                <div class="brand-subtitle">Matcha</div>
            </div>
            <div class="content">
                <h2>Reset Your Password</h2>
                <p>We received a request to reset your password. No worries - it happens to the best of us!</p>
                <p>Click the button below to create a new password:</p>
                
                <div class="button-container">
                    <a href="${resetLink}" class="button">Reset My Password</a>
                </div>
                
                <div class="info-box">
                    <p><strong>Security Note:</strong> This link will expire in 24 hours for your security. If you didn't request this reset, you can safely ignore this email.</p>
                </div>
                
                <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                <div class="link-fallback">${resetLink}</div>
            </div>
            <div class="footer">
                <p>Thank you for using <span class="company-name">Matcha</span>!</p>
                <p>Find your perfect match with confidence.</p>
            </div>
        </div>
    </div>
    </body>
    </html>
`;

const emailVerificationTemplate = (verificationLink) => `
    <!DOCTYPE html>
    <html>
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
            background-color: #f8faf9;
            color: #333333;
            margin: 0;
            padding: 0;
            line-height: 1.6;
        }
        .email-wrapper {
            background-color: #f8faf9;
            padding: 2rem 1rem;
            min-height: 100vh;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 16px;
            box-shadow: 0 12px 24px rgba(42, 129, 91, 0.12);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #2a815b 0%, #3a9970 100%);
            padding: 2rem;
            text-align: center;
            color: white;
        }
        .header h1 {
            font-size: 2rem;
            font-weight: 700;
            margin: 0;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .brand-subtitle {
            font-size: 0.9rem;
            opacity: 0.9;
            margin-top: 0.5rem;
            letter-spacing: 1px;
            text-transform: uppercase;
        }
        .welcome-badge {
            background-color: rgba(255, 255, 255, 0.2);
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-size: 0.8rem;
            margin-top: 0.5rem;
            display: inline-block;
        }
        .content {
            padding: 2.5rem;
            font-size: 1rem;
            line-height: 1.6;
            color: #5e9c7f;
        }
        .content h2 {
            color: #2a815b;
            font-size: 1.4rem;
            font-weight: 600;
            margin-bottom: 1.5rem;
        }
        .content p {
            margin-bottom: 1.5rem;
            color: #6c757d;
        }
        .button-container {
            text-align: center;
            margin: 2.5rem 0;
        }
        .button {
            display: inline-block;
            padding: 0.875rem 2rem;
            background-color: #2a815b;
            color: #ffffff !important;
            text-decoration: none !important;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            text-align: center;
            transition: all 0.3s ease;
            box-shadow: 0 4px 8px rgba(42, 129, 91, 0.2);
        }
        .button:hover {
            background-color: #3a9970 !important;
            color: #ffffff !important;
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(42, 129, 91, 0.3);
        }
        .button:visited {
            color: #ffffff !important;
        }
        .button:active {
            color: #ffffff !important;
        }
        .feature-highlight {
            background: linear-gradient(135deg, #e9f5f0 0%, #e6f0eb 100%);
            padding: 1.5rem;
            border-radius: 12px;
            margin: 1.5rem 0;
            border: 1px solid #d4e6da;
        }
        .feature-highlight h3 {
            color: #2a815b;
            margin: 0 0 0.75rem 0;
            font-size: 1.1rem;
            font-weight: 600;
        }
        .feature-highlight p {
            margin: 0;
            color: #5e9c7f;
            font-size: 0.9rem;
        }
        .footer {
            background-color: #e9f5f0;
            padding: 1.5rem 2rem;
            text-align: center;
            border-top: 1px solid #e6f0eb;
        }
        .footer p {
            margin: 0;
            font-size: 0.9rem;
            color: #5e9c7f;
        }
        .footer .company-name {
            font-weight: 600;
            color: #2a815b;
        }
        .link-fallback {
            word-break: break-all;
            color: #2a815b;
            font-size: 0.9rem;
            background-color: #f8faf9;
            padding: 0.75rem;
            border-radius: 4px;
            border: 1px solid #e6f0eb;
        }
        @media only screen and (max-width: 600px) {
            .email-wrapper {
                padding: 1rem 0.5rem;
            }
            .header {
                padding: 1.5rem;
            }
            .header h1 {
                font-size: 1.5rem;
            }
            .content {
                padding: 2rem 1.5rem;
            }
            .button {
                padding: 1rem 1.5rem;
                font-size: 0.9rem;
            }
        }
    </style>
    </head>
    <body>
    <div class="email-wrapper">
        <div class="container">
            <div class="header">
                <h1>Welcome to Matcha!</h1>
                <div class="brand-subtitle">Email Verification</div>
                <div class="welcome-badge">🎉 You're almost there!</div>
            </div>
            <div class="content">
                <h2>Verify Your Email Address</h2>
                <p>Thank you for joining Matcha! We're excited to help you find meaningful connections.</p>
                <p>To get started and access all features, please verify your email address by clicking the button below:</p>
                
                <div class="button-container">
                    <a href="${verificationLink}" class="button">Verify My Email</a>
                </div>
                
                <div class="feature-highlight">
                    <h3>What's next after verification?</h3>
                    <p>✨ Complete your profile with photos and interests<br>
                    💫 Start discovering amazing people near you<br>
                    💬 Begin meaningful conversations</p>
                </div>
                
                <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                <div class="link-fallback">${verificationLink}</div>
                
                <p style="font-size: 0.9rem; color: #5e9c7f; font-style: italic;">If you didn't create an account with us, you can safely ignore this email.</p>
            </div>
            <div class="footer">
                <p>Welcome to <span class="company-name">Matcha</span>!</p>
                <p>Find your perfect match with confidence.</p>
            </div>
        </div>
    </div>
    </body>
    </html>
`;

module.exports = {
    passwordRecoveryTemplate,
    emailVerificationTemplate,
};