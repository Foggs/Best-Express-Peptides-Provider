import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy - PeptideLabs",
  description: "PeptideLabs refund policy, cancellation policy, and terms of service for research peptides.",
}

export default function RefundPage() {
  return (
    <div className="py-8">
      <div className="container-custom max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Refund Policy</CardTitle>
            <p className="text-muted-foreground">Last updated: November 2024</p>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-6">
            <div>
              <p className="font-semibold text-lg">
                All PeptideLabs web sales are final and non-refundable.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mt-8 mb-4">Cancellation Policy</h2>
              <p>
                All web sales are final and cannot be canceled once an order is placed.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mt-8 mb-4">Social Media Disclaimer</h2>
              <p>
                PeptideLabs does not provide medical or healthcare advice through our social media channels. 
                All information, comments, or links shared by PeptideLabs are intended for educational and 
                informational purposes only. This content is not a substitute for professional medical advice, 
                diagnosis, or treatment. Do not use this information during a medical emergency or for any medical 
                condition. For any health-related questions or concerns, please consult your doctor or a qualified 
                healthcare provider. In case of a medical emergency, call 911 or contact your doctor immediately.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mt-8 mb-4">Promotional Information and Disclaimers</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Discount and promotion codes are for one-time use only.</li>
                <li>They are not applicable to prior purchases.</li>
                <li>These offers cannot be combined with any other sale, promotion, or discount code.</li>
                <li>Offers are void where prohibited, taxed, or restricted.</li>
                <li>Customers are limited to using one discount or promotion code per order.</li>
                <li>Promotions have no cash value.</li>
                <li>PeptideLabs reserves the right to modify any promotion at any time.</li>
                <li>Additional restrictions may apply.</li>
                <li>Offers are valid only within the United States unless otherwise specified.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold mt-8 mb-4">Notice of Direct Payment</h2>
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg space-y-4 text-sm">
                <p>
                  I hereby acknowledge and agree that I understand that payment for the services provided by 
                  PeptideLabs will be billed to and paid by me directly. PeptideLabs will not bill any insurance 
                  or other third-party payers directly, regardless of whether such services may or may not be 
                  covered by any insurance or other programs offered by third-party payers.
                </p>

                <p>
                  I further acknowledge and agree that I understand that neither PeptideLabs nor its providers 
                  have made any representation or warranty that any services, treatment, or any other portion of 
                  the services provided by PeptideLabs are or will be covered by or qualify for reimbursement or 
                  assignment under Medicare, Medicaid, and/or other federal/state government or private insurance 
                  programs.
                </p>

                <p>
                  I also acknowledge and agree to PeptideLabs that I WILL NOT submit any claim to Medicare, Medicaid, 
                  and/or other federal/state government or private insurance programs for any portion of the services 
                  provided by PeptideLabs at any time. I further agree to indemnify PeptideLabs and its members, 
                  managers, and service providers against any claims, actions, losses, or suits and associated costs 
                  (including attorney fees) which result either directly or indirectly from my submission, or any 
                  submission by a representative or authorized agent on my behalf, of a claim for any portion of the 
                  services provided by PeptideLabs to Medicare, Medicaid, and/or other federal/state government or 
                  private insurance programs.
                </p>

                <p>
                  I understand that all PeptideLabs web sales are final and non-refundable, and that payment collected 
                  at purchase is a non-refundable deposit that can be used towards any product at PeptideLabs. I 
                  understand and acknowledge PeptideLabs's refund policy. Web sales are final and cannot be canceled 
                  once an order has been placed. I further acknowledge and agree to PeptideLabs's cancellation policy.
                </p>

                <p>
                  I acknowledge and agree that this Acknowledgment of Direct Payment was executed by me before services 
                  were rendered by PeptideLabs and that I am not experiencing an urgent or emergency health situation.
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold mt-8 mb-4">Research Use Only</h2>
              <p className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                All PeptideLabs products are intended for research and laboratory use only. These products are not 
                intended for human consumption, medical use, or any other purpose except research. Users are solely 
                responsible for the use of these products in accordance with all applicable laws and regulations.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
