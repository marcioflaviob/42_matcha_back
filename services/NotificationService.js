const Notification = require('../models/Notification/Notification.js');
const UserDataAccess = require('../utils/UserDataAccess.js');
const PusherService = require('./PusherService.js');

exports.getNotSeenNotificationsByUserId = async (userId) => {
	const notifications = await Notification.findAllNotSeenNotificationsByUserId(userId);
	return notifications;
}

exports.markAllAsSeen = async (userId) => {
	const notifications = await Notification.markAllAsSeen(userId);
	return notifications;
}

exports.createNotification = async (userId, senderId, type, title, message) => {
	if (await alreadyHaveNotification(userId, message)) {
		return;
	}

	const notification = await Notification.createNotification(userId, senderId, type, title, message);
	await PusherService.sendNotification(notification);

	return notification;
}

exports.newCallNotification = async (userId, senderId) => {
	const user = await UserDataAccess.getBasicUserById(senderId);

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
	const user = await UserDataAccess.getBasicUserById(senderId);

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
	const user = await UserDataAccess.getBasicUserById(senderId);

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
	const user = await UserDataAccess.getBasicUserById(senderId);

	const notification = await this.createNotification(userId, senderId, 'new-message', 'New Message', `You have new messages from ${user.first_name}`);
	return notification;
}

exports.newLikeNotification = async (userId, senderId) => {
	const user = await UserDataAccess.getBasicUserById(senderId);

	const notification = await this.createNotification(userId, senderId, 'new-like', 'New Like', `${user.first_name} liked your profile`);
	return notification;
}

exports.newMatchNotification = async (userId, senderId) => {
	const sender = await UserDataAccess.getBasicUserById(senderId);
	const user = await UserDataAccess.getBasicUserById(userId);

	const notification = await this.createNotification(userId, senderId, 'new-match', 'New Match', `You have a new match with ${sender.first_name}`);
	await Notification.createNotification(senderId, userId, 'new-match', 'New Match', `You have a new match with ${user.first_name}`);

	return notification;
}

exports.newProfileViewNotification = async (userId, senderId) => {
	const user = await UserDataAccess.getBasicUserById(senderId);

	const notification = await this.createNotification(userId, senderId, 'new-profile-view', 'New Profile View', `${user.first_name} viewed your profile`);
	return notification;
}

exports.newSeenNotification = async (userId, senderId) => {
	const user = await UserDataAccess.getBasicUserById(senderId);

	const notification = await this.createNotification(userId, senderId, 'new-seen', 'Your profile was viewed', `${user.first_name} has seen your profile`);
	return notification;
}

exports.newBlockNotification = async (userId, senderId) => {
	const user = await UserDataAccess.getBasicUserById(senderId);

	const notification = await this.createNotification(userId, senderId, 'new-block', 'New Block', `${user.first_name} blocked you`);
	return notification;
}

const alreadyHaveNotification = async (userId, message) => {
	const unreadNotifications = await this.getNotSeenNotificationsByUserId(userId);
	const notification = unreadNotifications.find(notification => notification.message == message);

	return notification !== undefined;
}

exports.newDateNotification = async (senderId, receiverId) => {
	const user = await UserDataAccess.getBasicUserById(senderId);

	const notification = await this.createNotification(receiverId, senderId, 'new-date', 'New date', `${user.first_name} scheduled a date with you`);
	return notification;
}