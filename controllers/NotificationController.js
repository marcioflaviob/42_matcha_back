const NotificationService = require('../services/NotificationService.js');

exports.getNotSeenNotificationsByUserId = async (req, res) => {
	const userId = req.user.id;

	const notifications = await NotificationService.getNotSeenNotificationsByUserId(userId);
	res.status(200).send(notifications);
}

exports.getAllProfileViewNotificationsByUserIdWithPictures = async (req, res) => {
	const userId = req.user.id;

	const notifications = await NotificationService.getAllProfileViewNotificationsByUserIdWithPictures(userId);
	res.status(200).send(notifications);
}

exports.sendNewCallNotification = async (req, res) => {
	const senderId = req.user.id;
	const receiverId = req.params.id;

	const notification = await NotificationService.newCallNotification(receiverId, senderId);

	res.status(200).send(notification);
}

exports.sendStopCallNotification = async (req, res) => {
	const senderId = req.user.id;
	const receiverId = req.params.id;

	const notification = await NotificationService.newStopCallNotification(receiverId, senderId);

	res.status(200).send(notification);
}

exports.sendSeenNotification = async (req, res) => {
	const senderId = req.user.id;
	const receiverId = req.params.id;

	const notification = await NotificationService.newSeenNotification(receiverId, senderId);

	res.status(200).send(notification);
}

exports.sendRefuseCallNotification = async (req, res) => {
	const senderId = req.user.id;
	const receiverId = req.params.id;

	const notification = await NotificationService.newRefusedCallNotification(receiverId, senderId);

	res.status(200).send(notification);
}

exports.sendDateNotification = async (req, res) => {
	const sender_id = req.body.senderId;
	const receiver_id = req.body.receiverId;
	const address = req.body.address;
	const scheduled_date = req.body.dateData;
	const latitude = req.body.latitude;
	const longitude = req.body.longitude;
	const { notification, date } = await NotificationService.newDateNotification(sender_id, receiver_id, scheduled_date, address, latitude, longitude);
	res.status(200).send({ notification, date });
}

exports.newUnansweredDate = async (req, res) => {
	const dateId = req.params.id;
	const { notification, date } = await NotificationService.newUnansweredDate(dateId);
	res.status(200).send({ notification, date });
}

exports.markNotificationAsSeen = async (req, res) => {
	const userId = req.user.id;

	await NotificationService.markAllAsSeen(userId);
	res.status(204).send();
}