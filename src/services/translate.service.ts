
import { v2 } from '@google-cloud/translate';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Recipe, Ingredient, Instruction, HealthifySection, Healthify } from '../types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Config {
    translate: {
        projectId: string;
        targetLanguage: string;
    }
}

export class TranslateService {
    private translate: v2.Translate | null = null;
    private targetLanguage: string = 'es';

    constructor() {
        try {
            const configPath = path.resolve(__dirname, '../../src/assets/config.json');
            if (fs.existsSync(configPath)) {
                const configRaw = fs.readFileSync(configPath, 'utf-8');
                const config: Config = JSON.parse(configRaw);

                if (config.translate) {
                    this.targetLanguage = config.translate.targetLanguage || 'es';
                    this.translate = new v2.Translate({
                        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID
                    });
                }
            } else {
                console.warn("[TranslateService] config.json not found.");
            }
        } catch (error) {
            console.error("[TranslateService] Failed to initialize:", error);
        }
    }

    public async translateRecipe(recipe: Recipe): Promise<Partial<Recipe>> {
        if (!this.translate) {
            console.warn("[TranslateService] Service not initialized. Skipping translation.");
            return {};
        }

        console.log(`[TranslateService] Translating recipe: ${recipe.name} to ${this.targetLanguage}`);

        const translated: Partial<Recipe> = {};

        try {
            // 1. name -> name_Local
            if (recipe.name) {
                translated.name_Local = await this.translateText(recipe.name);
            }

            // 2. description -> description_local
            if (recipe.description) {
                translated.description_local = await this.translateText(recipe.description);
            }

            // 3. ingredients[].item -> ingredients_Local[].item
            //    ingredients[].notes -> ingredients_Local[].notes
            if (recipe.ingredients && recipe.ingredients.length > 0) {
                translated.ingredients_Local = await Promise.all(recipe.ingredients.map(async (ing) => {
                    const localIng: Ingredient = { ...ing }; // Copy structure (amount, unit)

                    if (ing.item) {
                        localIng.item = await this.translateText(ing.item);
                    }
                    if (ing.notes) {
                        localIng.notes = await this.translateText(ing.notes);
                    }
                    return localIng;
                }));
            }

            // 4. instructions[].instruction -> instructions_Local[].instruction_Local
            if (recipe.instructions && recipe.instructions.length > 0) {
                // instructions_Local expects Instruction[] but we map 'instruction' to 'instruction_Local'
                translated.instructions_Local = await Promise.all(recipe.instructions.map(async (inst) => {
                    const localInst: Instruction = {
                        stepNumber: inst.stepNumber,
                        instruction_Local: ""
                    };

                    if (inst.instruction) {
                        localInst.instruction_Local = await this.translateText(inst.instruction);
                    }

                    return localInst;
                }));
            }

            // 5. healthify -> healthify_Local
            if (recipe.healthify) {
                translated.healthify_Local = {
                    cut: await this.translateHealthifySection(recipe.healthify.cut),
                    bulk: await this.translateHealthifySection(recipe.healthify.bulk)
                };
            }

        } catch (error) {
            console.error("[TranslateService] Translation failed:", error);
            // Return whatever we managed to translate or empty object? 
            // Better to return partial success or let it fail gracefully?
            // User requirement: "Store results...". If failure, maybe log and continue.
        }

        return translated;
    }

    private async translateHealthifySection(section: HealthifySection): Promise<HealthifySection> {
        const localSection: HealthifySection = { ...section }; // Copy numbers, macros etc.

        // Translate ingredients array
        if (section.ingredients && section.ingredients.length > 0) {
            localSection.ingredients = await Promise.all(section.ingredients.map(async (ing) => {
                const localIng: Ingredient = { ...ing };
                if (ing.item) {
                    localIng.item = await this.translateText(ing.item);
                }
                if (ing.notes) {
                    localIng.notes = await this.translateText(ing.notes);
                }
                return localIng;
            }));
        }

        // Translate instructions array
        if (section.instructions && section.instructions.length > 0) {
            localSection.instructions = await Promise.all(
                section.instructions.map(text => this.translateText(text))
            );
        }

        // Translate notes
        if (section.notes) {
            localSection.notes = await this.translateText(section.notes);
        }

        return localSection;
    }

    private async translateText(text: string): Promise<string> {
        if (!text || !this.translate) return text;
        // Skip numeric-only strings (simple heuristic, though API handles numbers well usually)
        if (/^[\d\s\.,]+$/.test(text)) return text;

        try {
            const [translation] = await this.translate.translate(text, this.targetLanguage);
            return translation;
        } catch (error) {
            console.error(`[TranslateService] Error translating text "${text.substring(0, 20)}...":`, error);
            return text; // Fallback to original
        }
    }
}
