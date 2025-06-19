const DatesService = require('../../services/DatesService');
const Dates = require('../../models/Dates/Dates');
const NotificationService = require('../../services/NotificationService');
const MessagesService = require('../../services/MessagesService');
const ApiException = require('../../exceptions/ApiException');
const { mockConsole, restoreConsole } = require('../utils/testSetup');

jest.mock('../../models/Dates/Dates');
jest.mock('../../services/NotificationService');
jest.mock('../../services/MessagesService');

beforeEach(() => {
    mockConsole();
});

afterEach(() => {
    restoreConsole();
});

describe('DatesService.createDate', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create date and call services when senderId matches userId', async () => {
        const date = {
            id: 1,
            senderId: 1,
            receiverId: 2,
            scheduledDate: new Date(),
            address: "1 rue courge",
            latitude: 2,
            longitude: 2,
            status: "pending"
        }
        const expectedDate = {
            id: 1,
            sender_id: 1,
            receiver_id: 2,
            scheduled_date: new Date(),
            address: "1 rue courge",
            latitude: 2,
            longitude: 2,
            status: "pending"
        }

        Dates.createDate.mockResolvedValue(expectedDate);
        NotificationService.newDateNotification.mockResolvedValue();
        MessagesService.createDateMessage.mockResolvedValue();

        const result = await DatesService.createDate(1, date);

        expect(Dates.createDate).toHaveBeenCalledWith(date);
        expect(NotificationService.newDateNotification).toHaveBeenCalledWith(1, 2);
        expect(MessagesService.createDateMessage).toHaveBeenCalledWith(1, 2, 'Date', 1);
        expect(result).toEqual(expectedDate);
    });

    it("should throw 403 when userId is different than date.senderId", async () => {
        const date = {
            senderId: 123,
            receiverId: 456,
        };

        const promise = DatesService.createDate(88, date);
        expect(promise).rejects.toThrow(ApiException);
        expect(promise).rejects.toThrow("You are not allowed to create this date");
    });
});

describe("DatesService.getDatesByUserId", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it("should get dates and filter them for only present to future not refused", async () => {
        const userId = 1;
        const now = new Date();
        const futureDate = new Date(now.getTime() + 100000);
        const pastDate = new Date(now.getTime() - 100000);
        const mockedDates = [
            { id: 1, sender_id: userId, scheduled_date: futureDate, status: "refused" },
            { id: 2, sender_id: userId, scheduled_date: futureDate, status: "pending" },
            { id: 3, sender_id: userId, scheduled_date: pastDate, status: "pending" },
            { id: 4, sender_id: userId, scheduled_date: pastDate, status: "refused" },
            { id: 5, sender_id: userId, scheduled_date: now, status: "pending" },
            { id: 6, sender_id: userId, scheduled_date: now, status: "refused" },
        ];
        Dates.getDatesByUserId.mockResolvedValue(mockedDates);

        const result = await DatesService.getDatesByUserId(userId);

        expect(Dates.getDatesByUserId).toHaveBeenCalledWith(userId);
        expect(result).toEqual([
            { id: 2, sender_id: userId, scheduled_date: futureDate, status: "pending" },
        ])
    })
    it("should return an empty array if none of the dates status and scheduled_date match criteria", async () => {
        const userId = 1;
        const mockedDates = [
            { id: 1, sender_id: userId, scheduled_date: new Date(), status: "refused" },
            { id: 2, sender_id: userId, scheduled_date: new Date(), status: "pending" },
        ]
        Dates.getDatesByUserId.mockResolvedValue(mockedDates);

        const result = await DatesService.getDatesByUserId(userId);

        expect(Dates.getDatesByUserId).toHaveBeenCalledWith(userId);
        expect(result).toEqual([]);
    })
});

describe("DatesService.getDateById", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it("should return a date object", async () => {
        const id = 1;
        const date = {
            id: 1
        }
        Dates.getDateById.mockResolvedValue(date);

        const result = await DatesService.getDateById(id);

        expect(Dates.getDateById).toHaveBeenCalledWith(id);
        expect(result).toEqual(date);
    })
})

describe("DatesService.updateDate", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it("should return an updated date object", async () => {
        const id = 1;
        const newStatus = "accepted";
        const date = {
            id: 1,
            status: "accepted"
        }
        Dates.updateDate.mockResolvedValue(date);

        const result = await DatesService.updateDate(id, newStatus);

        expect(Dates.updateDate).toHaveBeenCalledWith(id, newStatus);
        expect(result).toEqual(date);
    })
})
