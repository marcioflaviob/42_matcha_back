const passwordRecoveryTemplate = (resetLink) => `
    <!DOCTYPE html>
    <html>
    <head>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f9f9f9;
            color: #333333;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 2rem auto;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
            padding: 2rem;
        }
        .header {
            text-align: center;
            margin-bottom: 2rem;
        }
        .header h1 {
            font-size: 1.8rem;
            color: #333333;
        }
        .content {
            font-size: 1rem;
            line-height: 1.6;
            color: #555555;
        }
        .button {
            display: inline-block;
            margin-top: 2rem;
            padding: 0.75rem 1.5rem;
            background-color: #007bff;
            color: #ffffff;
            text-decoration: none;
            border-radius: 4px;
            font-size: 1rem;
            font-weight: bold;
            text-align: center;
        }
        .button:hover {
            background-color: #0056b3;
        }
        .footer {
            margin-top: 2rem;
            font-size: 0.9rem;
            color: #777777;
            text-align: center;
        }
    </style>
    </head>
    <body>
    <div class="container">
        <div class="header">
            <h1>Matcha Password Recovery</h1>
        </div>
        <div class="content">
            <p>We received a request to reset your password. Click the button below to reset it:</p>
            <a href="${resetLink}" class="button">Reset Password</a>
            <p>If you didn’t request this, you can safely ignore this email.</p>
        </div>
        <div class="footer">
            <p>Thank you for using Matcha!</p>
        </div>
    </div>
    </body>
    </html>
`;

const emailVerificationTemplate = (verificationLink) => `
    <!DOCTYPE html>
    <html>
    <head>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f9f9f9;
            color: #333333;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 2rem auto;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
            padding: 2rem;
        }
        .header {
            text-align: center;
            margin-bottom: 2rem;
        }
        .header h1 {
            font-size: 1.8rem;
            color: #333333;
        }
        .content {
            font-size: 1rem;
            line-height: 1.6;
            color: #555555;
        }
        .button {
            display: inline-block;
            margin-top: 2rem;
            padding: 0.75rem 1.5rem;
            background-color: #007bff;
            color: #ffffff;
            text-decoration: none;
            border-radius: 4px;
            font-size: 1rem;
            font-weight: bold;
            text-align: center;
        }
        .button:hover {
            background-color: #0056b3;
        }
        .footer {
            margin-top: 2rem;
            font-size: 0.9rem;
            color: #777777;
            text-align: center;
        }
    </style>
    </head>
    <body>
    <div class="container">
        <div class="header">
            <h1>Matcha Email Verification</h1>
        </div>
        <div class="content">
            <p>Thank you for signing up! Please verify your email address by clicking the button below:</p>
            <a href="${verificationLink}" class="button">Verify Email</a>
            <p>If you didn’t create an account, you can safely ignore this email.</p>
        </div>
        <div class="footer">
            <p>Thank you for joining Matcha!</p>
        </div>
    </div>
    </body>
    </html>
`;

module.exports = {
    passwordRecoveryTemplate,
    emailVerificationTemplate,
};