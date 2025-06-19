process.env.JWT_SECRET = 'test_jwt_secret';
process.env.EMAIL_API_KEY = 'fake-api-key';
process.env.EMAIL_FROM = 'no-reply@example.com';
process.env.FRONTEND_URL = 'https://frontend.com';

jest.mock('resend', () => {
    const mockSend = jest.fn();
    return {
        Resend: jest.fn().mockImplementation(() => ({
            emails: {
                send: mockSend,
            },
        })),
        __mockSend: mockSend,
    };
});

jest.mock('jsonwebtoken', () => ({
    sign: jest.fn(),
}));

jest.mock('../../services/UserService.js');
jest.mock('../../utils/EmailTemplates.js');

const { __mockSend } = require('resend');
const jwt = require('jsonwebtoken');
const UserService = require('../../services/UserService.js');
const {
    passwordRecoveryTemplate,
    emailVerificationTemplate,
} = require('../../utils/EmailTemplates.js');
const {
    sendPasswordRecoveryEmail,
    sendEmailVerification,
} = require('../../services/EmailService.js');
const ApiException = require('../../exceptions/ApiException.js');

describe('EmailService', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('sendPasswordRecoveryEmail', () => {
        it('throws error if email is not provided', async () => {
            await expect(sendPasswordRecoveryEmail(null)).rejects.toThrow(ApiException);
            await expect(sendPasswordRecoveryEmail('')).rejects.toThrow(ApiException);
            await expect(sendPasswordRecoveryEmail(undefined)).rejects.toThrow(ApiException);
        });

        it('sends password recovery email successfully', async () => {
            const user = { id: 1, email: 'test@example.com' };
            const token = 'jwt-token';
            const html = '<p>Recovery Email</p>';

            UserService.getUserByEmail.mockResolvedValue(user);
            jwt.sign.mockReturnValue(token);
            passwordRecoveryTemplate.mockReturnValue(html);
            __mockSend.mockResolvedValue({ data: 'email-sent' });

            const result = await sendPasswordRecoveryEmail(user.email);

            expect(UserService.getUserByEmail).toHaveBeenCalledWith(user.email);
            expect(jwt.sign).toHaveBeenCalledWith(
                { id: user.id, email: user.email },
                'test_jwt_secret',
                { expiresIn: '1h' }
            );
            expect(passwordRecoveryTemplate).toHaveBeenCalledWith(
                `https://frontend.com/reset-password?token=${token}`
            );
            expect(__mockSend).toHaveBeenCalledWith({
                from: 'no-reply@example.com',
                to: user.email,
                subject: 'Password Recovery',
                html,
            });
            expect(result).toEqual('email-sent');
        });

        it('throws error when user is not found', async () => {
            UserService.getUserByEmail.mockRejectedValue(new ApiException(404, 'User not found'));

            await expect(sendPasswordRecoveryEmail('nonexistent@example.com'))
                .rejects
                .toThrow('User not found');
        });

        it('throws error when email sending fails', async () => {
            const user = { id: 1, email: 'test@example.com' };
            const token = 'jwt-token';
            const html = '<p>Recovery Email</p>';

            UserService.getUserByEmail.mockResolvedValue(user);
            jwt.sign.mockReturnValue(token);
            passwordRecoveryTemplate.mockReturnValue(html);
            __mockSend.mockRejectedValue(new Error('Email service unavailable'));

            await expect(sendPasswordRecoveryEmail(user.email))
                .rejects
                .toThrow('Email service unavailable');
        });

        it('throws error when resend returns error', async () => {
            const user = { id: 1, email: 'test@example.com' };
            const token = 'jwt-token';
            const html = '<p>Recovery Email</p>';

            UserService.getUserByEmail.mockResolvedValue(user);
            jwt.sign.mockReturnValue(token);
            passwordRecoveryTemplate.mockReturnValue(html);
            __mockSend.mockResolvedValue({
                data: null,
                error: { message: 'Invalid API key' }
            });

            await expect(sendPasswordRecoveryEmail(user.email))
                .rejects
                .toThrow('Failed to send email: Invalid API key');
        });

        it('handles JWT signing errors', async () => {
            const user = { id: 1, email: 'test@example.com' };

            UserService.getUserByEmail.mockResolvedValue(user);
            jwt.sign.mockImplementation(() => {
                throw new Error('JWT signing failed');
            });

            await expect(sendPasswordRecoveryEmail(user.email))
                .rejects
                .toThrow('JWT signing failed');
        });

        it('handles template generation errors', async () => {
            const user = { id: 1, email: 'test@example.com' };
            const token = 'jwt-token';

            UserService.getUserByEmail.mockResolvedValue(user);
            jwt.sign.mockReturnValue(token);
            passwordRecoveryTemplate.mockImplementation(() => {
                throw new Error('Template generation failed');
            });

            await expect(sendPasswordRecoveryEmail(user.email))
                .rejects
                .toThrow('Template generation failed');
        });
    });

    describe('sendEmailVerification', () => {
        it('sends email verification email successfully', async () => {
            const user = { id: 2, email: 'verify@example.com' };
            const token = 'verify-token';
            const html = '<p>Verify Email</p>';

            UserService.getUserById.mockResolvedValue(user);
            jwt.sign.mockReturnValue(token);
            emailVerificationTemplate.mockReturnValue(html);
            __mockSend.mockResolvedValue({ data: 'email-sent' });

            const result = await sendEmailVerification(user.id);

            expect(UserService.getUserById).toHaveBeenCalledWith(user.id);
            expect(jwt.sign).toHaveBeenCalledWith(
                { id: user.id, email: user.email },
                'test_jwt_secret',
                { expiresIn: '24h' }
            );
            expect(emailVerificationTemplate).toHaveBeenCalledWith(
                `https://frontend.com/register?token=${token}`
            );
            expect(__mockSend).toHaveBeenCalledWith({
                from: 'no-reply@example.com',
                to: user.email,
                subject: 'Email Verification',
                html,
            });
            expect(result).toEqual('email-sent');
        });

        it('throws error when user is not found', async () => {
            UserService.getUserById.mockRejectedValue(new ApiException(404, 'User not found'));

            await expect(sendEmailVerification(999))
                .rejects
                .toThrow('User not found');
        });

        it('throws error when userId is null or undefined', async () => {
            UserService.getUserById.mockRejectedValue(new ApiException(400, 'User ID is required'));

            await expect(sendEmailVerification(null))
                .rejects
                .toThrow('User ID is required');

            await expect(sendEmailVerification(undefined))
                .rejects
                .toThrow('User ID is required');
        });

        it('throws error when email sending fails', async () => {
            const user = { id: 2, email: 'verify@example.com' };
            const token = 'verify-token';
            const html = '<p>Verify Email</p>';

            UserService.getUserById.mockResolvedValue(user);
            jwt.sign.mockReturnValue(token);
            emailVerificationTemplate.mockReturnValue(html);
            __mockSend.mockRejectedValue(new Error('SMTP server error'));

            await expect(sendEmailVerification(user.id))
                .rejects
                .toThrow('SMTP server error');
        });

        it('throws error when resend returns error', async () => {
            const user = { id: 2, email: 'verify@example.com' };
            const token = 'verify-token';
            const html = '<p>Verify Email</p>';

            UserService.getUserById.mockResolvedValue(user);
            jwt.sign.mockReturnValue(token);
            emailVerificationTemplate.mockReturnValue(html);
            __mockSend.mockResolvedValue({
                data: null,
                error: { message: 'Rate limit exceeded' }
            });

            await expect(sendEmailVerification(user.id))
                .rejects
                .toThrow('Failed to send email: Rate limit exceeded');
        });

        it('handles JWT signing errors during verification', async () => {
            const user = { id: 2, email: 'verify@example.com' };

            UserService.getUserById.mockResolvedValue(user);
            jwt.sign.mockImplementation(() => {
                throw new Error('JWT secret not found');
            });

            await expect(sendEmailVerification(user.id))
                .rejects
                .toThrow('JWT secret not found');
        });

        it('handles template generation errors during verification', async () => {
            const user = { id: 2, email: 'verify@example.com' };
            const token = 'verify-token';

            UserService.getUserById.mockResolvedValue(user);
            jwt.sign.mockReturnValue(token);
            emailVerificationTemplate.mockImplementation(() => {
                throw new Error('Email template not found');
            });

            await expect(sendEmailVerification(user.id))
                .rejects
                .toThrow('Email template not found');
        });
    });

    describe('edge cases and error scenarios', () => {
        it('handles special characters in email addresses', async () => {
            const user = { id: 1, email: 'test+special@example.com' };
            const token = 'jwt-token';
            const html = '<p>Recovery Email</p>';

            UserService.getUserByEmail.mockResolvedValue(user);
            jwt.sign.mockReturnValue(token);
            passwordRecoveryTemplate.mockReturnValue(html);
            __mockSend.mockResolvedValue({ data: 'email-sent' });

            const result = await sendPasswordRecoveryEmail(user.email);

            expect(__mockSend).toHaveBeenCalledWith({
                from: 'no-reply@example.com',
                to: 'test+special@example.com',
                subject: 'Password Recovery',
                html,
            });
            expect(result).toEqual('email-sent');
        });

        it('handles very long email addresses', async () => {
            const longEmail = 'verylongusernamethatexceedsnormallimits@verylongdomainnamethatishardlyrealistic.com';
            const user = { id: 1, email: longEmail };
            const token = 'jwt-token';
            const html = '<p>Recovery Email</p>';

            UserService.getUserByEmail.mockResolvedValue(user);
            jwt.sign.mockReturnValue(token);
            passwordRecoveryTemplate.mockReturnValue(html);
            __mockSend.mockResolvedValue({ data: 'email-sent' });

            const result = await sendPasswordRecoveryEmail(user.email);

            expect(result).toEqual('email-sent');
        });

        it('handles users with missing email field', async () => {
            const user = { id: 1 };

            UserService.getUserByEmail.mockResolvedValue(user);
            jwt.sign.mockReturnValue('token');
            passwordRecoveryTemplate.mockReturnValue('<p>Test</p>');
            __mockSend.mockResolvedValue({ data: 'email-sent' });

            await sendPasswordRecoveryEmail('test@example.com');

            expect(__mockSend).toHaveBeenCalledWith({
                from: 'no-reply@example.com',
                to: undefined,
                subject: 'Password Recovery',
                html: '<p>Test</p>',
            });
        });

        it('handles network timeout errors', async () => {
            const user = { id: 1, email: 'test@example.com' };
            const token = 'jwt-token';
            const html = '<p>Recovery Email</p>';

            UserService.getUserByEmail.mockResolvedValue(user);
            jwt.sign.mockReturnValue(token);
            passwordRecoveryTemplate.mockReturnValue(html);
            __mockSend.mockRejectedValue(new Error('ETIMEDOUT'));

            await expect(sendPasswordRecoveryEmail(user.email))
                .rejects
                .toThrow('ETIMEDOUT');
        });

        it('handles empty HTML template', async () => {
            const user = { id: 1, email: 'test@example.com' };
            const token = 'jwt-token';

            UserService.getUserByEmail.mockResolvedValue(user);
            jwt.sign.mockReturnValue(token);
            passwordRecoveryTemplate.mockReturnValue('');
            __mockSend.mockResolvedValue({ data: 'email-sent' });

            const result = await sendPasswordRecoveryEmail(user.email);

            expect(__mockSend).toHaveBeenCalledWith({
                from: 'no-reply@example.com',
                to: user.email,
                subject: 'Password Recovery',
                html: '',
            });
            expect(result).toEqual('email-sent');
        });

        it('handles very long tokens', async () => {
            const user = { id: 1, email: 'test@example.com' };
            const veryLongToken = 'a'.repeat(1000);
            const html = '<p>Recovery Email</p>';

            UserService.getUserByEmail.mockResolvedValue(user);
            jwt.sign.mockReturnValue(veryLongToken);
            passwordRecoveryTemplate.mockReturnValue(html);
            __mockSend.mockResolvedValue({ data: 'email-sent' });

            const result = await sendPasswordRecoveryEmail(user.email);

            expect(passwordRecoveryTemplate).toHaveBeenCalledWith(
                `https://frontend.com/reset-password?token=${veryLongToken}`
            );
            expect(result).toEqual('email-sent');
        });

        it('handles concurrent email sending', async () => {
            const user1 = { id: 1, email: 'user1@example.com' };
            const user2 = { id: 2, email: 'user2@example.com' };
            const token = 'jwt-token';
            const html = '<p>Recovery Email</p>';

            UserService.getUserByEmail
                .mockResolvedValueOnce(user1)
                .mockResolvedValueOnce(user2);
            jwt.sign.mockReturnValue(token);
            passwordRecoveryTemplate.mockReturnValue(html);
            __mockSend.mockResolvedValue({ data: 'email-sent' });

            const promises = [
                sendPasswordRecoveryEmail(user1.email),
                sendPasswordRecoveryEmail(user2.email)
            ];

            const results = await Promise.all(promises);

            expect(results).toEqual(['email-sent', 'email-sent']);
            expect(__mockSend).toHaveBeenCalledTimes(2);
        });
    });
});
