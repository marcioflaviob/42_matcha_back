const { pusher } = require('../utils/PusherMiddleware.js');
const UserInteractionsService = require('../services/UserInteractionsService.js');
const ApiException = require('../exceptions/ApiException.js');


exports.broadcastStatusChange = async (userId, status) => {
	const matchesIds = await UserInteractionsService.getMatchesIdsByUserId(userId);

	matchesIds.forEach(async (matchId) => {
		await this.sendStatusChange(userId, matchId, status);
	})

	return true;
}

exports.sendMessage = async (messageData) => {
	try {
		await pusher.trigger(`private-user-${messageData.receiver_id}`, 'new-message', {
			id: messageData.id,
			sender_id: messageData.sender_id,
			receiver_id: messageData.receiver_id,
			content: messageData.content,
			timestamp: new Date(),
			is_read: false,
		});
	} catch (error) {
		throw new ApiException('Failed to send message', 500);
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
		throw new ApiException('Failed to send message', 500);
	}
}

exports.sendStatusChange = async (senderId, receiverId, status) => {
	try {
		await pusher.trigger(`private-user-${receiverId}`, 'status-change', {
			sender_id: senderId,
			status,
		});
	} catch (error) {
		throw new ApiException('Failed to send message', 500);
	}
}

exports.requestStatus = async (userId) => {
	try {
		const matchesIds = await UserInteractionsService.getMatchesIdsByUserId(userId);

		matchesIds.forEach(async (matchId) => {
			await pusher.trigger(`private-user-${matchId}`, 'status-request', {
				sender_id: userId,
			});
		})
	} catch (error) {
		throw new ApiException('Failed to send message', 500);
	}
}

exports.authenticatePusher = async (userId, socketId, channelName) => {
	try {
		const { authenticate } = require("../utils/PusherMiddleware.js");
    	const auth = await authenticate(userId, socketId, channelName);

		if (!auth) throw new ApiException(403, 'Authentication failed');

		return auth;
	} catch (error) {
		throw new ApiException('Failed to authenticate', 500);
	}
}