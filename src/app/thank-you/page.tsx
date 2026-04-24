import Link from "next/link"
import { CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Thank You - BestExpressPeptides",
  description:
    "Thank you for your application. Our team will review your information and reach out within 2–3 business days.",
}

export default function ThankYouPage() {
  return (
    <div className="min-h-[70vh] bg-gray-50 flex items-center justify-center px-4 py-16">
      <div className="max-w-xl w-full bg-white border border-gray-200 rounded-lg shadow-sm p-8 text-center">
        <div className="flex justify-center mb-4">
          <CheckCircle className="h-14 w-14 text-green-500" />
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-3">
          Thank you for your application
        </h1>
        <p className="text-gray-600 leading-relaxed mb-2">
          We&apos;ve received your provider signup and our team will review your
          information shortly.
        </p>
        <p className="text-gray-600 leading-relaxed mb-8">
          You can expect to hear back from us within{" "}
          <span className="font-medium text-gray-800">2–3 business days</span>.
          If you have any questions in the meantime, please reach out via our{" "}
          <Link href="/contact" className="text-blue-600 hover:underline">
            Contact page
          </Link>
          .
        </p>
        <Link href="/">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8">
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  )
}
