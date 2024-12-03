# SIAK Reborn Seeder Gen

## Description

This is a tool to convert data seeding from GSheets into SQL files for Prices-IDE SIAK Reborn. The data seeding structure follows Prices-IDE database structure.

## How to Run
1. Clone this repo
2. Copy `.env.template` into `.env`
3. Put `credentials.json` in the root folder. This file should content a Google Service Account key that has permission to read the sheet
4. Run `npm install`
5. Create a folder named `sql`
6. Run `npm run gen`
7. The `sql` folder should contains the generated SQL files

## Note
The script assume a specific structure for the Google Spreadsheet