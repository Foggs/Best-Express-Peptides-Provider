import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function RefundPage() {
  return (
    <div className="py-8">
      <div className="container-custom max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Refund Policy</CardTitle>
            <p className="text-muted-foreground">Last updated: November 2024</p>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <h2>Our Commitment</h2>
            <p>
              At PeptideLabs, we stand behind the quality of our research peptides. We want 
              you to be completely satisfied with your purchase. If there&apos;s an issue with 
              your order, we&apos;re here to help.
            </p>

            <h2>Eligibility for Refunds</h2>
            <p>We offer refunds in the following circumstances:</p>
            <ul>
              <li><strong>Damaged Products:</strong> If your order arrives damaged during shipping</li>
              <li><strong>Wrong Items:</strong> If you receive incorrect products</li>
              <li><strong>Quality Issues:</strong> If the product does not meet our stated purity specifications</li>
              <li><strong>Lost Packages:</strong> If your order is lost in transit</li>
            </ul>

            <h2>Timeframe</h2>
            <p>
              Refund requests must be submitted within 30 days of receiving your order. 
              For lost packages, please contact us if your order hasn&apos;t arrived within 
              10 business days of the expected delivery date.
            </p>

            <h2>How to Request a Refund</h2>
            <ol>
              <li>Contact our support team at returns@peptidelabs.com</li>
              <li>Provide your order number and reason for the refund request</li>
              <li>Include photos if applicable (damaged products, wrong items)</li>
              <li>Our team will review your request within 2 business days</li>
            </ol>

            <h2>Refund Process</h2>
            <p>
              Once approved, refunds will be processed within 5-7 business days. The refund 
              will be credited to your original payment method. Please note that it may take 
              additional time for the refund to appear in your account depending on your 
              bank or credit card company.
            </p>

            <h2>Non-Refundable Items</h2>
            <p>The following are not eligible for refunds:</p>
            <ul>
              <li>Products that have been opened, reconstituted, or used</li>
              <li>Orders placed in error where the customer provided incorrect shipping information</li>
              <li>Products that were not stored according to our guidelines after delivery</li>
              <li>Requests made after 30 days from receipt of order</li>
            </ul>

            <h2>Exchanges</h2>
            <p>
              We do not offer direct exchanges. If you need a different product, please 
              request a refund and place a new order.
            </p>

            <h2>Restocking Fee</h2>
            <p>
              There is no restocking fee for eligible refunds. We want to make the process 
              as smooth as possible for our customers.
            </p>

            <h2>Return Shipping</h2>
            <p>
              In most cases, you will not need to return the product. If a return is required, 
              we will provide a prepaid shipping label.
            </p>

            <h2>Quality Guarantee</h2>
            <p>
              All our peptides come with a Certificate of Analysis (COA) verifying purity. 
              If you believe a product does not meet our stated specifications, please 
              contact us with your batch number and we will investigate.
            </p>

            <h2>Contact Us</h2>
            <p>
              For refund inquiries, please contact us at:
            </p>
            <ul>
              <li>Email: returns@peptidelabs.com</li>
              <li>Phone: 1-800-PEPTIDE</li>
            </ul>
            <p>
              Our customer service team is available Monday through Friday, 9 AM to 5 PM EST.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
