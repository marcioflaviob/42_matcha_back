const fetch = require('node-fetch');
const { Response } = jest.requireActual('node-fetch');
jest.mock('node-fetch');

const Location = require('../../models/Location/Location');
const ApiException = require('../../exceptions/ApiException');
const LocationService = require('../../services/LocationService');

jest.mock('../../models/Location/Location');

beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => { });
    jest.spyOn(console, 'error').mockImplementation(() => { });
});

afterEach(() => {
    if (console.log.mockRestore) console.log.mockRestore();
    if (console.error.mockRestore) console.error.mockRestore();
});


describe('LocationService', () => {
    const mockUserId = '123';
    const mockLocation = {
        userId: mockUserId,
        latitude: 1.23,
        longitude: 4.56,
        city: 'Paris',
        country: 'France'
    };

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
        it('should throw ApiException(400) if missing coords or userId', async () => {
            await expect(LocationService.getCityAndCountry(null, 2, mockUserId))
                .rejects.toThrow(ApiException);
            await expect(LocationService.getCityAndCountry(1, null, mockUserId))
                .rejects.toThrow(ApiException);
            await expect(LocationService.getCityAndCountry(1, 2, null))
                .rejects.toThrow(ApiException);
        });

        it('should fetch and store location if user has none', async () => {
            const mockApiResponse = {
                results: [{
                    components: {
                        city: 'Berlin',
                        country: 'Germany'
                    }
                }]
            };
            fetch.mockResolvedValueOnce(new Response(JSON.stringify(mockApiResponse)));
            Location.findByUserId.mockResolvedValue(null);
            Location.createLocation.mockResolvedValue('newLocation');

            const result = await LocationService.getCityAndCountry(52.52, 13.405, mockUserId);

            expect(fetch).toHaveBeenCalled();
            expect(Location.createLocation).toHaveBeenCalledWith(expect.objectContaining({
                userId: mockUserId,
                city: 'Berlin',
                country: 'Germany',
                latitude: 52.52,
                longitude: 13.405
            }));
            expect(result).toEqual(mockApiResponse);
        });

        it('should update existing user location with fetched data', async () => {
            const mockApiResponse = {
                results: [{
                    components: {
                        city: 'Lisbon',
                        country: 'Portugal'
                    }
                }]
            };
            fetch.mockResolvedValueOnce(new Response(JSON.stringify(mockApiResponse)));
            Location.findByUserId.mockResolvedValue(mockLocation);
            Location.updateLocation.mockResolvedValue('updatedLocation');

            const result = await LocationService.getCityAndCountry(38.7169, -9.1399, mockUserId);

            expect(Location.updateLocation).toHaveBeenCalledWith(expect.objectContaining({
                userId: mockUserId,
                city: 'Lisbon',
                country: 'Portugal',
                latitude: 38.7169,
                longitude: -9.1399
            }));
            expect(result).toEqual(mockApiResponse);
        });

        it('should create new user location with geocode data', async () => {
            const mockApiResponse = {
                results: [{
                    components: {
                        city: 'Berlin',
                        country: 'Germany'
                    }
                }]
            };
            fetch.mockResolvedValueOnce(new Response(JSON.stringify(mockApiResponse)));
            Location.findByUserId.mockResolvedValue(null);
            Location.createLocation.mockResolvedValue('newLocation');

            const result = await LocationService.getCityAndCountry(52.52, 13.405, mockUserId);

            expect(fetch).toHaveBeenCalled();
            expect(Location.createLocation).toHaveBeenCalledWith(expect.objectContaining({
                userId: mockUserId,
                city: 'Berlin',
                country: 'Germany',
                latitude: 52.52,
                longitude: 13.405
            }));
            expect(result).toEqual(mockApiResponse);
        });

        it('should use town as fallback when city is not available', async () => {
            const mockApiResponse = {
                results: [{
                    components: {
                        town: 'Small Town',
                        country: 'Germany'
                    }
                }]
            };
            fetch.mockResolvedValueOnce(new Response(JSON.stringify(mockApiResponse)));
            Location.findByUserId.mockResolvedValue(null);
            Location.createLocation.mockResolvedValue('newLocation');

            const result = await LocationService.getCityAndCountry(52.52, 13.405, mockUserId);

            expect(Location.createLocation).toHaveBeenCalledWith(expect.objectContaining({
                userId: mockUserId,
                city: 'Small Town',
                country: 'Germany',
                latitude: 52.52,
                longitude: 13.405
            }));
            expect(result).toEqual(mockApiResponse);
        });

        it('should use village as fallback when city and town are not available', async () => {
            const mockApiResponse = {
                results: [{
                    components: {
                        village: 'Rural Village',
                        country: 'Germany'
                    }
                }]
            };
            fetch.mockResolvedValueOnce(new Response(JSON.stringify(mockApiResponse)));
            Location.findByUserId.mockResolvedValue(null);
            Location.createLocation.mockResolvedValue('newLocation');

            const result = await LocationService.getCityAndCountry(52.52, 13.405, mockUserId);

            expect(Location.createLocation).toHaveBeenCalledWith(expect.objectContaining({
                userId: mockUserId,
                city: 'Rural Village',
                country: 'Germany',
                latitude: 52.52,
                longitude: 13.405
            }));
            expect(result).toEqual(mockApiResponse);
        });

        it('should use Unknown as fallback when no location components are available', async () => {
            const mockApiResponse = {
                results: [{
                    components: {}
                }]
            };
            fetch.mockResolvedValueOnce(new Response(JSON.stringify(mockApiResponse)));
            Location.findByUserId.mockResolvedValue(null);
            Location.createLocation.mockResolvedValue('newLocation');

            const result = await LocationService.getCityAndCountry(52.52, 13.405, mockUserId);

            expect(Location.createLocation).toHaveBeenCalledWith(expect.objectContaining({
                userId: mockUserId,
                city: 'Unknown',
                country: 'Unknown',
                latitude: 52.52,
                longitude: 13.405
            }));
            expect(result).toEqual(mockApiResponse);
        });
    });

    describe('getAddress', () => {
        it('should throw ApiException if missing coordinates', async () => {
            await expect(LocationService.getAddress(null, 2)).rejects.toThrow(ApiException);
            await expect(LocationService.getAddress(1, null)).rejects.toThrow(ApiException);
        });

        it('should return geocode data from fetch', async () => {
            const mockData = { results: [] };
            fetch.mockResolvedValueOnce(new Response(JSON.stringify(mockData)));

            const result = await LocationService.getAddress(1, 2);
            expect(fetch).toHaveBeenCalled();
            expect(result).toEqual(mockData);
        });

        it('should handle errors in getAddress', async () => {
            fetch.mockRejectedValue(new Error('Network error'));

            const result = await LocationService.getAddress(1, 2);
            expect(result).toEqual({ city: 'Unknown', country: 'Unknown' });
            expect(console.error).toHaveBeenCalledWith('Error fetching city and country:', expect.any(Error));
        });
    });

    describe('getLocationFromIP', () => {
        it('should throw ApiException(400) if userId is missing', async () => {
            await expect(LocationService.getLocationFromIP(null))
                .rejects.toThrow(new ApiException(400, 'User ID is required'));
            await expect(LocationService.getLocationFromIP(undefined))
                .rejects.toThrow(new ApiException(400, 'User ID is required'));
        });

        it('should use fallback to ipapi.co if ip-api fails', async () => {
            fetch
                .mockResolvedValueOnce(new Response(JSON.stringify({ ip: '8.8.8.8' })))
                .mockRejectedValueOnce(new Error('ip-api failed'))
                .mockResolvedValueOnce(new Response(JSON.stringify({
                    city: 'Madrid',
                    country: 'Spain',
                    latitude: 40.4168,
                    longitude: -3.7038
                })));

            Location.findByUserId.mockResolvedValue(null);
            Location.createLocation.mockResolvedValue('fromFallback');

            const result = await LocationService.getLocationFromIP(mockUserId);

            expect(fetch).toHaveBeenCalledTimes(3);
            expect(result).toBe('fromFallback');
        });

        it('should fallback to default Paris location if all fails', async () => {
            fetch
                .mockResolvedValueOnce(new Response(JSON.stringify({ ip: '8.8.8.8' })))
                .mockRejectedValueOnce(new Error('ip-api failed'))
                .mockRejectedValueOnce(new Error('ipapi failed'));

            Location.findByUserId.mockResolvedValue(null);
            Location.createLocation.mockResolvedValue('parisFallback');

            const result = await LocationService.getLocationFromIP(mockUserId);

            expect(fetch).toHaveBeenCalledTimes(3);
            expect(result).toBe('parisFallback');
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

    describe('getCityAndCountry error handling', () => {
        beforeEach(() => {
            fetch.mockClear();
        });

        it('should return default values when fetch throws an error', async () => {
            fetch.mockRejectedValue(new Error('Network connection failed'));

            const result = await LocationService.getCityAndCountry(1, 48.8566, 2.3522);

            expect(result).toEqual({ city: 'Unknown', country: 'Unknown' });
            expect(console.error).toHaveBeenCalledWith('Error fetching city and country:', expect.any(Error));
        });

        it('should return default values when response.json() throws an error', async () => {
            fetch.mockResolvedValue({
                json: () => Promise.reject(new Error('Invalid JSON response'))
            });

            const result = await LocationService.getCityAndCountry(1, 48.8566, 2.3522);

            expect(result).toEqual({ city: 'Unknown', country: 'Unknown' });
            expect(console.error).toHaveBeenCalledWith('Error fetching city and country:', expect.any(Error));
        });

        it('should return default values when API response has no results', async () => {
            const mockApiResponse = {
                results: null
            };
            fetch.mockResolvedValueOnce(new Response(JSON.stringify(mockApiResponse)));

            const result = await LocationService.getCityAndCountry(52.52, 13.405, mockUserId);
            expect(result).toEqual({ city: 'Unknown', country: 'Unknown' });
            expect(console.error).toHaveBeenCalledWith('Error fetching city and country:', expect.any(Error));
        });
    });

    describe('getLocationFromIP fallback scenarios', () => {
        beforeEach(() => {
            fetch.mockClear();
            Location.createLocation.mockResolvedValue({ id: 1 });
            Location.updateLocation.mockResolvedValue({ id: 1 });
        });

        it('should handle successful first API response', async () => {
            const userId = 1;
            const publicIp = '8.8.8.8';

            fetch
                .mockResolvedValueOnce(new Response(JSON.stringify({ ip: publicIp })))
                .mockResolvedValueOnce(new Response(JSON.stringify({
                    status: 'success',
                    city: 'New York',
                    country: 'United States',
                    lat: 40.7128,
                    lon: -74.0060
                })));

            Location.findByUserId.mockResolvedValue(null);

            const result = await LocationService.getLocationFromIP(userId);

            expect(fetch).toHaveBeenCalledTimes(2);
            expect(fetch).toHaveBeenNthCalledWith(1, 'https://api.ipify.org?format=json');
            expect(fetch).toHaveBeenNthCalledWith(2, `http://ip-api.com/json/${publicIp}`);
            expect(result).toEqual({ id: 1 });
            expect(Location.createLocation).toHaveBeenCalledWith({
                userId: userId,
                city: 'New York',
                country: 'United States',
                latitude: 40.7128,
                longitude: -74.0060
            });
        });

        it('should use fallback API when main API fails', async () => {
            const userId = 1;
            const publicIp = '8.8.8.8';

            fetch
                .mockResolvedValueOnce(new Response(JSON.stringify({ ip: publicIp })))
                .mockRejectedValueOnce(new Error('Network error'))
                .mockResolvedValueOnce(new Response(JSON.stringify({
                    city: 'San Francisco',
                    country_name: 'United States',
                    latitude: 37.7749,
                    longitude: -122.4194
                })));

            const result = await LocationService.getLocationFromIP(userId);

            expect(fetch).toHaveBeenCalledTimes(3);
            expect(fetch).toHaveBeenNthCalledWith(1, 'https://api.ipify.org?format=json');
            expect(fetch).toHaveBeenNthCalledWith(2, `http://ip-api.com/json/${publicIp}`);
            expect(fetch).toHaveBeenNthCalledWith(3, `https://ipapi.co/${publicIp}/json/`);
            expect(result).toEqual({ id: 1 });
        });

        it('should handle complete API failure gracefully', async () => {
            const userId = 1;
            const publicIp = '8.8.8.8';

            fetch
                .mockResolvedValueOnce(new Response(JSON.stringify({ ip: publicIp })))
                .mockRejectedValueOnce(new Error('Main API error'))
                .mockRejectedValueOnce(new Error('Fallback API error'));

            Location.findByUserId.mockResolvedValue(null);
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { });

            const result = await LocationService.getLocationFromIP(userId);

            expect(fetch).toHaveBeenCalledTimes(3);
            expect(result).toEqual({ id: 1 });
            expect(Location.createLocation).toHaveBeenCalledWith({
                userId: userId,
                city: 'Paris',
                country: 'France',
                latitude: 48.8566,
                longitude: 2.3522
            });

            if (consoleSpy.mockRestore) consoleSpy.mockRestore();
        });

        it('should handle main API returning unsuccessful status', async () => {
            const userId = 1;
            const publicIp = '8.8.8.8';

            fetch
                .mockResolvedValueOnce(new Response(JSON.stringify({ ip: publicIp })))
                .mockResolvedValueOnce(new Response(JSON.stringify({
                    status: 'fail',
                    message: 'Invalid IP'
                })))
                .mockResolvedValueOnce(new Response(JSON.stringify({
                    city: 'Los Angeles',
                    country_name: 'United States',
                    latitude: 34.0522,
                    longitude: -118.2437
                })));

            const result = await LocationService.getLocationFromIP(userId);

            expect(fetch).toHaveBeenCalledTimes(3);
            expect(result).toEqual({ id: 1 });
        });

        it('should handle createLocation failure and log error', async () => {
            const userId = 1;
            const publicIp = '8.8.8.8';

            fetch
                .mockResolvedValueOnce(new Response(JSON.stringify({ ip: publicIp })))
                .mockResolvedValueOnce(new Response(JSON.stringify({
                    status: 'success',
                    city: 'London',
                    country: 'United Kingdom',
                    lat: 51.5074,
                    lon: -0.1278
                })));

            Location.findByUserId.mockResolvedValue(null);
            Location.createLocation.mockRejectedValue(new Error('Database connection failed'));

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

            const result = await LocationService.getLocationFromIP(userId);

            expect(result).toBeUndefined();
            expect(consoleSpy).toHaveBeenCalledWith('Error getting location from IP:', expect.any(Error));

            if (consoleSpy.mockRestore) consoleSpy.mockRestore();
        });

        it('should handle fallback API with missing city data', async () => {
            const userId = 1;
            const publicIp = '8.8.8.8';

            fetch
                .mockResolvedValueOnce(new Response(JSON.stringify({ ip: publicIp })))
                .mockRejectedValueOnce(new Error('Main API error'))
                .mockResolvedValueOnce(new Response(JSON.stringify({
                    country: 'Canada',
                    latitude: 43.6532,
                    longitude: -79.3832
                })));

            const result = await LocationService.getLocationFromIP(userId);

            expect(fetch).toHaveBeenCalledTimes(3);
            expect(result).toEqual({ id: 1 });
            expect(Location.createLocation).toHaveBeenCalledWith({
                userId: userId,
                city: 'Unknown',
                country: 'Canada',
                latitude: 43.6532,
                longitude: -79.3832
            });
        });

        it('should handle fallback API with missing country data', async () => {
            const userId = 1;
            const publicIp = '8.8.8.8';

            fetch
                .mockResolvedValueOnce(new Response(JSON.stringify({ ip: publicIp })))
                .mockRejectedValueOnce(new Error('Main API error'))
                .mockResolvedValueOnce(new Response(JSON.stringify({
                    city: 'Toronto',
                    latitude: 43.6532,
                    longitude: -79.3832
                })));

            const result = await LocationService.getLocationFromIP(userId);

            expect(fetch).toHaveBeenCalledTimes(3);
            expect(result).toEqual({ id: 1 });
            expect(Location.createLocation).toHaveBeenCalledWith({
                userId: userId,
                city: 'Toronto',
                country: 'Unknown',
                latitude: 43.6532,
                longitude: -79.3832
            });
        });

        it('should handle fallback API returning error', async () => {
            const userId = 1;
            const publicIp = '8.8.8.8';

            fetch
                .mockResolvedValueOnce(new Response(JSON.stringify({ ip: publicIp })))
                .mockRejectedValueOnce(new Error('Main API error'))
                .mockResolvedValueOnce(new Response(JSON.stringify({
                    error: true,
                    reason: 'Invalid IP address'
                })));

            const result = await LocationService.getLocationFromIP(userId);

            expect(fetch).toHaveBeenCalledTimes(3);
            expect(result).toEqual({ id: 1 });
            expect(Location.createLocation).toHaveBeenCalledWith({
                userId: userId,
                city: 'Paris',
                country: 'France',
                latitude: 48.8566,
                longitude: 2.3522
            });
        });

        it('should handle fallback API missing latitude/longitude', async () => {
            const userId = 1;
            const publicIp = '8.8.8.8';

            fetch
                .mockResolvedValueOnce(new Response(JSON.stringify({ ip: publicIp })))
                .mockRejectedValueOnce(new Error('Main API error'))
                .mockResolvedValueOnce(new Response(JSON.stringify({
                    city: 'Toronto',
                    country: 'Canada'
                })));

            const result = await LocationService.getLocationFromIP(userId);

            expect(fetch).toHaveBeenCalledTimes(3);
            expect(result).toEqual({ id: 1 });
            expect(Location.createLocation).toHaveBeenCalledWith({
                userId: userId,
                city: 'Paris',
                country: 'France',
                latitude: 48.8566,
                longitude: 2.3522
            });
        });

        it('should handle main API with missing city data', async () => {
            const userId = 1;
            const publicIp = '8.8.8.8';

            fetch
                .mockResolvedValueOnce(new Response(JSON.stringify({ ip: publicIp })))
                .mockResolvedValueOnce(new Response(JSON.stringify({
                    status: 'success',
                    country: 'United States',
                    lat: 40.7128,
                    lon: -74.0060
                })));

            const result = await LocationService.getLocationFromIP(userId);

            expect(fetch).toHaveBeenCalledTimes(2);
            expect(result).toEqual({ id: 1 });
            expect(Location.createLocation).toHaveBeenCalledWith({
                userId: userId,
                city: 'Unknown',
                country: 'United States',
                latitude: 40.7128,
                longitude: -74.0060
            });
        });

        it('should handle main API with missing country data', async () => {
            const userId = 1;
            const publicIp = '8.8.8.8';

            fetch
                .mockResolvedValueOnce(new Response(JSON.stringify({ ip: publicIp })))
                .mockResolvedValueOnce(new Response(JSON.stringify({
                    status: 'success',
                    city: 'New York',
                    lat: 40.7128,
                    lon: -74.0060
                })));

            const result = await LocationService.getLocationFromIP(userId);

            expect(fetch).toHaveBeenCalledTimes(2);
            expect(result).toEqual({ id: 1 });
            expect(Location.createLocation).toHaveBeenCalledWith({
                userId: userId,
                city: 'New York',
                country: 'Unknown',
                latitude: 40.7128,
                longitude: -74.0060
            });
        });
    });
});
