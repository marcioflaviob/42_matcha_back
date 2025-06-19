const DatesService = require('../../services/DatesService');
const DatesController = require('../../controllers/DatesController');

jest.mock('../../services/DatesService');

describe("DatesController.createDate", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it("should create the date and send 201 with the date information", async () => {
        const req = {
            user: {
                id: 1,
            },
            body: {
                senderId: 1,
                receiverId: 2,
                status: "pending",
                scheduledDate: new Date(),
                address: "60 avenue broly",
                latitude: 2,
                longitude: 2,
            }
        }
        const res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };
        const expectedDate = {
            id: 1,
            sender_id: 1,
            receiver_id: 2,
            status: "pending",
            scheduled_date: new Date(),
            address: "60 avenue broly",
            latitude: 2,
            longitude: 2,
        }
        DatesService.createDate.mockResolvedValue(expectedDate);

        await DatesController.createDate(req, res);

        expect(DatesService.createDate).toHaveBeenCalledWith(req.user.id, req.body);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.send).toHaveBeenCalledWith(expectedDate);
    })
});

describe("DatesController.getDatesByUserId", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it("should send 200 and return all the dates filtered", async () => {
        const now = new Date();
        const futureDate = new Date(now.getTime() + 100000);
        const mockedDates = [
            { id: 1, sender_id: 1, scheduled_date: futureDate, status: "accepted" },
            { id: 2, sender_id: 1, scheduled_date: futureDate, status: "pending" },
        ];
        const req = {
            user: {
                id: 1
            }
        }
        const res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };
        DatesService.getDatesByUserId.mockResolvedValue(mockedDates);

        await DatesController.getDatesByUserId(req, res);

        expect(DatesService.getDatesByUserId).toHaveBeenCalledWith(req.user.id);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith(mockedDates);
    })
});

describe("DatesController.updateDate", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should update the date and send it back with 200", async () => {
        const updatedDate = { id: 1, status: "accepted" };

        const req = {
            body: {
                id: 1,
                status: "accepted"
            }
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };

        DatesService.updateDate.mockResolvedValue(updatedDate);

        await DatesController.updateDate(req, res);

        expect(DatesService.updateDate).toHaveBeenCalledWith(1, "accepted");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith(updatedDate);
    });
});

describe("DatesController.getDateById", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should return a date by ID with 200", async () => {
        const date = { id: 42, status: "pending" };

        const req = {
            params: {
                id: 42
            }
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };

        DatesService.getDateById.mockResolvedValue(date);

        await DatesController.getDateById(req, res);

        expect(DatesService.getDateById).toHaveBeenCalledWith(42);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith(date);
    });
});



