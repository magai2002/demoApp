import axios from 'axios';
import { OPENAI_KEY } from '@env';

const instance = axios.create({
  baseURL: 'https://api.openai.com/v1/engines/davinci-codex/completions',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${OPENAI_KEY}`
  }
});

export const generateResponse = async (message) => {
  try {
    const response = await instance.post('', {
      prompt: message,
      max_tokens: 128,
    });
    return response.data.choices[0].text;
  } catch (error) {
    console.error(error);
    return '';
  }
};


const axios = require("axios");

async function processImageInput(chatId, buffer, mimeType, OPENAI_API_KEY) {
    try {
        // Check image size
        const MAX_IMAGE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB in bytes
        if (buffer.byteLength > MAX_IMAGE_SIZE_BYTES) {
            bot.sendMessage(chatId, "The image is too large to process. Please upload a smaller image.");
            return;
        }

        // Convert the image buffer to base64
        const base64Image = Buffer.from(buffer).toString('base64');

        // Call OpenAI Vision API for image processing
        const imageDescription = await getImageDescription(base64Image, mimeType, chatId, OPENAI_API_KEY);

        // Update state and notify the user
        updateState(chatId, 'garmentSketchDetails', imageDescription);
        bot.sendMessage(chatId, "Sketch processed. Please provide any additional details or send 'done' if you are finished.");
        updateState(chatId, "stage", "awaiting_additional_info");
    } catch (error) {
        console.error('Error processing the image:', error);
        bot.sendMessage(chatId, "Error converting the image. Please try again.");
    }
}

async function getImageDescription(base64Image, OPENAI_KEY) {
    try {
        const payload = {                     
            "messages": [
              {
                "content": [
                  {
                    "type": "text",
                    "text": "Describe what you see in the image"
                  } 
                ], 
                "role": "system"  
              },                                                               
              {                       
                "content": [
                  {
                    "image_url": {
                        "url": "data:image/jpeg;base64,${base64Image}",
                        "detail": "high"
                      },
                    "type": "image_url"
                  }                                                               
                ],
                "role": "user"
              }
            ],                                                                                                                                                                    
            "model": "gpt-4-vision-preview",
            "max_tokens": 64
          };

        const headers = {
            Authorization: `Bearer ${OPENAI_KEY}`,
            "Content-Type": "application/json"
        };

        const response = await axios.post("https://api.openai.com/v1/chat/completions", payload, { headers });

        if (response.data.choices && response.data.choices.length > 0) {
            const content = response.data.choices[0].message.content;
            console.log("Response received:", content);
            return content;
        } else {
            throw new Error('No response from OpenAI API');
        }
    } catch (error) {
        console.error('Error getting image description:', error.response ? error.response.data : error.message);

        let errorMessage = "Sorry, I couldn't analyze the image. Please try again later.";
        if (error.message.includes('Unsupported image type')) {
            errorMessage = error.message;
        }
        throw new Error(errorMessage);
    }
}