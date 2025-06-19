const fetch = require('node-fetch');
const { Response } = jest.requireActual('node-fetch');
jest.mock('node-fetch');

const Location = require('../../models/Location/Location');
const ApiException = require('../../exceptions/ApiException');
const LocationService = require('../../services/LocationService');
const {
    mockConsole,
    restoreConsole,
    createMockData,
    createLocationTestUtils
} = require('../utils/testSetup');

jest.mock('../../models/Location/Location');

const locationUtils = createLocationTestUtils();

beforeEach(() => {
    mockConsole();
});

afterEach(() => {
    restoreConsole();
});

describe('LocationService', () => {
    const mockUserId = '123';
    const mockLocation = createMockData.location({
        userId: mockUserId,
        latitude: 1.23,
        longitude: 4.56,
        city: 'Paris',
        country: 'France'
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getLocationByUserId', () => {
        it('should throw ApiException(400) if userId is missing', async () => {
            await expect(LocationService.getLocationByUserId(null))
                .rejects.toThrow(ApiException);
        });

        it('should throw ApiException(404) if no location found', async () => {
            Location.findByUserId.mockRejectedValue(new ApiException(404, 'Location not found for the given user ID'));
            await expect(LocationService.getLocationByUserId(mockUserId))
                .rejects.toThrow('Location not found for the given user ID');
        });

        it('should return location when found', async () => {
            Location.findByUserId.mockResolvedValue(mockLocation);
            const result = await LocationService.getLocationByUserId(mockUserId);
            expect(result).toEqual(mockLocation);
        });
    });

    describe('createLocation', () => {
        it('should update existing location if found', async () => {
            Location.findByUserId.mockResolvedValue(mockLocation);
            Location.updateLocation.mockResolvedValue('updatedId');

            const result = await LocationService.createLocation(mockLocation);
            expect(Location.updateLocation).toHaveBeenCalledWith(mockLocation);
            expect(result).toBe('updatedId');
        });

        it('should create location if not exists', async () => {
            Location.findByUserId.mockResolvedValue(null);
            Location.createLocation.mockResolvedValue('newId');

            const result = await LocationService.createLocation(mockLocation);
            expect(Location.createLocation).toHaveBeenCalledWith(mockLocation);
            expect(result).toBe('newId');
        });
    });

    describe('LocationService.updateLocation', () => {
        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should return updated location when update is successful', async () => {
            const locationData = {
                userId: '123',
                longitude: 12.5,
                latitude: 41.9,
                city: 'Rome',
                country: 'Italy',
            };

            const mockUpdatedLocation = {
                ...locationData,
            };

            Location.updateLocation.mockResolvedValue(mockUpdatedLocation);

            const result = await LocationService.updateLocation(locationData);

            expect(Location.updateLocation).toHaveBeenCalledWith(locationData);
            expect(result).toEqual(mockUpdatedLocation);
        });

        it('should propagate ApiException from Location model', async () => {
            const locationData = {
                userId: '123',
                longitude: 12.5,
                latitude: 41.9,
                city: 'Rome',
                country: 'Italy',
            };

            const error = new ApiException(404, 'Location not found');
            Location.updateLocation.mockRejectedValue(error);

            await expect(LocationService.updateLocation(locationData)).rejects.toThrow(ApiException);
            expect(Location.updateLocation).toHaveBeenCalledWith(locationData);
        });

        it('should throw generic ApiException(500) on unknown errors', async () => {
            const locationData = {
                userId: '123',
                longitude: 12.5,
                latitude: 41.9,
                city: 'Rome',
                country: 'Italy',
            };
            Location.updateLocation.mockRejectedValue(new ApiException(500, 'Failed to update location'));
            await expect(LocationService.updateLocation(locationData)).rejects.toThrow(ApiException);

        });
    });

    describe('getCityAndCountry', () => {
        beforeEach(() => {
            locationUtils.setupLocationMocks();
        });

        it('should throw ApiException(400) if missing coords or userId', async () => {
            await expect(LocationService.getCityAndCountry(null, 2, mockUserId))
                .rejects.toThrow(ApiException);
            await expect(LocationService.getCityAndCountry(1, null, mockUserId))
                .rejects.toThrow(ApiException);
            await expect(LocationService.getCityAndCountry(1, 2, null))
                .rejects.toThrow(ApiException);
        });

        it('should fetch and store location if user has none', async () => {
            const mockApiResponse = locationUtils.setupFetchMocks.geocodeSuccess('Berlin', 'Germany');

            const result = await LocationService.getCityAndCountry(52.52, 13.405, mockUserId);

            expect(fetch).toHaveBeenCalled();
            locationUtils.expectLocationCreated(mockUserId, {
                city: 'Berlin',
                country: 'Germany',
                latitude: 52.52,
                longitude: 13.405
            });
            expect(result).toEqual(mockApiResponse);
        });

        it('should update existing user location with fetched data', async () => {
            const mockApiResponse = locationUtils.setupFetchMocks.geocodeSuccess('Lisbon', 'Portugal');
            Location.findByUserId.mockResolvedValue(mockLocation);

            const result = await LocationService.getCityAndCountry(38.7169, -9.1399, mockUserId);

            locationUtils.expectLocationUpdated({
                userId: mockUserId,
                city: 'Lisbon',
                country: 'Portugal',
                latitude: 38.7169,
                longitude: -9.1399
            });
            expect(result).toEqual(mockApiResponse);
        });

        it('should use town as fallback when city is not available', async () => {
            const mockApiResponse = locationUtils.setupFetchMocks.geocodeWithTown('Small Town', 'Germany');

            const result = await LocationService.getCityAndCountry(52.52, 13.405, mockUserId);

            locationUtils.expectLocationCreated(mockUserId, {
                city: 'Small Town',
                country: 'Germany',
                latitude: 52.52,
                longitude: 13.405
            });
            expect(result).toEqual(mockApiResponse);
        });

        it('should use village as fallback when city and town are not available', async () => {
            const mockApiResponse = locationUtils.setupFetchMocks.geocodeWithVillage('Rural Village', 'Germany');

            const result = await LocationService.getCityAndCountry(52.52, 13.405, mockUserId);

            locationUtils.expectLocationCreated(mockUserId, {
                city: 'Rural Village',
                country: 'Germany',
                latitude: 52.52,
                longitude: 13.405
            });
            expect(result).toEqual(mockApiResponse);
        });

        it('should use Unknown as fallback when no location components are available', async () => {
            const mockApiResponse = locationUtils.mockGeocodeResponse(undefined, undefined, {
                components: {}
            });
            fetch.mockResolvedValueOnce(new Response(JSON.stringify(mockApiResponse)));

            const result = await LocationService.getCityAndCountry(52.52, 13.405, mockUserId);

            locationUtils.expectLocationCreated(mockUserId, {
                city: 'Unknown',
                country: 'Unknown',
                latitude: 52.52,
                longitude: 13.405
            });
            expect(result).toEqual(mockApiResponse);
        });

        it('should return default values when fetch fails', async () => {
            locationUtils.setupFetchMocks.geocodeError();

            const result = await LocationService.getCityAndCountry(48.8566, 2.3522, mockUserId);

            expect(result).toEqual({ city: 'Unknown', country: 'Unknown' });
            expect(console.error).toHaveBeenCalledWith('Error fetching city and country:', expect.any(Error));
        });

        it('should handle API response with no results', async () => {
            locationUtils.setupFetchMocks.geocodeEmpty();

            const result = await LocationService.getCityAndCountry(52.52, 13.405, mockUserId);
            expect(result).toEqual({ city: 'Unknown', country: 'Unknown' });
            expect(console.error).toHaveBeenCalledWith('Error fetching city and country:', expect.any(Error));
        });
    });

    describe('getAddress', () => {
        it('should throw ApiException if missing coordinates', async () => {
            await expect(LocationService.getAddress(null, 2)).rejects.toThrow(ApiException);
            await expect(LocationService.getAddress(1, null)).rejects.toThrow(ApiException);
        });

        it('should return geocode data from fetch', async () => {
            const mockData = locationUtils.setupFetchMocks.geocodeSuccess();

            const result = await LocationService.getAddress(1, 2);
            expect(fetch).toHaveBeenCalled();
            expect(result).toEqual(mockData);
        });

        it('should handle errors gracefully', async () => {
            locationUtils.setupFetchMocks.geocodeError();

            const result = await LocationService.getAddress(1, 2);
            expect(result).toEqual({ city: 'Unknown', country: 'Unknown' });
            expect(console.error).toHaveBeenCalledWith('Error fetching city and country:', expect.any(Error));
        });
    });

    describe('getLocationFromIP', () => {
        beforeEach(() => {
            locationUtils.setupLocationMocks();
        });

        it('should throw ApiException(400) if userId is missing', async () => {
            await expect(LocationService.getLocationFromIP(null))
                .rejects.toThrow(new ApiException(400, 'User ID is required'));
            await expect(LocationService.getLocationFromIP(undefined))
                .rejects.toThrow(new ApiException(400, 'User ID is required'));
        });

        it('should use fallback to ipapi.co if ip-api fails', async () => {
            locationUtils.setupFetchMocks.ipLocationWithFallback();

            const result = await LocationService.getLocationFromIP(mockUserId);

            expect(fetch).toHaveBeenCalledTimes(3);
            expect(result).toBe('newLocationId');
        });

        it('should fallback to default Paris location if all fails', async () => {
            locationUtils.setupFetchMocks.ipLocationAllFail();

            const result = await LocationService.getLocationFromIP(mockUserId);

            expect(fetch).toHaveBeenCalledTimes(3);
            locationUtils.expectLocationCreated(mockUserId, {
                city: 'Paris',
                country: 'France',
                latitude: 48.8566,
                longitude: 2.3522
            });
            expect(result).toBe('newLocationId');
        });
    });

    describe('updateUserLocation', () => {
        const userId = '123';
        const mockLocationData = {
            latitude: 48.8566,
            longitude: 2.3522,
            city: 'Paris',
            country: 'France'
        };

        it('should update location and return updated data when location provided', async () => {
            Location.updateLocation.mockResolvedValue({ success: true });
            Location.findByUserId.mockResolvedValue(mockLocationData);

            const result = await LocationService.updateUserLocation(mockLocationData, userId);

            expect(Location.updateLocation).toHaveBeenCalled();
            expect(Location.findByUserId).toHaveBeenCalledWith(userId);
            expect(result).toEqual(mockLocationData);
        });

        it('should return undefined when location is undefined', async () => {
            const result = await LocationService.updateUserLocation(undefined, userId);

            expect(result).toBeUndefined();
            expect(Location.updateLocation).not.toHaveBeenCalled();
            expect(Location.findByUserId).not.toHaveBeenCalled();
        });

        it('should handle errors during location update', async () => {
            const error = new Error('Update failed');
            Location.updateLocation.mockRejectedValue(error);

            await expect(LocationService.updateUserLocation(mockLocationData, userId))
                .rejects
                .toThrow('Update failed');

            expect(Location.updateLocation).toHaveBeenCalled();
            expect(Location.findByUserId).not.toHaveBeenCalled();
        });

        it('should do nothing when location is falsy', async () => {
            const result = await LocationService.updateUserLocation(null, userId);

            expect(result).toBeUndefined();
            expect(Location.updateLocation).not.toHaveBeenCalled();
            expect(Location.findByUserId).not.toHaveBeenCalled();
        });
    });

    describe('getLocationFromIP fallback scenarios', () => {
        beforeEach(() => {
            locationUtils.setupLocationMocks();
        });

        it('should handle successful first API response', async () => {
            locationUtils.setupFetchMocks.ipLocationSuccess();

            const result = await LocationService.getLocationFromIP(mockUserId);

            expect(fetch).toHaveBeenCalledTimes(2);
            locationUtils.expectLocationCreated(mockUserId, {
                city: 'New York',
                country: 'United States',
                latitude: 40.7128,
                longitude: -74.0060
            });
            expect(result).toBe('newLocationId');
        });

        it('should handle complete API failure gracefully', async () => {
            locationUtils.setupFetchMocks.ipLocationAllFail();
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { });

            const result = await LocationService.getLocationFromIP(mockUserId);

            expect(fetch).toHaveBeenCalledTimes(3);
            locationUtils.expectLocationCreated(mockUserId, {
                city: 'Paris',
                country: 'France',
                latitude: 48.8566,
                longitude: 2.3522
            });
            expect(result).toBe('newLocationId');

            if (consoleSpy.mockRestore) consoleSpy.mockRestore();
        });

        it('should handle missing data gracefully with fallbacks', async () => {
            // Test various missing data scenarios with single test
            fetch
                .mockResolvedValueOnce(new Response(JSON.stringify({ ip: '8.8.8.8' })))
                .mockResolvedValueOnce(new Response(JSON.stringify({
                    status: 'success',
                    country: 'United States', // missing city
                    lat: 40.7128,
                    lon: -74.0060
                })));

            const result = await LocationService.getLocationFromIP(mockUserId);

            locationUtils.expectLocationCreated(mockUserId, {
                city: 'Unknown',
                country: 'United States',
                latitude: 40.7128,
                longitude: -74.0060
            });
            expect(result).toBe('newLocationId');
        });
    });
});
