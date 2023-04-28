// routes/auth.js

import express from 'express';
import authService from '../services/authService.js';

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
