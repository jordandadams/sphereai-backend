// models/chatSession.js

import mongoose from 'mongoose';

const chatLogSchema = new mongoose.Schema({
    sender: { type: String, required: true }, // "AI" or "user"
    message: { type: String, required: true }
});

const chatSessionSchema = new mongoose.Schema({
    service: { type: String, required: true },
    serviceItem: { type: String, required: true },
    sessionId: { type: String, required: true },
    chatLogs: [chatLogSchema]
});

const ChatSession = mongoose.model('ChatSession', chatSessionSchema);
export default ChatSession;
