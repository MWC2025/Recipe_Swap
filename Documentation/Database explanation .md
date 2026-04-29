## ERD Explanation

This ERD shows how the database for our `Recipe Swap` app is structured and how the main parts of the system connect together. It includes five main tables: `Users`, `Recipes`, `Tags`, `Recipe_Tags`, and `Swaps`.

The `Users` table stores the account details for each user. The `Recipes` table stores the recipes uploaded by users. These two tables have a one-to-many relationship because one user can upload multiple recipes, while each recipe belongs to only one user.

The `Tags` table is used to organise and label recipes. Since one recipe can have multiple tags, and one tag can be linked to multiple recipes, the `Recipe_Tags` table is used as a junction table to connect them. This creates a many-to-many relationship between recipes and tags.

The `Swaps` table is used to manage recipe exchange requests between users. It stores the user making the request, the recipe they want, the recipe they are offering, and the current status of the swap.

Overall, this database design supports the main features of the app, including user profiles, recipe listings, tagged recipes, and recipe swaps.
