const { Resend } = require('resend');
const { passwordRecoveryTemplate, emailVerificationTemplate } = require('../utils/EmailTemplates.js');
const jwt = require('jsonwebtoken');
const UserService = require('./UserService.js');
const ApiException = require('../exceptions/ApiException.js');

const JWT_SECRET = process.env.JWT_SECRET;
const resend = new Resend(process.env.EMAIL_API_KEY);

const sendEmail = async (to, subject, html) => {
	const { data, error } = await resend.emails.send({
		from: process.env.EMAIL_FROM,
		to,
		subject,
		html,
	});

	if (error) throw new Error(`Failed to send email: ${error.message}`);

	return data;
};

exports.sendPasswordRecoveryEmail = async (email) => {

	if (!email) throw new ApiException(400, 'Email is required');

	const user = await UserService.getUserByEmail(email);

	if (!user) throw new ApiException(200, 'Email sent'); // Do not reveal if the email exists

	const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
	const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
	const subject = 'Password Recovery';
	const html = passwordRecoveryTemplate(resetLink);
	return await sendEmail(user.email, subject, html);
};

exports.sendEmailVerification = async (userId) => {
	const user = await UserService.getUserById(userId);

	const subject = 'Email Verification';

	const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
	const verificationLink = `${process.env.FRONTEND_URL}/register?token=${token}`;
	const html = emailVerificationTemplate(verificationLink);
	return await sendEmail(user.email, subject, html);
};
