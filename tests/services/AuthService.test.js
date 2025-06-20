process.env.JWT_SECRET = "test-secret";

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const UserService = require("../../services/UserService");
const ApiException = require("../../exceptions/ApiException");

jest.mock("bcrypt");
jest.mock("jsonwebtoken");
jest.mock("../../services/UserService.js");

const { login, verifyToken } = require("../../services/AuthService");

describe("authService", () => {
    describe("login", () => {
        const mockUser = {
            id: 1,
            email: "test@example.com",
            password: "hashedPassword",
            username: "testUser"
        };

        it("should return token and user without password on successful login", async () => {
            UserService.getUserByEmailWithPassword.mockResolvedValue(mockUser);
            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue("mockToken");

            const result = await login("test@example.com", "password");

            expect(UserService.getUserByEmailWithPassword).toHaveBeenCalledWith("test@example.com");
            expect(bcrypt.compare).toHaveBeenCalledWith("password", mockUser.password);
            expect(jwt.sign).toHaveBeenCalled();

            expect(result).toEqual({
                token: "mockToken",
                user: {
                    id: 1,
                    email: "test@example.com",
                    username: "testUser"
                }
            });
        });

        it("should throw ApiException if password is invalid", async () => {
            UserService.getUserByEmailWithPassword.mockResolvedValue(mockUser);
            bcrypt.compare.mockResolvedValue(false);

            await expect(login("test@example.com", "wrongPassword")).rejects.toThrow(ApiException);
            await expect(login("test@example.com", "wrongPassword")).rejects.toThrow("Invalid credentials");
        });
    });

    describe("verifyToken", () => {
        it("should return decoded token if valid", async () => {
            const decoded = { id: 1, email: "test@example.com" };
            jwt.verify.mockImplementation(() => decoded);

            const result = await verifyToken("validToken");

            expect(jwt.verify).toHaveBeenCalledWith("validToken", process.env.JWT_SECRET);
            expect(result).toEqual(decoded);
        });

        it("should throw ApiException if token is invalid", async () => {
            jwt.verify.mockImplementation(() => {
                throw new Error("Invalid token");
            });

            await expect(verifyToken("invalidToken")).rejects.toThrow(ApiException);
            await expect(verifyToken("invalidToken")).rejects.toThrow("Invalid or expired token");
        });
    });
});
