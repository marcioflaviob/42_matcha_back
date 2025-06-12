const LocationService = require('../../services/LocationService');
const LocationController = require('../../controllers/LocationController');

jest.mock('../../services/LocationService');

describe('LocationController', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('setUserLocation', () => {
        it('should get location from IP and send 200 with location data', async () => {
            const mockLocation = {
                userId: 1,
                city: 'Paris',
                country: 'France',
                latitude: 48.8566,
                longitude: 2.3522
            };
            const req = {
                user: {
                    id: 1
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn()
            };

            LocationService.getLocationFromIP.mockResolvedValue(mockLocation);

            await LocationController.setUserLocation(req, res);

            expect(LocationService.getLocationFromIP).toHaveBeenCalledWith(req.user.id);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith(mockLocation);
        });
    });

    describe('setCityAndCountry', () => {
        it('should get city and country from coordinates and send 200 with location data', async () => {
            const mockLocation = {
                results: [{
                    components: {
                        city: 'Paris',
                        country: 'France'
                    }
                }]
            };
            const req = {
                user: {
                    id: 1
                },
                body: {
                    latitude: 48.8566,
                    longitude: 2.3522
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn()
            };

            LocationService.getCityAndCountry.mockResolvedValue(mockLocation);

            await LocationController.setCityAndCountry(req, res);

            expect(LocationService.getCityAndCountry).toHaveBeenCalledWith(
                req.body.latitude,
                req.body.longitude,
                req.user.id
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith(mockLocation);
        });
    });

    describe('getAddress', () => {
        it('should get address from coordinates and send 200 with location data', async () => {
            const mockLocation = {
                results: [{
                    formatted: '1 Rue de la Paix, 75002 Paris, France'
                }]
            };
            const req = {
                query: {
                    latitude: 48.8566,
                    longitude: 2.3522
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn()
            };

            LocationService.getAddress.mockResolvedValue(mockLocation);

            await LocationController.getAddress(req, res);

            expect(LocationService.getAddress).toHaveBeenCalledWith(
                req.query.latitude,
                req.query.longitude
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith(mockLocation);
        });
    });
});