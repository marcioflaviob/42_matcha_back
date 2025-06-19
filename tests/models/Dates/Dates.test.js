const Dates = require('../../../models/Dates/Dates');
const db = require('../../../config/db')
const ApiException = require('../../../exceptions/ApiException');

jest.mock('../../../config/db');

beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation(() => { });
});

afterEach(() => {
  console.log.mockRestore();
});

describe('Dates.getDatesByUserId', () => {
  const userId = 42;

  it('should return rows when query succeeds', async () => {
    const fakeRows = [{ id: 1 }, { id: 2 }];
    db.query.mockResolvedValue({ rows: fakeRows });

    const result = await Dates.getDatesByUserId(userId);
    expect(db.query).toHaveBeenCalledWith(
      'SELECT * FROM dates WHERE receiver_id = $1 OR sender_id = $1',
      [userId]
    );
    expect(result).toEqual(fakeRows);
  });

  it('should throw ApiException on db error', async () => {
    db.query.mockRejectedValue(new Error('DB failure'));
    const promise = Dates.getDatesByUserId(userId);
    await expect(promise).rejects.toThrow(ApiException);
    await expect(promise).rejects.toThrow('Failed to fetch dates');
  });
});

describe('Dates.getUnansweredDatesByReceiverId', () => {
  const userId = 42;
  it('should return rows when query succeeds', async () => {
    const fakeRows = [{ id: 1, status: "pending" }, { id: 2, status: "pending" }];
    db.query.mockResolvedValue({ rows: fakeRows });

    const result = await Dates.getUnansweredDatesByReceiverId(userId);
    expect(db.query).toHaveBeenCalledWith(
      'SELECT * FROM dates WHERE receiver_id = $1 AND status = $2',
      [userId, "pending"]
    );
    expect(result).toEqual(fakeRows);
  });

  it('should throw ApiException on db error', async () => {
    db.query.mockRejectedValue(new Error('DB failure'));

    const promise = Dates.getUnansweredDatesByReceiverId(userId);
    await expect(promise).rejects.toThrow(ApiException);
    await expect(promise).rejects.toThrow('Failed to fetch unanswered dates');
  });
})

describe('Dates.createDate', () => {
  const date = {
    senderId: 1,
    receiverId: 2,
    scheduledDate: new Date(),
    address: "1 rue du Coq d'Or",
    latitude: 1,
    longitude: 1,
    id: 1,
    status: "pending"
  };
  it('should return the date back when query succeeds', async () => {
    const fakeRows = [date];
    db.query.mockResolvedValue({ rows: fakeRows });

    const result = await Dates.createDate(date);
    expect(db.query).toHaveBeenCalledWith(
      'INSERT INTO dates (sender_id, receiver_id, scheduled_date, address, latitude, longitude, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [date.senderId, date.receiverId, date.scheduledDate, date.address, date.latitude, date.longitude, 'pending']
    );
    expect(result).toEqual(fakeRows[0]);
  });

  it('should throw ApiException on db error', async () => {
    db.query.mockRejectedValue(new Error('DB failure'));
    const promise = Dates.createDate(date);
    await expect(promise).rejects.toThrow(ApiException);
    await expect(promise).rejects.toThrow('Failed to create date');
  });
})

describe('Dates.getDateById', () => {
  const id = 42;
  it('should return date when query succeeds', async () => {
    const fakeRows = [{ id: 42 }];
    db.query.mockResolvedValue({ rows: fakeRows });
    const result = await Dates.getDateById(id);
    expect(db.query).toHaveBeenCalledWith(
      'SELECT * FROM dates WHERE id = $1',
      [id]
    );
    expect(result).toEqual(fakeRows[0]);
  });

  it('should throw ApiException on db error', async () => {
    db.query.mockRejectedValue(new Error('DB failure'));

    const promise = Dates.getDateById(id);
    await expect(promise).rejects.toThrow(ApiException);
    await expect(promise).rejects.toThrow('Failed to fetch date by ID');
  });

  it("should throw ApiException when id is not found", async () => {
    db.query.mockResolvedValue({ rows: [] });

    const promise = Dates.getDateById(42);

    await expect(promise).rejects.toThrow(ApiException);
    await expect(promise).rejects.toThrow("Date not found");
  })
})

describe('Dates.updateDate', () => {
  const id = 42;
  const status = "refused";
  it('should return date when query succeeds', async () => {
    const fakeRows = [{ id: 42, status: "refused" }];
    db.query.mockResolvedValue({ rows: fakeRows });
    const result = await Dates.updateDate(id, status);
    expect(db.query).toHaveBeenCalledWith(
      'UPDATE dates SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    expect(result).toEqual(fakeRows[0]);
  });

  it('should throw ApiException on db error', async () => {
    db.query.mockRejectedValue(new Error('DB failure'));

    const promise = Dates.updateDate(id, status);
    await expect(promise).rejects.toThrow(ApiException);
    await expect(promise).rejects.toThrow('Failed to update date');
  });
})
