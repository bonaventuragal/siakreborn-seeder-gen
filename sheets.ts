import { sheets_v4 } from "@googleapis/sheets";

export const getSheetsValues = async (sheetsClient: sheets_v4.Sheets, spreadsheetId: string, range: string) => {
  const response = await sheetsClient.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  return response.data.values
}