import { Configuration, OpenAIApi } from 'openai';
import ChatSession from '../models/chatSession.js';
import dotenv from "dotenv";

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const configuration = new Configuration({
    apiKey: OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

// Define a mapping of services and service items to AI prompts
const servicePrompts = {
    writing: {
        'writeanarticle': 'Write an article like a grad-level professor. If understood, just reply "Hello! What article may I write for you today?"',
        // TODO: Add more service items
    },
};

async function getAllSessionsForUser(userEmail) {
    // Query the database for chat sessions with the specified userEmail
    const sessions = await ChatSession.find({ userEmail });
    return sessions;
}

async function getChatSessionBySessionId(sessionId) {
    // Retrieve the chat session from the database
    const chatSession = await ChatSession.findOne({ sessionId });
    if (!chatSession) {
        throw new Error('Session not found');
    }
    return chatSession;
}

async function createAISession(service, serviceItem, userEmail) {
    // Get the appropriate AI prompt based on the selected service and service item
    const prompt = servicePrompts[service]?.[serviceItem];
    if (!prompt) {
        throw new Error('Invalid service or service item');
    }

    // Generate a unique session ID
    const sessionId = Math.random().toString(36).substring(2);

    try {
        const gptResponse = await openai.createCompletion({
            model: 'text-davinci-003',
            prompt: prompt,
        });
        const aiResponse = gptResponse.data.choices[0].text.trim();

        // Create and save the chat session in the database
        const chatSession = new ChatSession({
            service,
            serviceItem,
            userEmail,
            sessionId,
            chatLogs: [{ sender: 'AI', message: aiResponse }],
        });
        await chatSession.save();

        return { sessionId, message: aiResponse };
    } catch (error) {
        if (error.response) {
            console.log(error.response.status);
            console.log(error.response.data);
        } else {
            console.log(error.message);
        }
        throw error;
    }
}

async function chatWithAI(sessionId, userPrompt) {
    const chatSession = await ChatSession.findOne({ sessionId });
    if (!chatSession) {
        throw new Error('Session not found');
    }

    const context = chatSession.chatLogs.map(log => `${log.sender}: ${log.message}`).join('\n');
    const combinedPrompt = `${context}\nuser: ${userPrompt}`;

    try {
        // Use the OpenAI GPT-3 API to get a response based on the prompt
        const gptResponse = await openai.createCompletion({
            model: 'text-davinci-003', // Use the desired model here
            prompt: userPrompt,
            max_tokens: 150,
        });
        // Extract the AI-generated response
        const aiResponse = gptResponse.data.choices[0].text.trim();

        console.log(aiResponse);

        // Update the chat logs in the chat session
        chatSession.chatLogs.push({ sender: 'user', message: userPrompt });
        chatSession.chatLogs.push({ sender: 'AI', message: aiResponse });
        await chatSession.save();

        return { message: aiResponse };
    } catch (error) {
        if (error.response) {
            console.log(error.response.status);
            console.log(error.response.data);
        } else {
            console.log(error.message);
        }
        throw error;
    }
}

export { createAISession, chatWithAI, getAllSessionsForUser, getChatSessionBySessionId };
