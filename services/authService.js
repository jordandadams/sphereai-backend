// services/authService.js

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';

const registerUser = async (userData) => {
    const user = new User(userData);
    await user.save();
    return { message: 'User registered successfully' };
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
    // Set the token to expire in 30 minutes
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '30m' });
    return { message: 'Logged in successfully', token };
};

export default { registerUser, loginUser };
