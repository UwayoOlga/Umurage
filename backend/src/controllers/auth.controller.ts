import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

// Helper: generate UUID v4 for SQLite
function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Register new user
export const register = async (req: Request, res: Response) => {
    try {
        const { phone, password, name } = req.body;

        if (!phone || !password || !name) {
            throw new AppError('Phone, password, and name are required', 400);
        }

        // Check if user exists
        const existing = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
        if (existing) {
            throw new AppError('User with this phone number already exists', 409);
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const id = uuidv4();
        const now = new Date().toISOString();

        db.prepare(
            `INSERT INTO users (id, phone, password_hash, name, role, created_at, updated_at)
             VALUES (?, ?, ?, ?, 'member', ?, ?)`
        ).run(id, phone, hashedPassword, name, now, now);

        const user = db.prepare('SELECT id, phone, name, role, created_at FROM users WHERE id = ?').get(id) as any;

        const accessToken = jwt.sign(
            { id: user.id, phone: user.phone, role: user.role },
            process.env.JWT_SECRET as string,
            { expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as any }
        );

        const refreshToken = jwt.sign(
            { id: user.id },
            process.env.JWT_REFRESH_SECRET as string,
            { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as any }
        );

        // Store refresh token in SQLite
        db.prepare('DELETE FROM refresh_tokens WHERE user_id = ?').run(user.id);
        db.prepare('INSERT INTO refresh_tokens (user_id, token, created_at) VALUES (?, ?, ?)').run(user.id, refreshToken, now);

        res.status(201).json({
            success: true,
            message: 'Your account has been created successfully!',
            data: { user: { id: user.id, phone: user.phone, name: user.name, role: user.role }, accessToken, refreshToken }
        });
    } catch (error) {
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        console.error('Register error:', error);
        res.status(500).json({ success: false, message: 'An unexpected error occurred during registration. Please try again.' });
    }
};

// Login user
export const login = async (req: Request, res: Response) => {
    try {
        const { phone, password } = req.body;

        if (!phone || !password) {
            throw new AppError('Phone and password are required', 400);
        }

        const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone) as any;
        if (!user) {
            throw new AppError('Invalid credentials', 401);
        }

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            throw new AppError('The password you entered is incorrect', 401);
        }

        const accessToken = jwt.sign(
            { id: user.id, phone: user.phone, role: user.role },
            process.env.JWT_SECRET as string,
            { expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as any }
        );

        const refreshToken = jwt.sign(
            { id: user.id },
            process.env.JWT_REFRESH_SECRET as string,
            { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as any }
        );

        const now = new Date().toISOString();
        db.prepare('DELETE FROM refresh_tokens WHERE user_id = ?').run(user.id);
        db.prepare('INSERT INTO refresh_tokens (user_id, token, created_at) VALUES (?, ?, ?)').run(user.id, refreshToken, now);

        res.status(200).json({
            success: true,
            message: `Welcome back, ${user.name}! Login successful.`,
            data: { user: { id: user.id, phone: user.phone, name: user.name, role: user.role }, accessToken, refreshToken }
        });
    } catch (error) {
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'An unexpected error occurred while signing in.' });
    }
};

// Refresh access token
export const refreshToken = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            throw new AppError('Refresh token is required', 400);
        }

        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string) as any;

        const stored = db.prepare('SELECT token FROM refresh_tokens WHERE user_id = ?').get(decoded.id) as any;
        if (!stored || stored.token !== refreshToken) {
            throw new AppError('Invalid refresh token', 401);
        }

        const user = db.prepare('SELECT id, phone, name, role FROM users WHERE id = ?').get(decoded.id) as any;
        if (!user) {
            throw new AppError('User not found', 404);
        }

        const newAccessToken = jwt.sign(
            { id: user.id, phone: user.phone, role: user.role },
            process.env.JWT_SECRET as string,
            { expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as any }
        );

        res.status(200).json({
            success: true,
            message: 'Token refreshed successfully',
            data: { accessToken: newAccessToken }
        });
    } catch (error) {
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }
};

// Logout user
export const logout = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;
        if (refreshToken) {
            const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string) as any;
            db.prepare('DELETE FROM refresh_tokens WHERE user_id = ?').run(decoded.id);
        }
        res.status(200).json({ success: true, message: 'Logout successful' });
    } catch {
        res.status(200).json({ success: true, message: 'Logout successful' });
    }
};

// Get current user profile
export const getMe = async (req: AuthRequest, res: Response) => {
    try {
        const user = db.prepare('SELECT id, phone, name, role, created_at FROM users WHERE id = ?').get(req.user!.id) as any;
        if (!user) throw new AppError('User not found', 404);
        res.status(200).json({ success: true, data: { user } });
    } catch (error) {
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
