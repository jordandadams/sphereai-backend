// routes/aiService.js

import express from 'express';
import { createAISession, chatWithAI } from '../services/aiService.js';
import authMiddleware from '../middleware/auth.js'; // Import the auth middleware

const router = express.Router();

// Route to initialize a new AI session with a specific service and service item
// Apply the authMiddleware to this route
router.post('/create-session/:service/:serviceItem', authMiddleware, async (req, res) => {
    try {
        const { service, serviceItem } = req.params;
        const response = await createAISession(service, serviceItem);
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
