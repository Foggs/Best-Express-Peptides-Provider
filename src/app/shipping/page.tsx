import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Truck, Package, Clock, Shield } from "lucide-react"

export default function ShippingPage() {
  return (
    <div className="py-8">
      <div className="container-custom max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Shipping Information</CardTitle>
            <p className="text-muted-foreground">Everything you need to know about our shipping</p>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <div className="grid md:grid-cols-2 gap-6 not-prose mb-8">
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Truck className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold">Free Shipping</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Free standard shipping on all orders over $200
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold">Fast Processing</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Orders ship within 1-2 business days
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold">Discreet Packaging</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  All orders ship in unmarked, discreet packaging
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold">Temperature Controlled</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Cold packs included for temperature-sensitive items
                </p>
              </div>
            </div>

            <h2>Shipping Rates</h2>
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left">Order Total</th>
                  <th className="text-left">Standard Shipping</th>
                  <th className="text-left">Express Shipping</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Under $100</td>
                  <td>$15.00</td>
                  <td>$35.00</td>
                </tr>
                <tr>
                  <td>$100 - $199</td>
                  <td>$15.00</td>
                  <td>$25.00</td>
                </tr>
                <tr>
                  <td>$200+</td>
                  <td>FREE</td>
                  <td>$20.00</td>
                </tr>
              </tbody>
            </table>

            <h2>Delivery Times</h2>
            <ul>
              <li><strong>Standard Shipping:</strong> 2-5 business days</li>
              <li><strong>Express Shipping:</strong> 1-2 business days</li>
            </ul>
            <p>
              Please note that delivery times are estimates and may vary based on location and 
              carrier conditions. Times do not include order processing (1-2 business days).
            </p>

            <h2>Shipping Locations</h2>
            <p>
              We currently ship to all 50 US states. We do not ship internationally at this time. 
              Some restrictions may apply for certain products in specific states.
            </p>

            <h2>Order Tracking</h2>
            <p>
              Once your order ships, you will receive a confirmation email with tracking information. 
              You can also track your order through your account dashboard.
            </p>

            <h2>Packaging</h2>
            <p>
              All orders are shipped in discreet, unmarked packaging. No indication of contents 
              will be visible on the outside of the package. For temperature-sensitive peptides, 
              we include cold packs to maintain product integrity during transit.
            </p>

            <h2>Storage Upon Receipt</h2>
            <p>
              Upon receiving your order, we recommend:
            </p>
            <ul>
              <li>Inspect the package for any damage</li>
              <li>Store lyophilized peptides in a freezer (-20°C) for long-term storage</li>
              <li>Reconstituted peptides should be refrigerated (2-8°C)</li>
              <li>Keep products away from direct light and heat</li>
            </ul>

            <h2>Lost or Damaged Packages</h2>
            <p>
              If your package is lost or arrives damaged, please contact us within 48 hours of 
              the expected delivery date. We will work with you to resolve the issue promptly.
            </p>

            <h2>Contact Us</h2>
            <p>
              For shipping inquiries, please contact us at shipping@peptidelabs.com or call 
              1-800-PEPTIDE.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
