import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    recipes: defineTable({
        url: v.string(),
        name: v.string(),
        name_Local: v.optional(v.string()),
        description: v.optional(v.string()),
        ingredients_Local: v.optional(v.array(v.string())),
        instructions_Local: v.optional(v.array(v.string())),
        totalTime: v.string(),
        servings: v.optional(v.number()),
        caloriesPerPortion: v.optional(v.number()),
        ingredients: v.array(
            v.object({
                item: v.string(),
                item_Local: v.optional(v.string()),
                amount: v.optional(v.string()),
                amount_Local: v.optional(v.string()),
                unit: v.optional(v.string()),
                unit_Local: v.optional(v.string()),
                notes: v.optional(v.string()),
                notes_Local: v.optional(v.string()),
            })
        ),
        instructions: v.array(
            v.object({
                stepNumber: v.number(),
                instruction: v.string(),
                instruction_Local: v.optional(v.string()),
            })
        ),
        healthify: v.object({
            cut: v.object({
                ingredients: v.array(v.string()),
                ingredients_Local: v.optional(v.array(v.string())),
                instructions: v.array(v.string()),
                instructions_Local: v.optional(v.array(v.string())),
                caloriesPerPortion: v.optional(v.number()),
                macros: v.optional(v.any()), // keeping flexible
                notes: v.string(),
                notes_Local: v.optional(v.string()),
            }),
            bulk: v.object({
                ingredients: v.array(v.string()),
                ingredients_Local: v.optional(v.array(v.string())),
                instructions: v.array(v.string()),
                instructions_Local: v.optional(v.array(v.string())),
                caloriesPerPortion: v.optional(v.number()),
                macros: v.optional(v.any()),
                notes: v.string(),
                notes_Local: v.optional(v.string()),
            })
        }),
        imagePrompt: v.string(),
        imageUrl: v.optional(v.string()),
        typeKey: v.optional(v.string()),
        createdAt: v.number(),
    }).index("by_url", ["url"]),
});
