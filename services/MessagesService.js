const Messages = require('../models/Messages/Messages.js');
const PusherService = require('./PusherService.js');
const NotificationService = require('./NotificationService.js');

exports.getMessagesByUserId = async (userId, friendId) => {
	try {
		const messages = await Messages.getMessagesByUserId(userId, friendId);
		await PusherService.requestStatus(userId);

		return messages;
	} catch (error) {
		throw new Error('Failed to fetch messages');
	}
}

exports.createMessage = async (senderId, receiverId, content) => {
	try {
		const message = await Messages.createMessage(senderId, receiverId, content);
		await PusherService.sendMessage(message);
		await NotificationService.newMessageNotification(receiverId, senderId);
		return message;
	} catch (error) {
		throw new Error('Failed to create message');
	}
}

exports.readAllMessages = async (userId, friendId) => {
	try {
		const result = await Messages.readAllMessages(userId, friendId);
		return result;
	} catch (error) {
		throw new Error('Failed to read messages');
	}
}