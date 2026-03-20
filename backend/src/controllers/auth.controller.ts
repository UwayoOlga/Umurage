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
        const { phone, password, name, nationalId } = req.body;

        if (!phone || !password || !name || !nationalId) {
            throw new AppError('Phone, password, name, and National ID are required', 400);
        }

        // Check if user exists
        const existing = db.prepare('SELECT id FROM users WHERE phone = ? OR national_id = ?').get(phone, nationalId);
        if (existing) {
            throw new AppError('User with this phone number or National ID already exists', 409);
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const id = uuidv4();
        const now = new Date().toISOString();

        db.prepare(
            `INSERT INTO users (id, phone, password_hash, name, national_id, role, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, 'member', ?, ?)`
        ).run(id, phone, hashedPassword, name, nationalId, now, now);

        const user = db.prepare('SELECT id, phone, name, national_id, role, created_at FROM users WHERE id = ?').get(id) as any;

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
            data: {
                user: {
                    id: user.id,
                    phone: user.phone,
                    name: user.name,
                    role: user.role,
                    admin_level: user.admin_level || 'none',
                    managed_location: user.managed_location || null
                },
                accessToken,
                refreshToken
            }
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
            data: {
                user: {
                    id: user.id,
                    phone: user.phone,
                    name: user.name,
                    role: user.role,
                    admin_level: user.admin_level || 'none',
                    managed_location: user.managed_location || null
                },
                accessToken,
                refreshToken
            }
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
        const user = db.prepare('SELECT id, phone, name, role, admin_level, managed_location, created_at FROM users WHERE id = ?').get(req.user!.id) as any;
        if (!user) throw new AppError('User not found', 404);
        res.status(200).json({ success: true, data: { user } });
    } catch (error) {
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Claim a SACCO/RCA Staff ID → auto-assigns admin_level and managed_location
export const claimStaffId = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const { staffId } = req.body;

        if (!staffId) {
            throw new AppError('Staff ID is required', 400);
        }

        // 1. Check if this staff ID exists in the official table
        const staff = db.prepare('SELECT * FROM sacco_staff WHERE staff_id = ?').get(staffId.trim().toUpperCase()) as any;
        if (!staff) {
            throw new AppError('Invalid Staff ID. This credential does not exist in our official registry.', 404);
        }

        // 2. Check if it's already been claimed by someone else
        if (staff.claimed_by && staff.claimed_by !== userId) {
            throw new AppError('This Staff ID has already been claimed by another account. Contact RCA if this is an error.', 409);
        }

        // 3. Check if the current user already has a staff ID claimed
        const alreadyClaimed = db.prepare('SELECT staff_id FROM sacco_staff WHERE claimed_by = ?').get(userId) as any;
        if (alreadyClaimed && alreadyClaimed.staff_id !== staffId.trim().toUpperCase()) {
            throw new AppError('Your account is already linked to a staff credential.', 409);
        }

        const now = new Date().toISOString();

        // 4. Mark staff ID as claimed & upgrade user's access level
        db.transaction(() => {
            db.prepare('UPDATE sacco_staff SET claimed_by = ?, claimed_at = ? WHERE staff_id = ?')
                .run(userId, now, staff.staff_id);

            db.prepare('UPDATE users SET admin_level = ?, managed_location = ?, role = ?, updated_at = ? WHERE id = ?')
                .run(staff.admin_level, staff.managed_location, 'admin', now, userId);
        })();

        res.status(200).json({
            success: true,
            message: `✅ Staff credential verified! Your account now has ${staff.admin_level}-level access${staff.managed_location ? ` for ${staff.managed_location}` : ''}.`,
            data: {
                admin_level: staff.admin_level,
                managed_location: staff.managed_location
            }
        });

    } catch (error) {
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        console.error('claimStaffId error:', error);
        res.status(500).json({ success: false, message: 'Server error verifying staff credentials' });
    }
};

// Setup account with a token (for admin provisioning — no login required)
export const setupAccount = async (req: Request, res: Response) => {
    try {
        const { setupToken, password } = req.body;

        if (!setupToken || !password) {
            throw new AppError('Setup token and password are required.', 400);
        }

        if (password.length < 6) {
            throw new AppError('Password must be at least 6 characters.', 400);
        }

        // Find the user with this token
        const user = db.prepare('SELECT * FROM users WHERE setup_token = ?').get(setupToken.trim().toUpperCase()) as any;
        if (!user) {
            throw new AppError('Invalid or expired setup token. Please contact your system administrator.', 404);
        }

        if (user.is_activated === 1 && user.password_hash !== 'PENDING') {
            throw new AppError('This account has already been activated.', 409);
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const now = new Date().toISOString();

        // Activate the account: set password, clear token, mark as activated
        db.prepare(`
            UPDATE users SET password_hash = ?, setup_token = NULL, is_activated = 1, updated_at = ? WHERE id = ?
        `).run(hashedPassword, now, user.id);

        // Generate tokens so they're logged in right away
        const accessToken = jwt.sign(
            { id: user.id, phone: user.phone, role: user.role },
            process.env.JWT_SECRET as string,
            { expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as any }
        );

        const refreshTokenVal = jwt.sign(
            { id: user.id },
            process.env.JWT_REFRESH_SECRET as string,
            { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as any }
        );

        db.prepare('DELETE FROM refresh_tokens WHERE user_id = ?').run(user.id);
        db.prepare('INSERT INTO refresh_tokens (user_id, token, created_at) VALUES (?, ?, ?)').run(user.id, refreshTokenVal, now);

        res.status(200).json({
            success: true,
            message: `Welcome, ${user.name}! Your account is now active.`,
            data: {
                user: {
                    id: user.id,
                    phone: user.phone,
                    name: user.name,
                    role: user.role,
                    admin_level: user.admin_level,
                    managed_location: user.managed_location
                },
                accessToken,
                refreshToken: refreshTokenVal
            }
        });
    } catch (error) {
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        console.error('setupAccount error:', error);
        res.status(500).json({ success: false, message: 'Server error setting up account.' });
    }
};

// Change password for an authenticated user
export const changePassword = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            throw new AppError('Current password and new password are required.', 400);
        }

        if (newPassword.length < 6) {
            throw new AppError('New password must be at least 6 characters.', 400);
        }

        // 1. Get current password hash
        const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(userId) as any;
        if (!user) throw new AppError('User not found', 404);

        // 2. Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isMatch) {
            throw new AppError('The current password you entered is incorrect.', 401);
        }

        // 3. Hash and update new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 12);
        const now = new Date().toISOString();

        db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?')
            .run(hashedNewPassword, now, userId);

        res.status(200).json({
            success: true,
            message: '✅ Your password has been changed successfully.'
        });

    } catch (error) {
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        console.error('changePassword error:', error);
        res.status(500).json({ success: false, message: 'Server error changing password.' });
    }
};
