export function getSpreadsheetId(): string {
  const id = process.env.GOOGLE_SHEET_ID
  if (!id || !id.trim()) {
    throw new Error(
      'GOOGLE_SHEET_ID env var is not set. Set it to the Google Sheet ID that holds the Products and Variants tabs.',
    )
  }
  return id.trim()
}
