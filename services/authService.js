// services/authService.js

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';
import dotenv from "dotenv";

dotenv.config();

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
sgMail.setApiKey(SENDGRID_API_KEY);

const registerUser = async (userData) => {
    const { email, password } = userData;

    // Collect error objects in an array
    const errors = [];

    // Validate email format
    if (!email || !/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(email)) {
        errors.push({ field: 'email', message: 'Invalid email format' });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        errors.push({ field: 'email', message: 'Email already in use' });
    }

    // Validate password length
    if (!password || password.length < 8) {
        errors.push({ field: 'password', message: 'Password must be at least 8 characters long' });
    }
    
    // Check if there are validation errors
    if (errors.length > 0) {
        // Return the errors array
        return { errors };
    }
    
    const user = new User(userData);

    // Check if a token can be sent (rate-limiting)
    if (user.twoFATokenSentAt) {
        const now = new Date();
        const timeSinceLastTokenSent = now - user.twoFATokenSentAt;
        if (timeSinceLastTokenSent < 2 * 60 * 1000) { // 2 minutes in milliseconds
            throw new Error('Token can only be sent once every 2 minutes');
        }
    }

    // Generate 2FA token
    const twoFAToken = Math.floor(100000 + Math.random() * 900000).toString();
    user.twoFAToken = twoFAToken;

    // Set token expiration time (15 minutes from now)
    const now = new Date();
    user.twoFATokenExpires = new Date(now.getTime() + 15 * 60 * 1000);

    // Set token sent time (rate-limiting)
    user.twoFATokenSentAt = now;

    await user.save();

    // Email content
    const msg = {
        to: user.email,
        from: 'codingwithjordan@gmail.com',
        subject: 'Verify Your Account',
        text: `Your verification code is: ${twoFAToken}`
    };

    try {
        // Send email using SendGrid Mail service
        await sgMail.send(msg);
        console.log('Email sent');
    } catch (error) {
        console.error(error);
        if (error.response) {
            console.error(error.response.body);
        }
    }

    return { message: 'User registered successfully' };
};

const verifyUser = async (email, twoFAToken) => {
    const user = await User.findOne({ email });
    if (!user) {
        throw new Error('Invalid email');
    }

    // Check if the token has expired
    if (user.twoFATokenExpires && new Date() > user.twoFATokenExpires) {
        throw new Error('Verification code has expired');
    }

    if (user.twoFAToken !== twoFAToken) {
        throw new Error('Invalid verification code');
    }
    
    user.isVerified = true;
    user.twoFAToken = null;
    user.twoFATokenExpires = null;
    user.twoFATokenSentAt = null;
    await user.save();
    return { message: 'User verified successfully' };
};


const loginUser = async (email, password) => {
    const user = await User.findOne({ email });
    if (!user) {
        throw new Error('Invalid email or password');
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new Error('Invalid email or password');
    }
    if (!user.isVerified) {
        throw new Error('User is not verified. Please verify your account first.');
    }
    // Set the token to expire in 30 minutes
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '30m' });
    return { message: 'Logged in successfully', token };
};

export default { registerUser, verifyUser, loginUser };
