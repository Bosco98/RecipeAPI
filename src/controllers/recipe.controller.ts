import { Request, Response } from 'express';
import { QueueService } from '../services/queue.service.js';
import dotenv from 'dotenv';

/**
 * @swagger
 * components:
 *   schemas:
 *     Recipe:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the dish
 *         description:
 *           type: string
 *           description: Brief description
 *         totalTime:
 *           type: string
 *           description: Estimated cooking time
 *         servings:
 *           type: number
 *           description: Number of servings
 *         caloriesPerPortion:
 *           type: number
 *           description: Estimated calories per serving
 *         ingredients:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               item:
 *                 type: string
 *               amount:
 *                 type: string
 *               unit:
 *                 type: string
 *         instructions:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               stepNumber:
 *                 type: number
 *               instruction:
 *                 type: string
 *         healthify:
 *           type: object
 *           properties:
 *             cut:
 *               type: object
 *               description: Tips for reducing calories
 *             bulk:
 *               type: object
 *               description: Tips for adding healthy volume
 *         imagePrompt:
 *           type: string
 *           description: AI generation prompt for the dish image
 */

const queueService = new QueueService();

/**
 * @swagger
 * /api/extract:
 *   post:
 *     summary: Queue a recipe extraction from URL
 *     description: Adds a recipe extraction job to the queue. Processing happens asynchronously.
 *     tags: [Recipes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *                 description: The URL of the recipe to extract
 *                 example: https://www.example.com/tasty-recipe
 *     responses:
 *       202:
 *         description: Job queued successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Job queued
 *                 jobId:
 *                   type: string
 *                   example: 1234-5678-90ab
 *                 position:
 *                   type: number
 *                   example: 1
 *       400:
 *         description: Missing URL or invalid request
 *       500:
 *         description: Server error
 */

export const extractRecipeController = async (req: Request, res: Response) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({ error: "URL is required" });
        }

        console.log(`Received extraction request for: ${url}`);

        const { jobId, position } = queueService.addToQueue(url);

        return res.status(202).json({
            message: "Job queued",
            jobId,
            position
        });

    } catch (error: any) {
        console.error("Controller Error:", error);
        return res.status(500).json({ error: error.message || "Internal Server Error" });
    }
};

/**
 * @swagger
 * /api/extract/text:
 *   post:
 *     summary: Queue a recipe extraction from raw text
 *     description: Adds a recipe extraction job to the queue using provided text. Processing happens asynchronously.
 *     tags: [Recipes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 description: The raw text of the recipe to extract
 *                 example: "Ingredients: 2 cups of flour, 1 tsp salt... Instructions: Mix flour and salt..."
 *     responses:
 *       202:
 *         description: Job queued successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Job queued
 *                 jobId:
 *                   type: string
 *                   example: 1234-5678-90ab
 *                 position:
 *                   type: number
 *                   example: 1
 *       400:
 *         description: Missing text or invalid request
 *       500:
 *         description: Server error
 */
export const extractTextController = async (req: Request, res: Response) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ error: "Text is required" });
        }

        console.log(`Received text-based extraction request (length: ${text.length})`);

        const { jobId, position } = queueService.addTextToQueue(text);

        return res.status(202).json({
            message: "Job queued",
            jobId,
            position
        });

    } catch (error: any) {
        console.error("Controller Error:", error);
        return res.status(500).json({ error: error.message || "Internal Server Error" });
    }
};

/**
 * @swagger
 * /api/queue:
 *   get:
 *     summary: Get current queue status
 *     description: Returns the list of jobs currently in the queue.
 *     tags: [Queue]
 *     responses:
 *       200:
 *         description: List of jobs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   url:
 *                     type: string
 *                   status:
 *                     type: string
 *                   queuedAt:
 *                     type: string
 *                     format: date-time
 */
export const getQueueStatusController = (req: Request, res: Response) => {
    try {
        const queue = queueService.getQueue();
        return res.status(200).json(queue);
    } catch (error: any) {
        console.error("Queue Status Error:", error);
        return res.status(500).json({ error: error.message || "Internal Server Error" });
    }
};
