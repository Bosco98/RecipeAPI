var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { v4 as uuidv4 } from 'uuid';
import { ScraperService } from './scraper.service.js';
import { LLMService } from './llm.service.js';
import { ConvexHttpClient } from "convex/browser";
// @ts-ignore
import { api } from "../../convex/_generated/api.js";
import dotenv from 'dotenv';
dotenv.config();
export class QueueService {
    constructor() {
        this.queue = [];
        this.isProcessing = false;
        this.convex = null;
        this.scraperService = new ScraperService();
        this.llmService = new LLMService();
        const convexUrl = process.env.CONVEX_URL;
        if (convexUrl) {
            this.convex = new ConvexHttpClient(convexUrl);
        }
        else {
            console.warn("Warning: CONVEX_URL not set in QueueService.");
        }
    }
    addToQueue(url) {
        const job = {
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
    processQueue() {
        return __awaiter(this, void 0, void 0, function* () {
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
                    // 1. Scrape
                    const html = yield this.scraperService.fetchHtml(job.url);
                    const text = yield this.scraperService.extractTextContent(html);
                    console.log(`[Job ${job.id}] Scraped ${text.length} chars.`);
                    // 2. LLM Extract
                    const recipeData = yield this.llmService.extractRecipe(text, job.url);
                    console.log(`[Job ${job.id}] Extracted via LLM.`);
                    // 3. Save to Convex
                    let savedId = null;
                    if (this.convex) {
                        savedId = yield this.convex.mutation(api.recipes.saveRecipe, Object.assign(Object.assign({}, recipeData), { url: job.url, typeKey: process.env.TYPE_KEY }));
                        console.log(`[Job ${job.id}] Saved to Convex: ${savedId}`);
                    }
                    job.result = Object.assign(Object.assign({}, recipeData), { _convexId: savedId });
                    job.status = 'completed';
                    job.completedAt = new Date();
                    console.log(`[Queue] Finished Job ${job.id}`);
                }
                catch (error) {
                    console.error(`[Job ${job.id}] Failed:`, error);
                    job.status = 'failed';
                    job.error = error.message;
                }
                finally {
                    // Remove from queue regardless of success/failure
                    this.queue.shift(); // Remove the processed job
                }
            }
            this.isProcessing = false;
            console.log("[Queue] Queue is empty.");
        });
    }
    getJobStatus(jobId) {
        // Since we are shifting items out of the queue, we can't find completed jobs here in this simple implementation.
        // For a real system, we'd keep them in a "completedIds" map or DB.
        // For this user request: "return ok with queue no", we assume fire-and-forget for now.
        return this.queue.find(j => j.id === jobId);
    }
}
