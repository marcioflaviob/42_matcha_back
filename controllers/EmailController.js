const EmailService = require('../services/EmailService.js');

exports.sendForgotPasswordEmail = async (req, res) => {
	const email = req.body.email;

	await EmailService.sendPasswordRecoveryEmail(email);
	res.status(200).send();
}

exports.sendValidationEmail = async (req, res) => {
	const userId = req.user.id;

	const result = await EmailService.sendEmailVerification(userId);

	if (!result) {
		return res.status(400).send('Email not sent');
	}

	res.status(200).send({
		message: 'Email sent successfully'
	});
}