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

exports.sendSeenNotification = async (req, res) => {
	try {
		const senderId = req.user.id;
		const receiverId = req.params.id;

		const notification = await NotificationService.newSeenNotification(receiverId, senderId);

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

exports.sendDateNotification= async (req, res) => {
    try {
		const sender_id = req.body.senderId;
		const receiver_id = req.body.receiverId;
		const date_data = req.body.dateData;
        const {notification, date} = await NotificationService.newDateNotification(sender_id, receiver_id, date_data);
        res.status(200).send({notification, date});
    } catch (error) {
		res.status(500).send({ error: 'Failed to send date notification' });
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