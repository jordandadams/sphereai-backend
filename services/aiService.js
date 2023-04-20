import { Configuration, OpenAIApi } from 'openai';
import ChatSession from '../models/chatSession.js';
import dotenv from "dotenv";

dotenv.config();

// Import the OPENAI_API_KEY from the environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Create the OpenAI Configuration
const configuration = new Configuration({
    apiKey: OPENAI_API_KEY,
});

// Instantiate the OpenAI client with the Configuration
const openai = new OpenAIApi(configuration);

// Define a mapping of services and service items to AI prompts
const servicePrompts = {
    writing: {
        'writeanarticle': 'Write an article like a grad-level professor. If understood, just reply "Hello! What article may I write for you today?"',
        // Add more service items here if needed
    },
    // Add more services here if needed
};

async function createAISession(service, serviceItem, userEmail) {
    // Get the appropriate AI prompt based on the selected service and service item
    const prompt = servicePrompts[service]?.[serviceItem];
    if (!prompt) {
        throw new Error('Invalid service or service item');
    }

    // Generate a unique session ID (for demonstration purposes; use a more robust method for production)
    const sessionId = Math.random().toString(36).substring(2);

    try {
        // Get the AI's initial response
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

        // Return the session ID and the initial AI response
        return { sessionId, message: aiResponse };
    } catch (error) {
        if (error.response) {
            console.log(error.response.status);
            console.log(error.response.data);
        } else {
            console.log(error.message);
        }
        throw error; // Propagate the error to the caller
    }
}

async function chatWithAI(sessionId, userPrompt) {
    // Retrieve the chat session from the database
    const chatSession = await ChatSession.findOne({ sessionId });
    if (!chatSession) {
        throw new Error('Session not found');
    }

    // Combine the AI context with the user's prompt
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
        throw error; // Propagate the error to the caller
    }
}

export { createAISession, chatWithAI };
