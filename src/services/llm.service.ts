import OpenAI from 'openai';
import { Recipe } from '../types.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import foodtypes from '../data/Foodtypes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read config
const configPath = path.join(__dirname, '../config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

export class LLMService {
    private openai: OpenAI;

    constructor() {
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            throw new Error("Missing OPENROUTER_API_KEY in environment variables. Please add it to your .env file.");
        }

        this.openai = new OpenAI({
            baseURL: "https://openrouter.ai/api/v1",
            apiKey: apiKey,
            defaultHeaders: {
                "HTTP-Referer": process.env.BASE_URL || "http://localhost:3000", // Required by OpenRouter
                "X-Title": "Health Recipe Extractor", // Required by OpenRouter
            }
        });
    }

    async extractRecipe(content: string, url: string): Promise<Recipe> {
        const course_types = foodtypes['course_type'];
        const dietary_types = foodtypes['dietary_type'];
        const cooking_methods = foodtypes['cooking_method'];
        const special_tags = foodtypes['special_tags'];
        const prompt = `
        You are an expert health-nutritionist chef. Your task is to extract recipe information from the provided text and format it into a structured JSON object.
        
        The source text comes from: ${url}

        You must extract:
        1. Name of the dish.
        2. Description (brief).
        3. Total time (approximate).
        4. Servings (number).
        5. Calories per portion (estimate if not explicitly stated).
        6. Ingredients: List them clearly. Ideally adaptable for scaling (store amount/unit separately if possible).
        7. Instructions: Step-by-step preparation guide.
        
        CRITICALLY, you must also generate a "healthify" section with two specific variations:
        - "cut": Suggestions to reduce calories/make it lighter (e.g. substitutions, cooking methods).
        - "bulk": Suggestions to add healthy volume/calories (e.g. adding protein, veggies).
        For each variation, provide:
        - A list of modified ingredients (just the changes/additions).
        - A list of modified instructions (just the changes).
        - Estimated calories per portion for this version.
        - "notes": A brief explanation of the changes.
        - Course Type: The type of dish (use only from this list: ${course_types.join(', ')}).
        - Dietary Type: The type of diet the dish is suitable for (use only from this list: ${dietary_types.join(', ')}).
        - Cooking Method: The method used to prepare the dish (use only from this list: ${cooking_methods.join(', ')}).
        - Special Tags: Any additional tags that describe the dish (use only from this list: ${special_tags.join(', ')}).

        Also, generate an "imagePrompt": A brief, consistent prompt describing the final dish for image generation (no text in image, photorealistic food photography style).

        If data is missing (e.g. cooking time, calories), make reasonable expert assumptions based on standard cooking practices.

        Return ONLY valid JSON matching this structure:
        {
          "name": "string",
          "description": "string",
          "totalTime": "string",
          "servings": number,
          "caloriesPerPortion": number,
          "ingredients": [ { "item": "string", "amount": "string", "unit": "string", "notes": "string" } ],
          "instructions": [ { "stepNumber": number, "instruction": "string" } ],
          "healthify": {
            "cut": { "ingredients": ["string"], "instructions": ["string"], "caloriesPerPortion": number, "notes": "string" },
            "bulk": { "ingredients": ["string"], "instructions": ["string"], "caloriesPerPortion": number, "notes": "string" }
          },
          "imagePrompt": "string",
          "course_type":"string",
          "dietary_type": "string",
          "cooking_method": "string",
          "special_tags": "string"    
        }
        `;

        try {
            const completion = await this.openai.chat.completions.create({
                model: config.llm.model,
                messages: [
                    { role: "system", content: "You are a helpful assistant that outputs strictly JSON." },
                    { role: "user", content: prompt + "\n\nRecipe Content:\n" + content.slice(0, 20000) }
                ],
                temperature: config.llm.temperature,
                max_tokens: config.llm.maxTokens,
                response_format: { type: "json_object" }
            });

            const responseContent = completion.choices[0].message.content;
            if (!responseContent) throw new Error("No content from LLM");

            const recipeData = JSON.parse(responseContent);
            return recipeData as Recipe;

        } catch (error) {
            console.error("LLM Extraction Error:", error);
            throw new Error("Failed to extract recipe via LLM");
        }
    }
}
