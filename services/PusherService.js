const { pusher } = require('../utils/PusherMiddleware.js');
const ApiException = require('../exceptions/ApiException.js');


exports.broadcastStatusChange = async (userId, status) => {
	const UserInteractionsService = require('../services/UserInteractionsService.js');
	const matchesIds = await UserInteractionsService.getMatchesIdsByUserId(userId);

	matchesIds.forEach(async (matchId) => {
		await this.sendStatusChange(userId, matchId, status);
	})

	return true;
}

exports.sendMessage = async (messageData) => {
	try {
		if (JSON.stringify(messageData).length > 10240) {
			throw new ApiException(400, 'Message too large');
		}
		await pusher.trigger(`private-user-${messageData.receiver_id}`, 'new-message', {
			id: messageData.id,
			sender_id: messageData.sender_id,
			receiver_id: messageData.receiver_id,
			content: messageData.content,
			timestamp: new Date(),
			is_read: false,
		});
	} catch (error) {
		throw new ApiException(500, 'Failed to send message');
	}
}

exports.sendDateMessage = async (messageData) => {
	try {
		if (JSON.stringify(messageData).length > 10240) {
			throw new ApiException(400, 'Message too large');
		}
		await pusher.trigger(`private-user-${messageData.receiver_id}`, 'new-message', {
			id: messageData.id,
			sender_id: messageData.sender_id,
			date: messageData.date,
			receiver_id: messageData.receiver_id,
			content: messageData.content,
			timestamp: new Date(),
			is_read: false,
		});
		await pusher.trigger(`private-user-${messageData.sender_id}`, 'new-message', {
			id: messageData.id,
			sender_id: messageData.sender_id,
			date: messageData.date,
			receiver_id: messageData.receiver_id,
			content: messageData.content,
			timestamp: new Date(),
			is_read: false,
		});
	} catch {
		throw new ApiException(500, 'Failed to send message');
	}
}

exports.sendNotification = async (notificationData) => {
	try {
		await pusher.trigger(`private-user-${notificationData.user_id}`, 'new-notification', {
			id: notificationData.id,
			user_id: notificationData.user_id,
			concerned_user_id: notificationData.concerned_user_id,
			type: notificationData.type,
			title: notificationData.title,
			message: notificationData.message,
			seen: false,
		});
	} catch (error) {
		throw new ApiException(500, 'Failed to send notification');
	}
}

exports.sendStatusChange = async (senderId, receiverId, status) => {
	try {
		await pusher.trigger(`private-user-${receiverId}`, 'status-change', {
			sender_id: senderId,
			status,
		});
	} catch (error) {
		console.error('Error sending status change:', error);
		throw new ApiException(500, 'Failed to send status change');
	}
}

exports.requestStatus = async (userId) => {
	const UserInteractionsService = require('../services/UserInteractionsService.js');
	try {
		const matchesIds = await UserInteractionsService.getMatchesIdsByUserId(userId);

		matchesIds.forEach(async (matchId) => {
			await pusher.trigger(`private-user-${matchId}`, 'status-request', {
				sender_id: userId,
			});
		})
	} catch (error) {
		console.error('Error requesting status:', error);
		throw new ApiException(500, 'Failed to request status');
	}
}

exports.authenticatePusher = (userId, socketId, channelName) => {
	try {
		const { authenticate } = require("../utils/PusherMiddleware.js");
		const auth = authenticate(userId, socketId, channelName);

		if (!auth) throw new ApiException(403, 'Authentication failed');

		return auth;
	} catch (error) {
		throw new ApiException(500, 'Failed to authenticate');
	}
}