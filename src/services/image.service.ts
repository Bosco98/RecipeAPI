
import { VertexAI } from '@google-cloud/vertexai';
import { GoogleAuth } from 'google-auth-library';
import { Storage } from '@google-cloud/storage';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import YAML from "yaml";
import { Recipe } from '../types.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const imagePromptPath = path.resolve(__dirname, "../../src/data/Prompts/image.yaml");
const imagePrompt = YAML.parse(fs.readFileSync(imagePromptPath, "utf8"));

export class ImageService {
    private vertexAI: VertexAI;
    private storage: Storage;
    private googleAuth: GoogleAuth;
    private config: any;

    constructor() {
        const configPath = path.resolve(__dirname, '../../src/config.json');
        this.config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

        const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;

        if (!projectId) {
            throw new Error("GOOGLE_CLOUD_PROJECT_ID is not set in environment variables.");
        }
        const location = 'us-central1'; // vertex ai location

        this.vertexAI = new VertexAI({ project: projectId, location: location });
        this.storage = new Storage({ projectId: projectId });
        this.googleAuth = new GoogleAuth({
            scopes: 'https://www.googleapis.com/auth/cloud-platform',
        });
    }

    private getColor(): string {
        try {
            const typeKey = process.env.TYPE_KEY;
            const colorsPath = path.resolve(__dirname, `../../src/data/${typeKey}/colors.ts`);

            if (fs.existsSync(colorsPath)) {
                const content = fs.readFileSync(colorsPath, 'utf8');
                const match = content.match(/"Background_color":\s*"(#[A-Fa-f0-9]+)"/);
                if (match && match[1]) {
                    return match[1];
                }
            }
        } catch (error) {
            console.error("[ImageService] Error reading secondary color:", error);
        }
        return "#129080"; // Fallback
    }

    async generateImage(data: Recipe): Promise<Buffer> {
        const backgroundColor = this.getColor();
        const modelName = this.config.image.model;
        const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
        const location = 'us-central1';

        // import from prompts 
        const enhancedPrompt = imagePrompt.Prompt.replace("<dish_name>", data.name)
            .replace("<dish_description>", data.imagePrompt)
            .replace("<background_color>", backgroundColor);



        console.log(`[ImageService] Generating image with prompt: ${enhancedPrompt}`);

        const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelName}:predict`;

        try {
            const client = await this.googleAuth.getClient();
            const tokenResponse = await client.getAccessToken();
            const accessToken = tokenResponse.token;

            const response = await axios.post(
                endpoint,
                {
                    instances: [
                        {
                            prompt: enhancedPrompt,
                        },
                    ],
                    parameters: {
                        sampleCount: this.config.image.sampleCount || 1,
                        aspectRatio: this.config.image.aspectRatio || "1:1",
                    },
                },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (response.data && response.data.predictions && response.data.predictions.length > 0) {
                const imageBase64 = response.data.predictions[0].bytesBase64Encoded;
                return Buffer.from(imageBase64, 'base64');
            } else {
                throw new Error("No image generated in response");
            }
        } catch (error: any) {
            if (error.response) {
                console.error("[ImageService] API Error Response:", JSON.stringify(error.response.data, null, 2));
            }
            throw error;
        }
    }

    async uploadImage(imageBuffer: Buffer, fileName: string): Promise<string> {
        const bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET;

        if (!bucketName) {
            throw new Error("GOOGLE_CLOUD_STORAGE_BUCKET is not set in environment variables.");
        }

        const bucket = this.storage.bucket(bucketName);
        const file = bucket.file(fileName);

        console.log(`[ImageService] Uploading image to ${bucketName}/${fileName}`);

        await file.save(imageBuffer, {
            metadata: { contentType: 'image/png' },
            public: true,
        });

        // Permanent URL for GCS public objects
        return `https://storage.googleapis.com/${bucketName}/${fileName}`;
    }

    async processImage(recipeId: string, data: Recipe): Promise<string> {
        try {
            const imageBuffer = await this.generateImage(data);
            const fileName = `recipe_${recipeId}_${Date.now()}.png`;
            const imageUrl = await this.uploadImage(imageBuffer, fileName);
            return imageUrl;
        } catch (error) {
            console.error("[ImageService] Error in processImage:", error);
            throw error;
        }
    }
}
