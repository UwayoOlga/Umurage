import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import redisClient from '../config/redis';
import { AppError } from '../middleware/errorHandler';

// Register new user
export const register = async (req: Request, res: Response) => {
    try {
        const { phone, password, name } = req.body;

        // Validation
        if (!phone || !password || !name) {
            throw new AppError('Phone, password, and name are required', 400);
        }

        // Check if user exists
        const existingUser = await pool.query(
            'SELECT * FROM users WHERE phone = $1',
            [phone]
        );

        if (existingUser.rows.length > 0) {
            throw new AppError('User with this phone number already exists', 409);
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const result = await pool.query(
            `INSERT INTO users (phone, password_hash, name, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, phone, name, role, created_at`,
            [phone, hashedPassword, name, 'member']
        );

        const user = result.rows[0];

        // Generate tokens
        const accessToken = jwt.sign(
            { id: user.id, phone: user.phone, role: user.role },
            process.env.JWT_SECRET!,
            { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
        );

        const refreshToken = jwt.sign(
            { id: user.id },
            process.env.JWT_REFRESH_SECRET!,
            { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
        );

        // Store refresh token in Redis
        await redisClient.setEx(
            `refresh_token:${user.id}`,
            7 * 24 * 60 * 60, // 7 days
            refreshToken
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: {
                    id: user.id,
                    phone: user.phone,
                    name: user.name,
                    role: user.role
                },
                accessToken,
                refreshToken
            }
        });
    } catch (error) {
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration'
        });
    }
};

// Login user
export const login = async (req: Request, res: Response) => {
    try {
        const { phone, password } = req.body;

        // Validation
        if (!phone || !password) {
            throw new AppError('Phone and password are required', 400);
        }

        // Find user
        const result = await pool.query(
            'SELECT * FROM users WHERE phone = $1',
            [phone]
        );

        if (result.rows.length === 0) {
            throw new AppError('Invalid credentials', 401);
        }

        const user = result.rows[0];

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            throw new AppError('Invalid credentials', 401);
        }

        // Generate tokens
        const accessToken = jwt.sign(
            { id: user.id, phone: user.phone, role: user.role },
            process.env.JWT_SECRET!,
            { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
        );

        const refreshToken = jwt.sign(
            { id: user.id },
            process.env.JWT_REFRESH_SECRET!,
            { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
        );

        // Store refresh token in Redis
        await redisClient.setEx(
            `refresh_token:${user.id}`,
            7 * 24 * 60 * 60,
            refreshToken
        );

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user.id,
                    phone: user.phone,
                    name: user.name,
                    role: user.role
                },
                accessToken,
                refreshToken
            }
        });
    } catch (error) {
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
};

// Refresh access token
export const refreshToken = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            throw new AppError('Refresh token is required', 400);
        }

        // Verify refresh token
        const decoded = jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH_SECRET!
        ) as any;

        // Check if token exists in Redis
        const storedToken = await redisClient.get(`refresh_token:${decoded.id}`);

        if (!storedToken || storedToken !== refreshToken) {
            throw new AppError('Invalid refresh token', 401);
        }

        // Get user
        const result = await pool.query(
            'SELECT id, phone, name, role FROM users WHERE id = $1',
            [decoded.id]
        );

        if (result.rows.length === 0) {
            throw new AppError('User not found', 404);
        }

        const user = result.rows[0];

        // Generate new access token
        const newAccessToken = jwt.sign(
            { id: user.id, phone: user.phone, role: user.role },
            process.env.JWT_SECRET!,
            { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
        );

        res.status(200).json({
            success: true,
            message: 'Token refreshed successfully',
            data: {
                accessToken: newAccessToken
            }
        });
    } catch (error) {
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
        console.error('Refresh token error:', error);
        res.status(401).json({
            success: false,
            message: 'Invalid or expired refresh token'
        });
    }
};

// Logout user
export const logout = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            throw new AppError('Refresh token is required', 400);
        }

        // Verify and decode token
        const decoded = jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH_SECRET!
        ) as any;

        // Delete refresh token from Redis
        await redisClient.del(`refresh_token:${decoded.id}`);

        res.status(200).json({
            success: true,
            message: 'Logout successful'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(200).json({
            success: true,
            message: 'Logout successful'
        });
    }
};
