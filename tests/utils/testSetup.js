const mockConsole = () => {
    jest.spyOn(console, 'log').mockImplementation(() => { });
    jest.spyOn(console, 'error').mockImplementation(() => { });
};

const restoreConsole = () => {
    if (console.log.mockRestore) console.log.mockRestore();
    if (console.error.mockRestore) console.error.mockRestore();
};

const createMockReqRes = (overrides = {}) => {
    const mockReq = {
        body: {},
        params: {},
        user: { id: 1 },
        header: jest.fn(),
        ...overrides.req
    };

    const mockRes = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
        json: jest.fn(),
        redirect: jest.fn(),
        ...overrides.res
    };

    return { mockReq, mockRes };
};

const createDbMock = () => ({
    query: jest.fn(),
    transaction: jest.fn()
});

const setupTestEnv = (overrides = {}) => {
    const testEnv = {
        JWT_SECRET: 'test-jwt-secret',
        EMAIL_API_KEY: 'test-email-api-key',
        EMAIL_FROM: 'test@example.com',
        FRONTEND_URL: 'https://test-frontend.com',
        PUSHER_APP_ID: 'test-app-id',
        PUSHER_KEY: 'test-key',
        PUSHER_SECRET: 'test-secret',
        PUSHER_CLUSTER: 'test-cluster',
        NODE_ENV: 'test',
        ...overrides
    };

    Object.assign(process.env, testEnv);
    return testEnv;
};

const createRestorableSpy = (object, method, implementation) => {
    const spy = jest.spyOn(object, method);
    if (implementation) {
        spy.mockImplementation(implementation);
    }
    return spy;
};

const expectDbError = async (fn, expectedErrorMessage = 'Database error') => {
    const mockError = new Error(expectedErrorMessage);
    return { mockError, expectToThrow: () => expect(fn).rejects.toThrow(mockError) };
};

const createMockData = {
    user: (overrides = {}) => ({
        id: 1,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        birthdate: '1990-01-01',
        status: 'complete',
        ...overrides
    }),

    userWithPassword: (overrides = {}) => ({
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword123',
        ...overrides
    }),

    location: (overrides = {}) => ({
        user_id: 1,
        latitude: 48.8566,
        longitude: 2.3522,
        city: 'Paris',
        country: 'France',
        ...overrides
    }),

    interest: (overrides = {}) => ({
        id: 1,
        name: 'coding',
        ...overrides
    }),

    picture: (overrides = {}) => ({
        id: 1,
        user_id: 1,
        url: 'test-pic.jpg',
        is_profile: false,
        ...overrides
    }),

    message: (overrides = {}) => ({
        id: 1,
        sender_id: 1,
        receiver_id: 2,
        content: 'Test message',
        timestamp: new Date(),
        is_read: false,
        ...overrides
    }),

    notification: (overrides = {}) => ({
        id: 1,
        user_id: 1,
        type: 'new-like',
        title: 'Test Notification',
        message: 'Test notification message',
        seen: false,
        ...overrides
    }),

    interaction: (overrides = {}) => ({
        id: 1,
        user1: 1,
        user2: 2,
        interaction_type: 'like',
        ...overrides
    }),

    date: (overrides = {}) => ({
        id: 1,
        sender_id: 1,
        receiver_id: 2,
        status: 'pending',
        scheduled_date: new Date(),
        address: '123 Test Street',
        latitude: 48.8566,
        longitude: 2.3522,
        ...overrides
    })
};

const createServiceMocks = () => ({
    userService: {
        getUserById: jest.fn(),
        getValidUsers: jest.fn(),
        createUser: jest.fn(),
        updateUser: jest.fn()
    },

    interestsService: {
        getInterestsListByUserId: jest.fn().mockResolvedValue([]),
        getAllInterests: jest.fn(),
        updateUserInterests: jest.fn()
    },

    pictureService: {
        getUserPictures: jest.fn().mockResolvedValue([])
    },

    locationService: {
        getLocationByUserId: jest.fn().mockResolvedValue(null),
        updateUserLocation: jest.fn()
    },

    userInteractionsService: {
        getLikeCountByUserId: jest.fn().mockResolvedValue(0),
        getPotentialMatches: jest.fn(),
        getMatchesByUserId: jest.fn()
    },

    notificationService: {
        getNotSeenNotificationsByUserId: jest.fn(),
        newCallNotification: jest.fn(),
        markAllAsSeen: jest.fn()
    }
});

const setupDbMocks = (db) => {
    const mockQuery = jest.fn();
    db.query = mockQuery;

    return {
        mockQuery,
        mockSuccess: (result) => mockQuery.mockResolvedValue(result),
        mockError: (error = new Error('Database error')) => mockQuery.mockRejectedValue(error),
        mockEmpty: () => mockQuery.mockResolvedValue({ rows: [] }),
        expectQuery: (sql, params) => {
            if (params === undefined) {
                expect(mockQuery).toHaveBeenCalledWith(sql);
            } else {
                expect(mockQuery).toHaveBeenCalledWith(sql, params);
            }
        }
    };
};

module.exports = {
    mockConsole,
    restoreConsole,
    createMockReqRes,
    createDbMock,
    setupTestEnv,
    createRestorableSpy,
    expectDbError,
    createMockData,
    createServiceMocks,
    setupDbMocks
};
