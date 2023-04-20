// models/user.js

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import validator from 'validator';

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    fullname: {
        type: String,
        default: null,
        validate: {
            validator: function (v) {
                return v === null || /^[A-Za-z\s]+$/.test(v);
            },
            message: 'Full name can only contain letters and spaces'
        }
    },
    phone: {
        type: String,
        default: null,
        validate: {
            validator: function (v) {
                return v === null || /^\d{10}$/.test(v);
            },
            message: 'Phone number must be exactly 10 digits'
        }
    },
    dob: {
        type: String,
        default: null,
        validate: {
            validator: function (v) {
                return v === null || validator.isDate(v, { format: 'MM/DD/YYYY', strictMode: true });
            },
            message: 'Date of birth must be in the format MM/DD/YYYY'
        }
    }
});

// Hash the password before saving it to the database
userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

const User = mongoose.model('User', userSchema);
export default User;