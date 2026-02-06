import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    recipes: defineTable({
        url: v.string(),
        name: v.string(),
        description: v.optional(v.string()),
        totalTime: v.string(),
        servings: v.optional(v.number()),
        caloriesPerPortion: v.optional(v.number()),
        ingredients: v.array(
            v.object({
                item: v.string(),
                amount: v.optional(v.string()),
                unit: v.optional(v.string()),
                notes: v.optional(v.string()),
            })
        ),
        instructions: v.array(
            v.object({
                stepNumber: v.number(),
                instruction: v.string(),
            })
        ),
        healthify: v.object({
            cut: v.object({
                ingredients: v.array(
                    v.object({
                        item: v.string(),
                        amount: v.optional(v.string()),
                        unit: v.optional(v.string()),
                        notes: v.optional(v.string()),
                    })
                ),
                instructions: v.array(v.string()),
                caloriesPerPortion: v.optional(v.number()),
                macros: v.optional(v.any()),
                notes: v.string(),
            }),
            bulk: v.object({
                ingredients: v.array(
                    v.object({
                        item: v.string(),
                        amount: v.optional(v.string()),
                        unit: v.optional(v.string()),
                        notes: v.optional(v.string()),
                    })
                ),
                instructions: v.array(v.string()),
                caloriesPerPortion: v.optional(v.number()),
                macros: v.optional(v.any()),
                notes: v.string(),
            })
        }),
        name_Local: v.optional(v.string()),
        description_local: v.optional(v.string()),
        instructions_Local: v.optional(v.array(
            v.object({
                stepNumber: v.number(),
                instruction_Local: v.string(),
            })
        )),
        healthify_Local: v.optional(v.object({
            cut: v.object({
                ingredients: v.array(
                    v.object({
                        item: v.string(),
                        amount: v.optional(v.string()),
                        unit: v.optional(v.string()),
                        notes: v.optional(v.string()),
                    })
                ),
                instructions: v.array(v.string()),
                caloriesPerPortion: v.optional(v.number()),
                macros: v.optional(v.any()), // keeping flexible
                notes: v.string(),
            }),
            bulk: v.object({
                ingredients: v.array(
                    v.object({
                        item: v.string(),
                        amount: v.optional(v.string()),
                        unit: v.optional(v.string()),
                        notes: v.optional(v.string()),
                    })
                ),
                instructions: v.array(v.string()),
                caloriesPerPortion: v.optional(v.number()),
                macros: v.optional(v.any()),
                notes: v.string(),
            })
        })),
        ingredients_Local: v.optional(v.array(
            v.object({
                item: v.string(),
                amount: v.optional(v.string()),
                unit: v.optional(v.string()),
                notes: v.optional(v.string()),
            })
        )),
        cuisine_type: v.optional(v.string()),
        course_type: v.optional(v.string()),
        dietary_type: v.optional(v.string()),
        cooking_method: v.optional(v.string()),
        special_tags: v.optional(v.string()),
        imageUrl: v.optional(v.string()),
        typeKey: v.optional(v.string()),
        createdAt: v.number(),
    }).index("by_url", ["url"]),
});
