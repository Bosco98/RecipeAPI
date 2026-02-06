import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { extractRecipeController, getQueueStatusController, extractTextController } from './controllers/recipe.controller.js';
import swaggerUi from 'swagger-ui-express';
import { specs } from './config/swagger.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

app.post('/api/extract', extractRecipeController);
app.post('/api/extract/text', extractTextController);
app.get('/api/queue', getQueueStatusController);

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
