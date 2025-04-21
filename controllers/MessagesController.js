const MessagesService = require('../services/MessagesService');

exports.getMessagesByUserId = async (req, res) => {
	try {
		const userId = req.user.id;
		const friendId = req.params.id;
		const messages = await MessagesService.getMessagesByUserId(userId, friendId);
		res.status(200).send(messages);
	} catch (err) {
		res.status(404).send({ error: err.message });
	}
}

exports.createMessage = async (req, res) => {
	try {
		const userId = req.user.id;
		const friendId = req.body.receiver_id;
		const messageContent = req.body.content;

		if (!friendId) {
			return res.status(400).send({ error: 'Friend ID is required' });
		}
		if (!messageContent) {
			return res.status(400).send({ error: 'Message content is required' });
		}

		const message = await MessagesService.createMessage(userId, friendId, messageContent);
		res.status(201).send(message);
	} catch (err) {
		res.status(404).send({ error: err.message });
	}
}

exports.readAllMessages = async (req, res) => {
	try {
		const userId = req.user.id;
		const friendId = req.params.id;
		await MessagesService.readAllMessages(userId, friendId);
		res.status(204).send();
	} catch (err) {
		res.status(404).send({ error: err.message });
	}
}