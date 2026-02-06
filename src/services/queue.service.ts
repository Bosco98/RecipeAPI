import { v4 as uuidv4 } from 'uuid';
import { ScraperService } from './scraper.service.js';
import { LLMService } from './llm.service.js';
import { TranslateService } from './translate.service.js';
import { ImageService } from './image.service.js';
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api.js";
import dotenv from 'dotenv';
import { Recipe } from '../types.js';

dotenv.config();

export interface Job {
    id: string;
    url?: string;
    text?: string;
    status: 'queued' | 'processing' | 'completed' | 'failed';
    error?: string;
    result?: any;
    queuedAt: Date;
    startedAt?: Date;
    completedAt?: Date;
}

export class QueueService {
    private queue: Job[] = [];
    private isProcessing: boolean = false;
    private scraperService: ScraperService;
    private llmService: LLMService;
    private translateService: TranslateService;
    private imageService: ImageService;
    private convex: ConvexHttpClient | null = null;

    constructor() {
        this.scraperService = new ScraperService();
        this.llmService = new LLMService();
        this.translateService = new TranslateService();
        this.imageService = new ImageService();

        const convexUrl = process.env.CONVEX_URL;
        if (convexUrl) {
            this.convex = new ConvexHttpClient(convexUrl);
        } else {
            console.warn("Warning: CONVEX_URL not set in QueueService.");
        }
    }

    addToQueue(url: string): { jobId: string, position: number } {
        const job: Job = {
            id: uuidv4(),
            url,
            status: 'queued',
            queuedAt: new Date()
        };

        this.queue.push(job);
        console.log(`[Queue] Job ${job.id} added for URL: ${url}. Position: ${this.queue.length}`);

        // Trigger processing (fire and forget)
        this.processQueue();

        return {
            jobId: job.id,
            position: this.queue.length
        };
    }

    addTextToQueue(text: string): { jobId: string, position: number } {
        const job: Job = {
            id: uuidv4(),
            text,
            status: 'queued',
            queuedAt: new Date()
        };

        this.queue.push(job);
        console.log(`[Queue] Job ${job.id} added for TEXT extraction. Position: ${this.queue.length}`);

        // Trigger processing (fire and forget)
        this.processQueue();

        return {
            jobId: job.id,
            position: this.queue.length
        };
    }

    private async processQueue() {
        if (this.isProcessing) {
            return;
        }

        if (this.queue.length === 0) {
            return;
        }

        this.isProcessing = true;

        while (this.queue.length > 0) {
            const job = this.queue[0]; // Peek first
            job.status = 'processing';
            job.startedAt = new Date();
            console.log(`[Queue] Starting Job ${job.id}...`);

            try {
                let textToProcess = "";
                let sourceUrl = job.url || "manual-text-input";

                if (job.text) {
                    // Skip scraping, use provided text
                    textToProcess = job.text;
                    console.log(`[Job ${job.id}] Using provided text (${textToProcess.length} chars).`);
                } else if (job.url) {
                    // 1. Scrape
                    const html = await this.scraperService.fetchHtml(job.url);
                    textToProcess = await this.scraperService.extractTextContent(html);
                    console.log(`[Job ${job.id}] Scraped ${textToProcess.length} chars.`);
                } else {
                    throw new Error("Job has neither URL nor text");
                }

                // 2. LLM Extract
                const recipeData = await this.llmService.extractRecipe(textToProcess, sourceUrl);
                console.log(`[Job ${job.id}] Extracted via LLM.`);

                // 3. Translate
                let consolidatedData = { ...recipeData };
                try {
                    const translatedData = await this.translateService.translateRecipe(recipeData);
                    consolidatedData = { ...recipeData, ...translatedData };
                    console.log(`[Job ${job.id}] Translated.`);
                } catch (err) {
                    console.error(`[Job ${job.id}] Translation failed, proceeding with original data:`, err);
                }

                // 4. Generate Image (if data exists)
                if (consolidatedData.name) {
                    try {
                        console.log(`[Job ${job.id}] Generating image...`);
                        // Use job.id for the image filename since we don't have a DB ID yet
                        const imageUrl = await this.imageService.processImage(job.id, consolidatedData as Recipe);
                        console.log(`[Job ${job.id}] Image generated: ${imageUrl}`);
                        consolidatedData.imageUrl = imageUrl;
                    } catch (imgErr) {
                        console.error(`[Job ${job.id}] Image generation failed:`, imgErr);
                    }
                }

                // 5. Save to Convex (Final Step)
                let savedId = null;
                if (this.convex) {
                    savedId = await this.convex.mutation(api.recipes.saveRecipe, {
                        ...consolidatedData,
                        url: sourceUrl,
                        typeKey: process.env.TYPE_KEY
                    });
                    console.log(`[Job ${job.id}] Saved to Convex: ${savedId}`);
                }

                job.result = { ...consolidatedData, _convexId: savedId };
                job.status = 'completed';
                job.completedAt = new Date();
                console.log(`[Queue] Finished Job ${job.id}`);

            } catch (error: any) {
                console.error(`[Job ${job.id}] Failed:`, error);
                job.status = 'failed';
                job.error = error.message;
            } finally {
                // Remove from queue regardless of success/failure
                this.queue.shift(); // Remove the processed job
            }
        }

        this.isProcessing = false;
        console.log("[Queue] Queue is empty.");
    }

    getJobStatus(jobId: string): Job | undefined {
        // Since we are shifting items out of the queue, we can't find completed jobs here in this simple implementation.
        // For a real system, we'd keep them in a "completedIds" map or DB.
        // For this user request: "return ok with queue no", we assume fire-and-forget for now.
        return this.queue.find(j => j.id === jobId);
    }

    getQueue(): Job[] {
        return this.queue;
    }
}
