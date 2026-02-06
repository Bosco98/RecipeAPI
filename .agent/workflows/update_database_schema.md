---
description: How to add or remove fields from the Convex database schema
---

1. **Update Schema Definition**
   - Open `convex/schema.ts`.
   - Locate the table definition (e.g., `recipes`).
   - Add, remove, or modify the field using `v.optional(...)`, `v.string()`, etc.

2. **Update TypeScript Interfaces**
   - Open `src/types.ts` (or the relevant types file).
   - Update the interface (e.g., `Recipe`) to match the new schema.
   - Ensure optional fields in schema are optional (`?`) in the interface.

3. **Update Database Mutations/Queries**
   - Open `convex/recipes.ts` (or relevant mutation file).
   - In mutations (e.g., `saveRecipe`), update the `args` object to include/remove the field.
   - If the field is passed to `ctx.db.insert` or `patch`, ensure it's destructured or included in the object.

4. **Verify Changes**
   - Run `npx convex dev` to sync the schema.
   - Check for any TypeScript errors.
   - Verify the changes in the Convex Dashboard if needed.
