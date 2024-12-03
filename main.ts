import 'dotenv/config'
import { auth, sheets } from "@googleapis/sheets";
import { SqlConverter } from "./sql";
import { getSheetsValues } from "./sheets";
import { generateAuthComp, generateAuthPassworded, generateImpl, generateTableOrder } from "./prices-db";

const SERVICE_ACCOUNT_FILE = "credentials.json";
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const SPREADSHEETS_ID = process.env.SPREADSHEET_ID as string;

const authClient = new auth.GoogleAuth({
  keyFile: SERVICE_ACCOUNT_FILE,
  scopes: SCOPES,
});

const sheetsClient = sheets({
  version: "v4",
  auth: authClient,
});

const converter = new SqlConverter()

const processSheetInfo = async (sheetName: string) => {
  const infoRange = `${sheetName}!1:1`
  const infoRow = await getSheetsValues(sheetsClient, SPREADSHEETS_ID, infoRange)

  if (!infoRow) return {
    dataRange: undefined,
    fileName: undefined
  }

  const dataRange = `${sheetName}!${infoRow[0][1]}`
  const fileName = infoRow[0][3]

  return {
    dataRange,
    fileName
  }
}

const processSheet = async (sheetName: string) => {
  const { dataRange, fileName } = await processSheetInfo(sheetName)

  if (!dataRange || !fileName) return

  const dataRows = await getSheetsValues(sheetsClient, SPREADSHEETS_ID, dataRange)

  if (!dataRows) return

  const types = dataRows[0];
  const headers = dataRows[1];
  const values = dataRows.slice(2);

  if (sheetName.startsWith("auth_")) {
    const authComp = generateAuthComp(sheetName, values)
    converter.addSql(fileName, authComp.tableName, authComp.types, authComp.headers, authComp.values)
    converter.addSql(fileName, sheetName, types, headers, values)

    if (sheetName === "auth_user_impl") {
      const authPassword = generateAuthPassworded(values.map(v => v[0]))
      converter.addSql(fileName, authPassword.tableName, authPassword.types, authPassword.headers, authPassword.values)
    }
  } else {
    converter.addSql(fileName, sheetName, types, headers, values)

    if (sheetName.endsWith("_comp")) {
      const impl = generateImpl(sheetName, headers, values)
      converter.addSql(fileName, impl.tableName, impl.types, impl.headers, impl.values)
    }
  }
};

const main = async () => {
  const metadataResponse = await sheetsClient.spreadsheets.get({
    spreadsheetId: SPREADSHEETS_ID,
  });

  if (!metadataResponse.data.sheets) return

  const sheetNames = metadataResponse.data.sheets
    .slice(1)
    .map((v) => v.properties?.title as string);

  const promises = sheetNames.map(sheetName => {
    converter.register(generateTableOrder(sheetName))
    return processSheet(sheetName)
  })

  await Promise.all(promises)

  converter.compile()
};

main();
