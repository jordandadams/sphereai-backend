// routes/auth.js

import express from 'express';
import authService from '../services/authService.js';
import User from '../models/user.js';
import UserSession from '../models/userSession.js';
import authMiddleware from '../middleware/auth.js'

const router = express.Router();

router.post('/register', async (req, res) => {
    try {
        const result = await authService.registerUser(req.body);
        res.status(201).send(result);
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

router.post('/verify', async (req, res) => {
    try {
        const { email, twoFAToken } = req.body;
        const result = await authService.verifyUser(email, twoFAToken);
        res.status(200).send(result);
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await authService.loginUser(email, password);
        res.status(200).send(result);
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

router.post('/logout', authMiddleware, async (req, res) => {
    try {
        // Get the user's ID from the decoded token (set by authMiddleware)
        const userId = req.user._id;

        // Update the user's last session with logout time
        await UserSession.findOneAndUpdate(
            { userId: userId, logoutTime: null },
            { logoutTime: new Date() },
            { sort: { loginTime: -1 } }
        );

        res.status(200).send({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

router.get('/user', authMiddleware, async (req, res) => {
    try {
        // Get the user's ID from the decoded token (set by authMiddleware)
        const userId = req.user._id;

        // Find the user by ID
        const user = await User.findById(userId);

        // If user not found, return an error
        if (!user) {
            return res.status(404).send({ error: 'User not found' });
        }

        // Remove sensitive fields before sending the data to the client
        user.password = undefined;
        user.twoFAToken = undefined;
        user.twoFATokenExpires = undefined;
        user.twoFATokenSentAt = undefined;
        user.resetPasswordToken = undefined;
        user.resetPasswordTokenExpires = undefined;
        user.resetPasswordTokenSentAt = undefined;

        // Send user data to the client
        res.status(200).send(user);
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

router.post('/request-password-reset', async (req, res) => {
    try {
        const { email } = req.body;
        const result = await authService.requestPasswordReset(email);
        res.status(200).send(result);
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

router.post('/verify-reset-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        const result = await authService.verifyResetOTP(email, otp);
        res.status(200).send(result);
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

router.post('/reset-password', async (req, res) => {
    try {
        const { resetToken, newPassword, confirmNewPassword } = req.body;
        const result = await authService.resetPassword(resetToken, newPassword, confirmNewPassword);
        res.status(200).send(result);
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

export default router;
