const { Pool } = require('pg');
const ApiException = require('../../exceptions/ApiException.js');
const { mockConsole, restoreConsole } = require('../utils/testSetup');

let mockClient;
const mockPool = {
    connect: jest.fn(),
    query: jest.fn()
};
jest.mock('pg', () => ({
    Pool: jest.fn(() => mockPool)
}));

jest.mock('dotenv', () => ({
    config: jest.fn()
}));

describe('Database Configuration', () => {
    let originalEnv;
    let db;

    beforeEach(() => {
        originalEnv = process.env;
        process.env = { ...originalEnv };
        process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';

        jest.clearAllMocks();

        mockClient = {
            query: jest.fn().mockResolvedValue({}),
            release: jest.fn()
        };

        mockPool.connect.mockResolvedValue(mockClient);
        mockPool.query.mockResolvedValue({ rows: [] });

        jest.resetModules();
        mockConsole();
        delete require.cache[require.resolve('../../config/db.js')];
    });

    afterEach(() => {
        process.env = originalEnv;
        restoreConsole();
    });

    describe('Database Initialization', () => {
        it('should successfully initialize database connection', async () => {
            db = require('../../config/db.js');
            await db.initDB();

            expect(mockPool.connect).toHaveBeenCalled();
            expect(mockClient.release).toHaveBeenCalled();
            expect(console.log).toHaveBeenCalledWith('Successfully connected to PostgreSQL database');
        });

        it('should handle connection errors', async () => {
            const mockError = new Error('Connection failed');
            mockPool.connect.mockRejectedValueOnce(mockError);

            db = require('../../config/db.js');
            await db.initDB();

            expect(console.error).toHaveBeenCalledWith('Error connecting to database:', mockError.stack);
        });

        it('should throw error when DATABASE_URL is missing', () => {
            delete process.env.DATABASE_URL;

            expect(() => {
                db = require('../../config/db.js');
            }).toThrow('Missing DATABASE_URL in environment variables');
        });
    });

    describe('Query Execution', () => {
        beforeEach(() => {
            db = require('../../config/db.js');
        });

        it('should execute a query successfully', async () => {
            const mockQuery = 'SELECT * FROM users';
            const mockParams = [1];
            const mockResult = { rows: [{ id: 1, name: 'test' }] };

            mockPool.query.mockResolvedValueOnce(mockResult);

            const result = await db.query(mockQuery, mockParams);

            expect(mockPool.query).toHaveBeenCalledWith(mockQuery, mockParams);
            expect(result).toEqual(mockResult);
        });

        it('should handle query errors', async () => {
            const mockError = new Error('Query failed');
            mockPool.query.mockRejectedValueOnce(mockError);

            await expect(db.query('SELECT 1')).rejects.toThrow(mockError);
        });
    });

    describe('Transaction Management', () => {
        beforeEach(() => {
            db = require('../../config/db.js');
        });

        it('should execute a transaction successfully', async () => {
            mockClient.query.mockImplementation(async (query) => {
                if (query === 'BEGIN' || query === 'COMMIT') return {};
                return { rows: [] };
            });
            const mockCallback = jest.fn().mockResolvedValue('result');

            const result = await db.transaction(mockCallback);

            expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
            expect(mockCallback).toHaveBeenCalledWith(mockClient);
            expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
            expect(mockClient.release).toHaveBeenCalled();
            expect(result).toBe('result');
        });

        it('should rollback transaction on error', async () => {
            mockClient.query.mockImplementation(async (query) => {
                if (query === 'BEGIN' || query === 'ROLLBACK') return {};
                return { rows: [] };
            });
            const mockError = new Error('Transaction failed');
            const mockCallback = jest.fn().mockRejectedValue(mockError);

            await expect(db.transaction(mockCallback)).rejects.toThrow(mockError);

            expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
            expect(mockCallback).toHaveBeenCalledWith(mockClient);
            expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
            expect(mockClient.release).toHaveBeenCalled();
        });

        it('should always release client even if commit fails', async () => {
            const mockError = new Error('Commit failed');
            mockClient.query.mockImplementation(async (query) => {
                if (query === 'COMMIT') throw mockError;
                return {};
            });
            const mockCallback = jest.fn().mockResolvedValue('result');

            await expect(db.transaction(mockCallback)).rejects.toThrow(mockError);

            expect(mockClient.release).toHaveBeenCalled();
        });
    });
});