const MessagesService = require('../services/MessagesService.js');

exports.getMessagesByUserId = async (req, res) => {
	const userId = req.user.id;
	const friendId = req.params.id;
	const messages = await MessagesService.getMessagesByUserId(userId, friendId);
	res.status(200).send(messages);
}

exports.createMessage = async (req, res) => {
	const userId = req.user.id;
	const friendId = req.body.receiver_id;
	const messageContent = req.body.content;
	const timestamp = req.body.timestamp;

	if (!friendId) {
		return res.status(400).send({ error: 'Friend ID is required' });
	}
	if (!messageContent) {
		return res.status(400).send({ error: 'Message content is required' });
	}

	const message = await MessagesService.createMessage(userId, friendId, messageContent, timestamp);
	res.status(201).send(message);
}

exports.readAllMessages = async (req, res) => {
	const userId = req.user.id;
	const friendId = req.params.id;
	await MessagesService.readAllMessages(userId, friendId);
	res.status(204).send();
}