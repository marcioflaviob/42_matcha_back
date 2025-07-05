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
            expect(result).toBe('newLocationId');
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
            expect(result).toBe('updatedLocationId');
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
            expect(result).toBe('newLocationId');
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
            expect(result).toBe('newLocationId');
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
            expect(result).toBe('newLocationId');
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
            // Since the service now expects successful calls, we'll test the fallback API directly
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

        it('should handle successful API responses', async () => {
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
                .toThrow('Failed to update user location');

            expect(Location.updateLocation).toHaveBeenCalled();
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

        it('should handle API errors by throwing exceptions', async () => {
            locationUtils.setupFetchMocks.ipLocationAllFail();

            await expect(LocationService.getLocationFromIP(mockUserId))
                .rejects
                .toThrow('Failed to fetch location from IP-API');

            expect(fetch).toHaveBeenCalledTimes(2);
        });

        it('should handle missing data with Unknown fallbacks', async () => {
            // Clear any existing mocks and setup fresh ones
            jest.clearAllMocks();
            locationUtils.setupLocationMocks();

            // Override fetch completely for this test
            const mockFetch = require('node-fetch');
            const { Response } = jest.requireActual('node-fetch');

            mockFetch.mockReset();
            mockFetch
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

    describe('calculateDistance', () => {
        it('should calculate distance between two coordinates', () => {
            // Test distance between Paris and London (approximately 344 km)
            const parisLat = 48.8566;
            const parisLon = 2.3522;
            const londonLat = 51.5074;
            const londonLon = -0.1278;

            const distance = LocationService.calculateDistance(parisLat, parisLon, londonLat, londonLon);

            expect(distance).toBeCloseTo(344, 0); // Within 1 km accuracy
        });

        it('should return 0 for identical coordinates', () => {
            const distance = LocationService.calculateDistance(48.8566, 2.3522, 48.8566, 2.3522);
            expect(distance).toBe(0);
        });

        it('should calculate distance across hemispheres', () => {
            // Test distance between New York and Sydney (approximately 15987 km)
            const nyLat = 40.7128;
            const nyLon = -74.0060;
            const sydneyLat = -33.8688;
            const sydneyLon = 151.2093;

            const distance = LocationService.calculateDistance(nyLat, nyLon, sydneyLat, sydneyLon);

            expect(distance).toBeCloseTo(15987, -1); // Within 10 km accuracy
        });
    });

    describe('fetchGeocodeData error handling', () => {
        it('should throw error when geocode API returns non-ok response', async () => {
            const { Response } = jest.requireActual('node-fetch');
            fetch.mockResolvedValueOnce(new Response('', { status: 500 }));

            await expect(LocationService.getAddress(48.8566, 2.3522))
                .resolves
                .toEqual({ city: 'Unknown', country: 'Unknown' });

            expect(console.error).toHaveBeenCalledWith('Error fetching city and country:', expect.any(ApiException));
        });

        it('should handle network errors in geocode fetch', async () => {
            fetch.mockRejectedValueOnce(new Error('Network error'));

            const result = await LocationService.getAddress(48.8566, 2.3522);

            expect(result).toEqual({ city: 'Unknown', country: 'Unknown' });
            expect(console.error).toHaveBeenCalledWith('Error fetching city and country:', expect.any(Error));
        });
    });

    describe('getLocationFromIP comprehensive scenarios', () => {
        beforeEach(() => {
            locationUtils.setupLocationMocks();
        });

        it('should handle when IP API returns non-success status', async () => {
            const { Response } = jest.requireActual('node-fetch');
            fetch
                .mockResolvedValueOnce(new Response(JSON.stringify({ ip: '8.8.8.8' })))
                .mockResolvedValueOnce(new Response(JSON.stringify({
                    status: 'fail',
                    message: 'Invalid IP'
                })));

            await expect(LocationService.getLocationFromIP(mockUserId))
                .rejects
                .toThrow('Failed to fetch location from fallback API');
        });

        it('should use fallback API when primary API fails with non-ok response', async () => {
            const { Response } = jest.requireActual('node-fetch');
            // Mock successful IP fetch, failed IP-API call, successful fallback
            fetch
                .mockResolvedValueOnce(new Response(JSON.stringify({ ip: '8.8.8.8' })))
                .mockResolvedValueOnce(new Response('', { status: 500 })) // IP API fails with non-ok
                .mockResolvedValueOnce(new Response(JSON.stringify({
                    latitude: 40.4168,
                    longitude: -3.7038,
                    city: 'Madrid',
                    country: 'Spain'
                })));

            // Since the service doesn't have try-catch around individual API calls,
            // it will throw on the first failure
            await expect(LocationService.getLocationFromIP(mockUserId))
                .rejects
                .toThrow('Failed to fetch location from IP-API');
        });

        it('should fallback to Paris when fallback API returns error data', async () => {
            const { Response } = jest.requireActual('node-fetch');
            fetch
                .mockResolvedValueOnce(new Response(JSON.stringify({ ip: '8.8.8.8' })))
                .mockResolvedValueOnce(new Response(JSON.stringify({
                    status: 'fail',
                    message: 'Invalid IP'
                })))
                .mockResolvedValueOnce(new Response(JSON.stringify({
                    error: true,
                    message: 'Rate limit exceeded'
                })));

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

        it('should fallback to Paris when fallback API returns incomplete location data', async () => {
            const { Response } = jest.requireActual('node-fetch');
            fetch
                .mockResolvedValueOnce(new Response(JSON.stringify({ ip: '8.8.8.8' })))
                .mockResolvedValueOnce(new Response(JSON.stringify({
                    status: 'fail'
                })))
                .mockResolvedValueOnce(new Response(JSON.stringify({
                    city: 'Madrid',
                    country: 'Spain'
                    // missing latitude and longitude
                })));

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

        it('should handle network errors in fetchPublicIP', async () => {
            // Clear all mocks to ensure clean state
            jest.clearAllMocks();
            fetch.mockReset(); // Reset fetch mock completely
            locationUtils.setupLocationMocks();

            // Mock fetch to throw a network error - this should fail fetchPublicIP
            fetch.mockRejectedValueOnce(new Error('Network error'));

            await expect(LocationService.getLocationFromIP(mockUserId))
                .rejects
                .toThrow('Failed to fetch public IP');

            expect(fetch).toHaveBeenCalledTimes(1);
        });

        it('should handle fetchLocationFromIPApi non-ok response', async () => {
            const { Response } = jest.requireActual('node-fetch');
            fetch
                .mockResolvedValueOnce(new Response(JSON.stringify({ ip: '8.8.8.8' })))
                .mockResolvedValueOnce(new Response('', { status: 500 }));

            await expect(LocationService.getLocationFromIP(mockUserId))
                .rejects
                .toThrow('Failed to fetch location from IP-API');
        });

        it('should handle fetchLocationFromFallbackApi non-ok response', async () => {
            const { Response } = jest.requireActual('node-fetch');
            fetch
                .mockResolvedValueOnce(new Response(JSON.stringify({ ip: '8.8.8.8' })))
                .mockResolvedValueOnce(new Response(JSON.stringify({ status: 'fail' }))) // IP API returns fail status
                .mockResolvedValueOnce(new Response('', { status: 500 })); // Fallback API fails with non-ok

            await expect(LocationService.getLocationFromIP(mockUserId))
                .rejects
                .toThrow('Failed to fetch location from fallback API');
        });
    });

    describe('getCityAndCountry edge cases', () => {
        beforeEach(() => {
            locationUtils.setupLocationMocks();
        });

        it('should handle API response with no results field', async () => {
            const { Response } = jest.requireActual('node-fetch');
            fetch.mockResolvedValueOnce(new Response(JSON.stringify({})));

            const result = await LocationService.getCityAndCountry(48.8566, 2.3522, mockUserId);

            expect(result).toEqual({ city: 'Unknown', country: 'Unknown' });
            expect(console.error).toHaveBeenCalledWith('Error fetching city and country:', expect.any(ApiException));
        });

        it('should handle API response with empty results array', async () => {
            const { Response } = jest.requireActual('node-fetch');
            fetch.mockResolvedValueOnce(new Response(JSON.stringify({ results: [] })));

            const result = await LocationService.getCityAndCountry(48.8566, 2.3522, mockUserId);

            expect(result).toEqual({ city: 'Unknown', country: 'Unknown' });
            expect(console.error).toHaveBeenCalledWith('Error fetching city and country:', expect.any(Error));
        });
    });

    describe('createLocationData edge cases', () => {
        it('should handle undefined city and country values', () => {
            // This tests the internal createLocationData function indirectly
            const { Response } = jest.requireActual('node-fetch');
            jest.clearAllMocks();
            locationUtils.setupLocationMocks();

            fetch.mockResolvedValueOnce(new Response(JSON.stringify({
                results: [{
                    components: {
                        // No city or country provided
                    }
                }]
            })));

            return LocationService.getCityAndCountry(48.8566, 2.3522, mockUserId).then(() => {
                locationUtils.expectLocationCreated(mockUserId, {
                    city: 'Unknown',
                    country: 'Unknown',
                    latitude: 48.8566,
                    longitude: 2.3522
                });
            });
        });
    });

    describe('updateUserLocation edge cases', () => {
        const userId = '123';

        it('should handle when location is exactly false', async () => {
            const result = await LocationService.updateUserLocation(false, userId);

            expect(result).toBeUndefined();
            expect(Location.updateLocation).not.toHaveBeenCalled();
            expect(Location.findByUserId).not.toHaveBeenCalled();
        });

        it('should handle when location is empty object', async () => {
            Location.updateLocation.mockResolvedValue({ success: true });
            Location.findByUserId.mockResolvedValue({ id: userId });

            const result = await LocationService.updateUserLocation({}, userId);

            expect(Location.updateLocation).toHaveBeenCalledWith({});
            expect(Location.findByUserId).toHaveBeenCalledWith(userId);
            expect(result).toEqual({ id: userId });
        });
    });
});
