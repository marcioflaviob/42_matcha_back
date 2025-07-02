const Messages = require('../models/Messages/Messages.js');
const PusherService = require('./PusherService.js');
const NotificationService = require('./NotificationService.js');
const DatesService = require('./DatesService.js');

exports.getMessagesByUserId = async (userId, friendId) => {
	const messages = await Messages.getMessagesByUserId(userId, friendId);
	const messagesWithDates = messages.map(async message => {
		if (message.date_id) {
			const date = await DatesService.getDateById(message.date_id);
			message.date = date;
		}
		return message;
	});
	await PusherService.requestStatus(userId);
	return Promise.all(messagesWithDates);
}

exports.createMessage = async (senderId, receiverId, content, timestamp) => {
	const message = await Messages.createMessage(senderId, receiverId, content, null, timestamp);
	await PusherService.sendMessage(message);
	await NotificationService.newMessageNotification(receiverId, senderId);
	return message;
}

exports.createDateMessage = async (senderId, receiverId, content, date) => {
	const timestamp = new Date().toISOString();
	const message = await Messages.createMessage(senderId, receiverId, content, date.id, timestamp);
	message.date = date;
	return message;
}

exports.readAllMessages = async (userId, friendId) => {
	const result = await Messages.readAllMessages(userId, friendId);
	return result;
}