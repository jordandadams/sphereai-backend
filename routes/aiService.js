// routes/aiService.js

import express from 'express';
import { createAISession, chatWithAI, getAllSessionsForUser, getChatSessionBySessionId } from '../services/aiService.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Route to get all chat sessions for a specific user based on userEmail
router.get('/get-sessions', authMiddleware, async (req, res) => {
    try {
        const { userEmail } = req.query;
        if (!userEmail) {
            throw new Error('User email is required');
        }
        const sessions = await getAllSessionsForUser(userEmail);
        res.status(200).send(sessions);
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

router.get('/get-session/:sessionId', authMiddleware, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const chatSessionData = await getChatSessionBySessionId(sessionId);
        res.status(200).send(chatSessionData);
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

// Route to initialize a new AI session with a specific service and service item
// Apply the authMiddleware to this route
router.post('/create-session/:service/:serviceItem', authMiddleware, async (req, res) => {
    try {
        const { service, serviceItem } = req.params;
        const { userEmail } = req.body;
        if (!userEmail) {
            throw new Error('User email is required');
        }
        const response = await createAISession(service, serviceItem, userEmail);
        res.status(200).send(response);
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

// Route to handle subsequent user prompts within an existing session
// Apply the authMiddleware to this route
router.post('/ask/:sessionId', authMiddleware, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userPrompt = req.body.prompt;
        const response = await chatWithAI(sessionId, userPrompt);
        res.status(200).send(response);
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

export default router;
