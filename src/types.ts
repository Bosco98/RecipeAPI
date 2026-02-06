export interface Ingredient {
    item: string;
    amount?: string;
    unit?: string;
    notes?: string;
}

export interface Instruction {
    stepNumber: number;
    instruction: string;
    instruction_Local?: string;
}

export interface HealthifySection {
    ingredients: string[];
    instructions: string[];
    caloriesPerPortion?: number;
    macros?: any;
    notes: string;
}

export interface Healthify {
    cut: HealthifySection;
    bulk: HealthifySection;
}

export interface Recipe {
    name: string;
    name_Local?: string;
    description?: string;
    description_local?: string;
    ingredients: Ingredient[];
    ingredients_Local?: Ingredient[];
    instructions: Instruction[];
    instructions_Local?: Instruction[];
    healthify: Healthify;
    healthify_Local?: Healthify;
    totalTime: string;
    servings?: number;
    caloriesPerPortion?: number;
    imagePrompt: string;
    course_type?: string;
    dietary_type?: string;
    cooking_method?: string;
    special_tags?: string;
    imageUrl?: string;
}
