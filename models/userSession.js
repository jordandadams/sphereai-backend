import mongoose from 'mongoose';

const userSessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    loginTime: {
        type: Date,
        required: true
    },
    logoutTime: {
        type: Date
    }
});

const UserSession = mongoose.model('UserSession', userSessionSchema);
export default UserSession;
