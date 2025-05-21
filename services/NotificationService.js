const Notification = require('../models/Notification/Notification.js');
const UserService = require('./UserService.js');
const PusherService = require('./PusherService.js');

exports.getNotSeenNotificationsByUserId = async (userId) => {
	try {
		const notifications = await Notification.findAllNotSeenNotificationsByUserId(userId);
		return notifications;
	} catch (error) {
		console.error(error);
		throw new Error('Failed to fetch notifications');
	}
}

exports.markAllAsSeen = async (userId) => {
	try {
		const notifications = await Notification.markAllAsSeen(userId);
		return notifications;
	} catch (error) {
		console.error(error);
		throw new Error('Failed to mark notifications as seen');
	}
}

exports.createNotification = async (userId, senderId, type, title, message) => {
	try {
		if (await alreadyHaveNotification(userId, message)) {
			return;
		}
		
		const notification = await Notification.createNotification(userId, senderId, type, title, message);
		await PusherService.sendNotification(notification);
		
		return notification;
	} catch (error) {
		console.error(error);
		throw new Error('Failed to create notification');
	}
}

exports.newCallNotification = async (userId, senderId) => {
	try {
		const user = await UserService.getUserById(senderId);
		if (!user) {
			throw new Error('User not found');
		}
		
		const notification = {
			user_id: userId,
			concerned_user_id: senderId,
			type: 'new-call',
			title: 'Incoming Call',
			message: `${user.first_name} is calling you`,
		}
		
		await PusherService.sendNotification(notification);
		
		return notification;
	} catch (error) {
		console.error(error);
		throw new Error('Failed to create call notification');
	}
}

exports.newStopCallNotification = async (userId, senderId) => {
	try {
		const user = await UserService.getUserById(senderId);
		if (!user) {
			throw new Error('User not found');
		}
		
		const notification = {
			user_id: userId,
			concerned_user_id: senderId,
			type: 'stop-call',
			title: 'Stop Call',
			message: `${user.first_name} interrupted the call`,
		}
		
		await PusherService.sendNotification(notification);
		
		return notification;
	} catch (error) {
		console.error(error);
		throw new Error('Failed to create call notification');
	}
}

exports.newRefusedCallNotification = async (userId, senderId) => {
	try {
		const user = await UserService.getUserById(senderId);
		if (!user) {
			throw new Error('User not found');
		}
		
		const notification = {
			user_id: userId,
			concerned_user_id: senderId,
			type: 'new-refused-call',
			title: 'New Refused Call',
			message: `${user.first_name} refused your call`,
		}
		
		await PusherService.sendNotification(notification);
		
		return notification;
	} catch (error) {
		console.error(error);
		throw new Error('Failed to create refused call notification');
	}
}

exports.newMessageNotification = async (userId, senderId) => {
	try {
		const user = await UserService.getUserById(senderId);
		if (!user) {
			throw new Error('User not found');
		}
		
		const notification = await this.createNotification(userId, senderId, 'new-message', 'New Message', `You have new messages from ${user.first_name}`);
		return notification;
	} catch (error) {
		console.error(error);
		throw new Error('Failed to create message notification');
	}
}

exports.newLikeNotification = async (userId, senderId) => {
	try {
		const user = await UserService.getUserById(senderId);
		if (!user) {
			throw new Error('User not found');
		}
		
		const notification = await this.createNotification(userId, senderId, 'new-like', 'New Like', `${user.first_name} liked your profile`);
		return notification;
	} catch (error) {
		console.error(error);
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
		
		// Send notification to both users
		const notification = await this.createNotification(userId, senderId, 'new-match', 'New Match', `You have a new match with ${sender.first_name}`);
		await Notification.createNotification(senderId, userId, 'new-match', 'New Match', `You have a new match with ${user.first_name}`);
		
		return notification;
	} catch (error) {
		console.error(error);
		throw new Error('Failed to create match notification');
	}
}

exports.newProfileViewNotification = async (userId, senderId) => {
	try {
		const user = await UserService.getUserById(senderId);
		if (!user) {
			throw new Error('User not found');
		}
		
		const notification = await this.createNotification(userId, senderId, 'new-profile-view', 'New Profile View', `${user.first_name} viewed your profile`);
		return notification;
	} catch (error) {
		console.error(error);
		throw new Error('Failed to create profile view notification');
	}
}

exports.newSeenNotification = async (userId, senderId) => {
	try {
		const user = await UserService.getUserById(senderId);
		if (!user) {
			throw new Error('User not found');
		}
		
		const notification = await this.createNotification(userId, senderId, 'new-seen', 'Your profile was viewed', `${user.first_name} has seen your profile`);
		return notification;
	} catch (error) {
		console.error(error);
		throw new Error('Failed to create seen notification');
	}
}

exports.newBlockNotification = async (userId, senderId) => {
	try {
		const user = await UserService.getUserById(senderId);
		if (!user) {
			throw new Error('User not found');
		}
		
		const notification = await this.createNotification(userId, senderId, 'new-block', 'New Block', `${user.first_name} blocked you`);
		return notification;
	} catch (error) {
		console.error(error);
		throw new Error('Failed to create block notification');
	}
}

const alreadyHaveNotification = async (userId, message) => {
	const unreadNotifications = await this.getNotSeenNotificationsByUserId(userId);
	const notification = unreadNotifications.find(notification => notification.message == message);
	
	return notification !== undefined;
}

exports.newDateNotification = async (senderId, receiverId) => {
	try {
		const user = await UserService.getUserById(senderId);
		if (!user) {
			throw new Error('User not found');
		}

		const notification = await this.createNotification(receiverId, senderId, 'new-date', 'New date', `${user.first_name} scheduled a date with you`);
		return notification
	} catch (error) {
		console.error(error);
		throw new Error('Failed to create date notification');
	}
}