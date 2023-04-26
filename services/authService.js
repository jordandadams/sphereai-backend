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

    // Validate password length
    if (!password || password.length < 8) {
        errors.push({ field: 'password', message: 'Password must be at least 8 characters long' });
    }

    // Check if there are validation errors
    if (errors.length > 0) {
        // Return the errors array
        return { errors };
    }

    // Check if email already exists
    let user = await User.findOne({ email });
    if (user) {
        // Check if user is already verified
        if (user.isVerified) {
            errors.push({ field: 'email', message: 'Email is already in use!' });
            return { errors };
        }

        // Verify the password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            errors.push({ field: 'password', message: 'Incorrect password' });
            return { errors };
        }

        // Check if a token can be sent (rate-limiting)
        const now = new Date();
        const timeSinceLastTokenSent = now - user.twoFATokenSentAt;
        if (user.twoFATokenSentAt && timeSinceLastTokenSent < 2 * 60 * 1000) {
            throw new Error('Token can only be sent once every 2 minutes');
        }
    } else {
        // Create a new user
        user = new User(userData);
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
    // Collect error objects in an array
    const errors = [];

    // Find the user by email
    const user = await User.findOne({ email });

    // Check if user exists
    if (!user) {
        errors.push({ field: 'email', message: 'Email not found' });
        return { errors };
    }

    // Compare the provided password with the hashed password in the database
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        errors.push({ field: 'password', message: 'Incorrect password' });
        return { errors };
    }

    // Check if user is verified
    if (!user.isVerified) {
        errors.push({ field: 'email', message: 'Email is not verified. Please verify your account first or create account.' });
        return { errors };
    }

    // If no errors, generate the JWT token and return success message and token
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '30m' });
    return { message: 'Logged in successfully', token };
};


export default { registerUser, verifyUser, loginUser };
