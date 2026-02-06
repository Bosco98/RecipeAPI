import OpenAI from 'openai';
import { Recipe } from '../types.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import foodtypes from '../data/Foodtypes.js';

import YAML from "yaml";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read config
const configPath = path.join(__dirname, '../../src/assets/config.json');
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
                "HTTP-Referer": process.env.BASE_URL || "http://localhost:8080", // Required by OpenRouter
                "X-Title": "Health Recipe Extractor", // Required by OpenRouter
            }
        });
    }

    async extractRecipe(content: string, url: string): Promise<Recipe> {
        const course_types = foodtypes['course_type'];
        const cuisine_types = foodtypes['cuisine_type'];
        const dietary_types = foodtypes['dietary_type'];
        const cooking_methods = foodtypes['cooking_method'];
        const special_tags = foodtypes['special_tags'];
        const promptPath = path.resolve(__dirname, '../../src/assets/Prompts/recipe.yaml');
        const promptData = YAML.parse(fs.readFileSync(promptPath, 'utf8'));

        let prompt = promptData.Prompt;
        prompt = prompt.replace("<url>", url)
            .replace("<course_type_list>", course_types.join(', '))
            .replace("<cuisine_type_list>", cuisine_types.join(', '))
            .replace("<dietary_type_list>", dietary_types.join(', '))
            .replace("<cooking_method_list>", cooking_methods.join(', '))
            .replace("<special_tags_list>", special_tags.join(', '));

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
