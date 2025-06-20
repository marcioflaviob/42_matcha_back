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

const createServiceTestSetup = (serviceName, dependencies = []) => {
    const setup = {
        mockDependencies: {},
        setupMocks: () => {
            dependencies.forEach(dep => {
                setup.mockDependencies[dep] = jest.fn();
            });
        },
        resetMocks: () => {
            Object.values(setup.mockDependencies).forEach(mock => {
                if (mock.mockReset) mock.mockReset();
            });
        }
    };

    return setup;
};

const createControllerTestSetup = () => {
    return {
        expectSuccessResponse: (res, statusCode = 200, data = undefined) => {
            expect(res.status).toHaveBeenCalledWith(statusCode);
            if (data !== undefined) {
                expect(res.send).toHaveBeenCalledWith(data);
            }
        },
        expectErrorResponse: (res, statusCode = 500) => {
            expect(res.status).toHaveBeenCalledWith(statusCode);
        }
    };
};

const createLocationTestUtils = () => {
    const mockFetch = require('node-fetch');
    const { Response } = jest.requireActual('node-fetch');

    const mockGeocodeResponse = (city, country, overrides = {}) => {
        const components = { ...overrides.components };
        if (city !== undefined) components.city = city;
        if (country !== undefined) components.country = country;

        return {
            results: [{
                components
            }],
            ...overrides
        };
    };

    const mockIpApiResponse = (city = 'New York', country = 'United States', overrides = {}) => ({
        status: 'success',
        city,
        country,
        lat: 40.7128,
        lon: -74.0060,
        ...overrides
    });

    const mockFallbackApiResponse = (city = 'Madrid', country = 'Spain', overrides = {}) => ({
        city,
        country: country,
        latitude: 40.4168,
        longitude: -3.7038,
        ...overrides
    });

    const setupFetchMocks = {
        geocodeSuccess: (city = 'Berlin', country = 'Germany') => {
            const response = mockGeocodeResponse(city, country);
            mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(response)));
            return response;
        },

        geocodeWithTown: (town = 'Small Town', country = 'Germany') => {
            const response = mockGeocodeResponse(undefined, country, {
                components: { town, country }
            });
            mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(response)));
            return response;
        },

        geocodeWithVillage: (village = 'Rural Village', country = 'Germany') => {
            const response = mockGeocodeResponse(undefined, country, {
                components: { village, country }
            });
            mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(response)));
            return response;
        },

        geocodeEmpty: () => {
            const response = { results: [] };
            mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(response)));
            return response;
        },

        geocodeError: () => {
            mockFetch.mockRejectedValue(new Error('Network error'));
        },

        ipLocationSuccess: () => {
            mockFetch
                .mockResolvedValueOnce(new Response(JSON.stringify({ ip: '8.8.8.8' })))
                .mockResolvedValueOnce(new Response(JSON.stringify(mockIpApiResponse())));
        },

        ipLocationWithFallback: () => {
            mockFetch
                .mockResolvedValueOnce(new Response(JSON.stringify({ ip: '8.8.8.8' })))
                .mockRejectedValueOnce(new Error('ip-api failed'))
                .mockResolvedValueOnce(new Response(JSON.stringify(mockFallbackApiResponse())));
        },

        ipLocationAllFail: () => {
            mockFetch
                .mockResolvedValueOnce(new Response(JSON.stringify({ ip: '8.8.8.8' })))
                .mockRejectedValueOnce(new Error('ip-api failed'))
                .mockRejectedValueOnce(new Error('ipapi failed'));
        }
    };

    const expectLocationCreated = (userId, expectedLocation) => {
        const Location = require('../../models/Location/Location');
        expect(Location.createLocation).toHaveBeenCalledWith(expect.objectContaining({
            userId,
            ...expectedLocation
        }));
    };

    const expectLocationUpdated = (expectedLocation) => {
        const Location = require('../../models/Location/Location');
        expect(Location.updateLocation).toHaveBeenCalledWith(expect.objectContaining(expectedLocation));
    };

    const setupLocationMocks = () => {
        const Location = require('../../models/Location/Location');
        Location.findByUserId.mockResolvedValue(null);
        Location.createLocation.mockResolvedValue('newLocationId');
        Location.updateLocation.mockResolvedValue('updatedLocationId');
        return Location;
    };

    return {
        mockGeocodeResponse,
        mockIpApiResponse,
        mockFallbackApiResponse,
        setupFetchMocks,
        expectLocationCreated,
        expectLocationUpdated,
        setupLocationMocks
    };
};

const createNotificationTestUtils = () => {

    const createNotificationRequestData = (overrides = {}) => {
        const { mockReq, mockRes } = createMockReqRes();
        return {
            req: {
                ...mockReq,
                user: { id: 1 },
                params: { id: 2 },
                ...overrides.req
            },
            res: mockRes
        };
    };

    const createDateRequestData = (overrides = {}) => {
        const { mockReq, mockRes } = createMockReqRes();
        return {
            req: {
                ...mockReq,
                body: {
                    senderId: 1,
                    receiverId: 2,
                    dateData: '2023-12-31',
                    address: '123 Main St',
                    latitude: 123.456,
                    longitude: 789.012,
                    ...overrides.body
                },
                ...overrides.req
            },
            res: mockRes
        };
    };

    const mockNotificationTypes = {
        call: (overrides = {}) => createMockData.notification({
            id: 1,
            user_id: 2,
            concerned_user_id: 1,
            type: 'new-call',
            title: 'Incoming Call',
            message: 'John is calling you',
            ...overrides
        }),

        stopCall: (overrides = {}) => ({
            id: 1,
            user_id: 2,
            concerned_user_id: 1,
            type: 'stop-call',
            title: 'Stop Call',
            message: 'John interrupted the call',
            ...overrides
        }),

        seen: (overrides = {}) => ({
            id: 1,
            user_id: 2,
            concerned_user_id: 1,
            type: 'new-seen',
            title: 'Your profile was viewed',
            message: 'John has seen your profile',
            ...overrides
        }),

        refusedCall: (overrides = {}) => ({
            id: 1,
            user_id: 2,
            concerned_user_id: 1,
            type: 'new-refused-call',
            title: 'New Refused Call',
            message: 'John refused your call',
            ...overrides
        }),

        date: (overrides = {}) => ({
            notification: {
                id: 1,
                user_id: 2,
                concerned_user_id: 1,
                type: 'new-date',
                title: 'New Date',
                message: 'John scheduled a date with you',
                ...overrides.notification
            },
            date: {
                id: 1,
                sender_id: 1,
                receiver_id: 2,
                scheduled_date: '2023-12-31',
                address: '123 Main St',
                latitude: 123.456,
                longitude: 789.012,
                ...overrides.date
            }
        }),

        unansweredDate: (overrides = {}) => ({
            notification: {
                id: 1,
                user_id: 2,
                concerned_user_id: 1,
                type: 'new-unanswered-date',
                title: 'Unanswered Date',
                message: 'You have an unanswered date',
                ...overrides.notification
            },
            date: {
                id: 1,
                status: 'unanswered',
                ...overrides.date
            }
        })
    };

    const testNotificationController = async (controllerMethod, serviceMock, mockData, requestData, expectedServiceArgs) => {
        serviceMock.mockResolvedValue(mockData);

        await controllerMethod(requestData.req, requestData.res);

        if (expectedServiceArgs) {
            expect(serviceMock).toHaveBeenCalledWith(...expectedServiceArgs);
        }
        expect(requestData.res.status).toHaveBeenCalledWith(200);
        expect(requestData.res.send).toHaveBeenCalledWith(mockData);
    };

    const testNotificationWithParams = async (controllerMethod, serviceMock, mockData, userIdParam = 2, currentUserId = 1) => {
        const requestData = createNotificationRequestData({
            req: {
                user: { id: currentUserId },
                params: { id: userIdParam }
            }
        });

        await testNotificationController(
            controllerMethod,
            serviceMock,
            mockData,
            requestData,
            [userIdParam, currentUserId]
        );
    };

    return {
        createNotificationRequestData,
        createDateRequestData,
        mockNotificationTypes,
        testNotificationController,
        testNotificationWithParams
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
    setupDbMocks,
    createServiceTestSetup,
    createControllerTestSetup,
    createLocationTestUtils,
    createNotificationTestUtils
};
