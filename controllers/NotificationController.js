const NotificationService = require('../services/NotificationService.js');

exports.getNotSeenNotificationsByUserId = async (req, res) => {
	try {
		const userId = req.user.id;

		const notifications = await NotificationService.getNotSeenNotificationsByUserId(userId);
		res.status(200).send(notifications);
	} catch (err) {
		res.status(404).send({ error: err.message });
	}
}

exports.sendNewCallNotification = async (req, res) => {
	try {
		const senderId = req.user.id;
		const receiverId = req.params.id;

		const notification = await NotificationService.newCallNotification(receiverId, senderId);

		res.status(200).send(notification);
	} catch (err) {
		res.status(404).send({ error: err.message });
	}
}

exports.sendStopCallNotification = async (req, res) => {
	try {
		const senderId = req.user.id;
		const receiverId = req.params.id;

		const notification = await NotificationService.newStopCallNotification(receiverId, senderId);

		res.status(200).send(notification);
	} catch (err) {
		res.status(404).send({ error: err.message });
	}
}

exports.sendRefuseCallNotification = async (req, res) => {
	try {
		const senderId = req.user.id;
		const receiverId = req.params.id;

		const notification = await NotificationService.newRefusedCallNotification(receiverId, senderId);

		res.status(200).send(notification);
	} catch (err) {
		res.status(404).send({ error: err.message });
	}
}

exports.markNotificationAsSeen = async (req, res) => {
	try {
		const userId = req.user.id;

		await NotificationService.markAllAsSeen(userId);
		res.status(204).send();
	} catch (err) {
		res.status(404).send({ error: err.message });
	}
}