const Messages = require('../models/Messages/Messages.js');
const PusherService = require('./PusherService.js');
const NotificationService = require('./NotificationService.js');

exports.getMessagesByUserId = async (userId, friendId) => {
	const messages = await Messages.getMessagesByUserId(userId, friendId);
	await PusherService.requestStatus(userId);

	return messages;
}

exports.createMessage = async (senderId, receiverId, content) => {
	const message = await Messages.createMessage(senderId, receiverId, content, null);
	await PusherService.sendMessage(message);
	await NotificationService.newMessageNotification(receiverId, senderId);

	return message;
}

exports.createDateMessage = async (senderId, receiverId, content, dateId) => {
	const message = await Messages.createMessage(senderId, receiverId, content, dateId);
	return message;
}

exports.readAllMessages = async (userId, friendId) => {
	const result = await Messages.readAllMessages(userId, friendId);
	return result;
}