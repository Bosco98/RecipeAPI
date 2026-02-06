export interface Ingredient {
    item: string;
    item_Local?: string;
    amount?: string;
    amount_Local?: string;
    unit?: string;
    unit_Local?: string;
    notes?: string;
    notes_Local?: string;
}

export interface Instruction {
    stepNumber: number;
    instruction: string;
    instruction_Local?: string;
}

export interface HealthifySection {
    ingredients: string[];
    ingredients_Local?: string[];
    instructions: string[];
    instructions_Local?: string[];
    caloriesPerPortion?: number;
    macros?: any;
    notes: string;
    notes_Local?: string;
}

export interface Healthify {
    cut: HealthifySection;
    bulk: HealthifySection;
}

export interface Recipe {
    name: string;
    name_Local?: string;
    description?: string;
    ingredients_Local?: string[];
    instructions_Local?: string[];
    totalTime: string;
    servings?: number;
    caloriesPerPortion?: number;
    ingredients: Ingredient[];
    instructions: Instruction[];
    healthify: Healthify;
    imagePrompt: string;
    imageUrl?: string;
}
