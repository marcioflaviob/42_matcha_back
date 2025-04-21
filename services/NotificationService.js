const Notification = require('../models/Notification/Notification');
const UserService = require('./UserService');
const PusherService = require('./PusherService');

exports.getNotSeenNotificationsByUserId = async (userId) => {
	try {
		const notifications = await Notification.findAllNotSeenNotificationsByUserId(userId);
		return notifications;
	} catch (error) {
		throw new Error('Failed to fetch notifications');
	}
}

exports.markAllAsSeen = async (userId) => {
	try {
		const notifications = await Notification.markAllAsSeen(userId);
		return notifications;
	} catch (error) {
		throw new Error('Failed to mark notifications as seen');
	}
}

exports.createNotification = async (userId, type, title, message) => {
	try {
		if (await alreadyHaveNotification(userId, message)) {
			return;
		}

		const notification = await Notification.createNotification(userId, type, title, message);
		await PusherService.sendNotification(notification);

		return notification;
	} catch (error) {
		throw new Error('Failed to create notification');
	}
}

exports.newMessageNotification = async (userId, senderId) => {
	try {
		const user = await UserService.getUserById(senderId);
		if (!user) {
			throw new Error('User not found');
		}

		const notification = await this.createNotification(userId, 'new-message', 'New Message', `You have new messages from ${user.first_name}`);
		return notification;
	} catch (error) {
		throw new Error('Failed to create message notification');
	}
}

exports.newLikeNotification = async (userId, senderId) => {
	try {
		const user = await UserService.getUserById(senderId);
		if (!user) {
			throw new Error('User not found');
		}

		const notification = await this.createNotification(userId, 'new-like', 'New Like', `${user.first_name} liked your profile`);
		return notification;
	} catch (error) {
		throw new Error('Failed to create like notification');
	}
}

exports.newMatchNotification = async (userId, senderId) => {
	try {
		const sender = await UserService.getUserById(senderId);
		const user = await UserService.getUserById(userId);
		if (!sender || !user) {
			throw new Error('User not found');
		}

		const notification = await this.createNotification(userId, 'new-match', 'New Match', `You have a new match with ${sender.first_name}`);
		await Notification.createNotification(senderId, 'new-match', 'New Match', `You have a new match with ${user.first_name}`);

		return notification;
	} catch (error) {
		throw new Error('Failed to create match notification');
	}
}

exports.newProfileViewNotification = async (userId, senderId) => {
	try {
		const user = await UserService.getUserById(senderId);
		if (!user) {
			throw new Error('User not found');
		}

		const notification = await this.createNotification(userId, 'new-profile-view', 'New Profile View', `${user.first_name} viewed your profile`);
		return notification;
	} catch (error) {
		throw new Error('Failed to create profile view notification');
	}
}

exports.newBlockNotification = async (userId, senderId) => {
	try {
		const user = await UserService.getUserById(senderId);
		if (!user) {
			throw new Error('User not found');
		}

		const notification = await this.createNotification(userId, 'new-block', 'New Block', `${user.first_name} blocked you`);
		return notification;
	} catch (error) {
		throw new Error('Failed to create block notification');
	}
}

const alreadyHaveNotification = async (userId, message) => {
	const unreadNotifications = await this.getNotSeenNotificationsByUserId(userId);
	const notification = unreadNotifications.find(notification => notification.message == message);

	return notification !== undefined;
}