const {
    passwordRecoveryTemplate,
    emailVerificationTemplate
} = require('../../utils/EmailTemplates.js');

describe('EmailTemplates', () => {
    describe('passwordRecoveryTemplate', () => {
        it('should generate password recovery email template with reset link', () => {
            const resetLink = 'https://example.com/reset-password?token=abc123';

            const html = passwordRecoveryTemplate(resetLink);

            expect(html).toContain('<!DOCTYPE html>');
            expect(html).toContain('Password Recovery');
            expect(html).toContain(resetLink);
            expect(html).toContain('Reset Password');
            expect(html).toContain('We received a request to reset your password');
        });

        it('should handle empty reset link', () => {
            const resetLink = '';

            const html = passwordRecoveryTemplate(resetLink);

            expect(html).toContain('<!DOCTYPE html>');
            expect(html).toContain('Password Recovery');
            expect(html).toContain('href=""');
        });

        it('should handle special characters in reset link', () => {
            const resetLink = 'https://example.com/reset?token=abc+123&user=test@example.com';

            const html = passwordRecoveryTemplate(resetLink);

            expect(html).toContain(resetLink);
            expect(html).toContain('Reset Password');
        });

        it('should generate valid HTML structure', () => {
            const resetLink = 'https://example.com/reset-password?token=abc123';

            const html = passwordRecoveryTemplate(resetLink);

            expect(html).toContain('<html>');
            expect(html).toContain('</html>');
            expect(html).toContain('<head>');
            expect(html).toContain('</head>');
            expect(html).toContain('<body>');
            expect(html).toContain('</body>');
        });
    });

    describe('emailVerificationTemplate', () => {
        it('should generate email verification template with verification link', () => {
            const verificationLink = 'https://example.com/verify?token=xyz789';

            const html = emailVerificationTemplate(verificationLink);

            expect(html).toContain('<!DOCTYPE html>');
            expect(html).toContain('Email Verification');
            expect(html).toContain(verificationLink);
            expect(html).toContain('Verify Email');
            expect(html).toContain('Thank you for signing up');
        });

        it('should handle empty verification link', () => {
            const verificationLink = '';

            const html = emailVerificationTemplate(verificationLink);

            expect(html).toContain('<!DOCTYPE html>');
            expect(html).toContain('Email Verification');
            expect(html).toContain('href=""');
        });

        it('should handle special characters in verification link', () => {
            const verificationLink = 'https://example.com/verify?token=xyz+789&email=user@test.com';

            const html = emailVerificationTemplate(verificationLink);

            expect(html).toContain(verificationLink);
            expect(html).toContain('Verify Email');
        });

        it('should generate valid HTML structure', () => {
            const verificationLink = 'https://example.com/verify?token=xyz789';

            const html = emailVerificationTemplate(verificationLink);

            expect(html).toContain('<html>');
            expect(html).toContain('</html>');
            expect(html).toContain('<head>');
            expect(html).toContain('</head>');
            expect(html).toContain('<body>');
            expect(html).toContain('</body>');
        });

        it('should include proper styling and branding', () => {
            const verificationLink = 'https://example.com/verify?token=xyz789';

            const html = emailVerificationTemplate(verificationLink);

            expect(html).toContain('font-family: Arial, sans-serif');
            expect(html).toContain('background-color: #e9f5f0');
            expect(html).toContain('color: #2a815b');
        });
    });

    describe('template consistency', () => {
        it('should have consistent styling between templates', () => {
            const resetLink = 'https://example.com/reset';
            const verificationLink = 'https://example.com/verify';

            const passwordHtml = passwordRecoveryTemplate(resetLink);
            const verificationHtml = emailVerificationTemplate(verificationLink);

            // Both should have the same color scheme
            expect(passwordHtml).toContain('#e9f5f0');
            expect(verificationHtml).toContain('#e9f5f0');
            expect(passwordHtml).toContain('#2a815b');
            expect(verificationHtml).toContain('#2a815b');

            // Both should have similar structure
            expect(passwordHtml).toContain('class="container"');
            expect(verificationHtml).toContain('class="container"');
        });

        it('should handle null or undefined links gracefully', () => {
            expect(() => passwordRecoveryTemplate(null)).not.toThrow();
            expect(() => passwordRecoveryTemplate(undefined)).not.toThrow();
            expect(() => emailVerificationTemplate(null)).not.toThrow();
            expect(() => emailVerificationTemplate(undefined)).not.toThrow();
        });
    });
});
