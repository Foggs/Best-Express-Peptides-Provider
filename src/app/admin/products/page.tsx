import { ProductsClient } from "./ProductsClient"

export default function ProductsPage() {
  const sheetUrl = `https://docs.google.com/spreadsheets/d/${process.env.GOOGLE_SHEET_ID || ""}/edit`
  return <ProductsClient sheetUrl={sheetUrl} />
}
