const EmailService = require('../../services/EmailService.js');

jest.mock('../../services/EmailService.js');

describe('EmailController', () => {
    let req;
    let res;
    const { sendForgotPasswordEmail, sendValidationEmail } = require('../../controllers/EmailController.js');

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            body: {},
            user: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn()
        };
    });

    describe('sendForgotPasswordEmail', () => {
        it('should send password recovery email successfully', async () => {
            const testEmail = 'test@example.com';
            req.body.email = testEmail;

            EmailService.sendPasswordRecoveryEmail.mockResolvedValue(true);

            await sendForgotPasswordEmail(req, res);

            expect(EmailService.sendPasswordRecoveryEmail).toHaveBeenCalledWith(testEmail);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalled();
        });

        it('should handle errors in password recovery email sending', async () => {
            const testEmail = 'test@example.com';
            req.body.email = testEmail;

            EmailService.sendPasswordRecoveryEmail.mockRejectedValue(new Error('Failed to send email'));

            await expect(sendForgotPasswordEmail(req, res)).rejects.toThrow('Failed to send email');
        });
    });

    describe('sendValidationEmail', () => {
        it('should send validation email successfully', async () => {
            const userId = 123;
            req.user = { id: userId };

            EmailService.sendEmailVerification.mockResolvedValue(true);

            await sendValidationEmail(req, res);

            expect(EmailService.sendEmailVerification).toHaveBeenCalledWith(userId);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith({
                message: 'Email sent successfully'
            });
        });

        it('should handle failure in validation email sending', async () => {
            const userId = 123;
            req.user = { id: userId };

            EmailService.sendEmailVerification.mockResolvedValue(false);

            await sendValidationEmail(req, res);

            expect(EmailService.sendEmailVerification).toHaveBeenCalledWith(userId);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith('Email not sent');
        });

        it('should handle errors in validation email sending', async () => {
            const userId = 123;
            req.user = { id: userId };

            EmailService.sendEmailVerification.mockRejectedValue(new Error('Failed to send email'));

            await expect(sendValidationEmail(req, res)).rejects.toThrow('Failed to send email');
        });
    });
});