var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { QueueService } from '../services/queue.service.js';
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
export const extractRecipeController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
    }
    catch (error) {
        console.error("Controller Error:", error);
        return res.status(500).json({ error: error.message || "Internal Server Error" });
    }
});
