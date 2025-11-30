import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"

export default function DisclaimerPage() {
  return (
    <div className="py-8">
      <div className="container-custom max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
              Disclaimer
            </CardTitle>
            <p className="text-muted-foreground">Last updated: November 2024</p>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
              <h2 className="text-yellow-800 mt-0">FOR RESEARCH USE ONLY</h2>
              <p className="text-yellow-800 mb-0">
                All products sold on this website are intended for laboratory research purposes 
                only. These products are NOT intended for human or animal consumption, medical, 
                therapeutic, or diagnostic use. By purchasing from PeptideLabs, you acknowledge 
                and agree to these terms.
              </p>
            </div>

            <h2>Research Chemicals Notice</h2>
            <p>
              The peptides and research chemicals sold by PeptideLabs are intended solely for 
              use in scientific research conducted by qualified researchers in appropriate 
              laboratory settings. These products:
            </p>
            <ul>
              <li>Are not approved for human consumption</li>
              <li>Are not intended to diagnose, treat, cure, or prevent any disease</li>
              <li>Should only be handled by trained professionals</li>
              <li>Must be stored and handled according to safety guidelines</li>
            </ul>

            <h2>Buyer Responsibility</h2>
            <p>
              By purchasing from PeptideLabs, you assume full responsibility for:
            </p>
            <ul>
              <li>Ensuring compliance with all local, state, and federal laws</li>
              <li>Proper handling, storage, and disposal of research materials</li>
              <li>Any consequences arising from the use or misuse of these products</li>
              <li>Verifying that you are legally permitted to purchase these products in your jurisdiction</li>
            </ul>

            <h2>No Medical Advice</h2>
            <p>
              Nothing on this website should be construed as medical advice. We do not provide 
              medical consultations or recommendations. Always consult with qualified healthcare 
              professionals for medical advice.
            </p>

            <h2>Product Purity</h2>
            <p>
              While we strive to provide the highest quality research compounds with verified 
              purity levels, we make no guarantees regarding the suitability of these products 
              for any specific research application. Researchers should conduct their own 
              validation testing.
            </p>

            <h2>Limitation of Liability</h2>
            <p>
              PeptideLabs, its owners, employees, and affiliates shall not be held liable for 
              any damages, injuries, or legal consequences arising from the purchase, handling, 
              or use of products sold on this website. This includes but is not limited to:
            </p>
            <ul>
              <li>Personal injury or health issues</li>
              <li>Legal penalties for improper use</li>
              <li>Research failures or unexpected results</li>
              <li>Property damage</li>
            </ul>

            <h2>Age Requirement</h2>
            <p>
              You must be at least 21 years of age to purchase products from PeptideLabs. 
              By making a purchase, you confirm that you meet this age requirement.
            </p>

            <h2>Acknowledgment</h2>
            <p>
              By using this website and purchasing our products, you acknowledge that you have 
              read, understood, and agree to be bound by this disclaimer in its entirety.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
