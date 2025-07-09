const Notification = require('../models/Notification/Notification.js');
const UserService = require('./UserService.js');
const PusherService = require('./PusherService.js');

exports.getNotSeenNotificationsByUserId = async (userId) => {
	const notifications = await Notification.findAllNotSeenNotificationsByUserId(userId);
	return notifications;
}

exports.getAllProfileViewNotificationsByUserIdWithPictures = async (userId) => {
	const UserPicturesService = require('./UserPictureService.js');

	const notifications = await Notification.getAllProfileViewNotificationsByUserId(userId);
	const notificationsWithPictures = await Promise.all(notifications.map(async notification => {
		notification.pictures = await UserPicturesService.getUserPictures(notification.concerned_user_id);
		return notification;
	}));
	return notificationsWithPictures;
}

exports.markAllAsSeen = async (userId) => {
	const notifications = await Notification.markAllAsSeen(userId);
	return notifications;
}

exports.createNotification = async (userId, senderId, type, title, message, body) => {
	if (await alreadyHaveNotification(userId, message)) {
		return;
	}

	const notification = await Notification.createNotification(userId, senderId, type, title, message);
	notification.body = body || null;
	await PusherService.sendNotification(notification);

	return notification;
}

exports.newCallNotification = async (userId, senderId) => {
	const user = await UserService.getUserById(senderId);

	const notification = {
		user_id: userId,
		concerned_user_id: senderId,
		type: 'new-call',
		title: 'Incoming Call',
		message: `${user.first_name} is calling you`,
	}

	await PusherService.sendNotification(notification);

	return notification;
}

exports.newStopCallNotification = async (userId, senderId) => {
	const user = await UserService.getUserById(senderId);

	const notification = {
		user_id: userId,
		concerned_user_id: senderId,
		type: 'stop-call',
		title: 'Stop Call',
		message: `${user.first_name} interrupted the call`,
	}

	await PusherService.sendNotification(notification);

	return notification;
}

exports.newRefusedCallNotification = async (userId, senderId) => {
	const user = await UserService.getUserById(senderId);

	const notification = {
		user_id: userId,
		concerned_user_id: senderId,
		type: 'new-refused-call',
		title: 'New Refused Call',
		message: `${user.first_name} refused your call`,
	}

	await PusherService.sendNotification(notification);

	return notification;
}

exports.newMessageNotification = async (userId, senderId) => {
	const user = await UserService.getUserById(senderId);

	const notification = await this.createNotification(userId, senderId, 'new-message', 'New Message', `You have new messages from ${user.first_name}`);
	return notification;
}

exports.newLikeNotification = async (userId, senderId) => {
	const user = await UserService.getUserById(senderId);

	const notification = await this.createNotification(userId, senderId, 'new-like', 'New Like', `${user.first_name} liked your profile`);
	return notification;
}

exports.newMatchNotification = async (userId, senderId) => {
	const sender = await UserService.getUserById(senderId);
	const user = await UserService.getUserById(userId);

	const notification = await this.createNotification(userId, senderId, 'new-match', 'New Match', `You have a new match with ${sender.first_name}`, sender);
	await this.createNotification(senderId, userId, 'new-match', 'New Match', `You have a new match with ${user.first_name}`, user);

	return notification;
}

exports.newSeenNotification = async (userId, senderId) => {
	const user = await UserService.getUserById(senderId);

	const notification = await this.createNotification(userId, senderId, 'new-seen', 'Your profile was viewed', `${user.first_name} has seen your profile`);
	return notification;
}

exports.newUnlikeNotification = async (userId, senderId) => {
	const user = await UserService.getUserById(senderId);

	const notification = await this.createNotification(userId, senderId, 'new-unlike', 'Match undone', `${user.first_name} unliked you`);
	return notification;
}

const alreadyHaveNotification = async (userId, message) => {
	const unreadNotifications = await this.getNotSeenNotificationsByUserId(userId);
	const notification = unreadNotifications.find(notification => notification.message == message);

	return notification !== undefined;
}

exports.newDateNotification = async (senderId, receiverId) => {
	const user = await UserService.getUserById(senderId);

	const notification = await this.createNotification(receiverId, senderId, 'new-date', 'New date', `${user.first_name} scheduled a date with you`);
	return notification;
}

exports.deleteNotification = async (notificationId) => {
	const notification = await Notification.deleteNotification(notificationId);
	return notification;
}

exports.getNotificationByUserIdAndConcernedUserIdAndType = async (userId, concernedUserId, type) => {
	const notifications = await Notification.findAllNotificationsByUserIdAndConcernedUserIdAndType(userId, concernedUserId, type);
	return notifications[0];
}