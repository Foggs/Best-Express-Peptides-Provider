import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TermsPage() {
  return (
    <div className="py-8">
      <div className="container-custom max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Terms of Service</CardTitle>
            <p className="text-muted-foreground">Last updated: November 2024</p>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <h2>1. Research Use Only</h2>
            <p>
              All products sold by PeptideLabs are intended for research and laboratory use only. 
              By purchasing from our website, you agree that:
            </p>
            <ul>
              <li>You are at least 21 years of age</li>
              <li>You will use these products solely for legitimate research purposes</li>
              <li>You will not use these products for human or animal consumption</li>
              <li>You are aware of and will comply with all applicable laws and regulations in your jurisdiction</li>
            </ul>

            <h2>2. Eligibility</h2>
            <p>
              To purchase from PeptideLabs, you must be at least 21 years old and capable of 
              entering into a legally binding agreement. We reserve the right to refuse service 
              to anyone for any reason at any time.
            </p>

            <h2>3. Product Information</h2>
            <p>
              We strive to provide accurate product descriptions and specifications. However, 
              we do not warrant that product descriptions or other content is accurate, complete, 
              reliable, current, or error-free.
            </p>

            <h2>4. Pricing and Payment</h2>
            <p>
              All prices are listed in US dollars. We reserve the right to change prices at any 
              time without notice. Payment is processed securely through Stripe.
            </p>

            <h2>5. Shipping and Delivery</h2>
            <p>
              We ship to addresses within the United States. Shipping times are estimates and 
              not guaranteed. We are not responsible for delays caused by customs, weather, or 
              carrier issues.
            </p>

            <h2>6. Returns and Refunds</h2>
            <p>
              Please refer to our Refund Policy for information about returns and refunds.
            </p>

            <h2>7. Limitation of Liability</h2>
            <p>
              PeptideLabs shall not be liable for any indirect, incidental, special, 
              consequential, or punitive damages resulting from your use or inability to use 
              our products or services.
            </p>

            <h2>8. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless PeptideLabs and its affiliates from any 
              claims, damages, or expenses arising from your use of our products or violation 
              of these terms.
            </p>

            <h2>9. Governing Law</h2>
            <p>
              These terms shall be governed by and construed in accordance with the laws of 
              the United States, without regard to conflict of law principles.
            </p>

            <h2>10. Contact Information</h2>
            <p>
              For questions about these Terms of Service, please contact us at 
              legal@peptidelabs.com.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
