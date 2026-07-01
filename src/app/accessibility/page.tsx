import { Metadata } from "next"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Accessibility Statement - BestExpressPeptides",
  description: "BestExpressPeptides accessibility statement — our WCAG 2.1 AA commitment, accessibility features, and how to report barriers.",
}

export default function AccessibilityPage() {
  return (
    <div className="py-8">
      <div className="container-custom max-w-4xl">
        <Card>
          <CardHeader>
            <h1 className="text-3xl font-bold tracking-tight">Accessibility Statement</h1>
            <p className="text-muted-foreground">Last Updated: July 1, 2026</p>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <h2>Our Commitment</h2>
            <p>
              BestExpressPeptides is committed to ensuring digital accessibility for people with
              disabilities. We are continually improving the user experience for everyone and
              applying the relevant accessibility standards to ensure we provide equal access to
              all users.
            </p>

            <h2>Conformance Status</h2>
            <p>
              The Web Content Accessibility Guidelines (WCAG) define requirements for designers
              and developers to improve accessibility for people with disabilities. It defines
              three levels of conformance: Level A, Level AA, and Level AAA.
            </p>
            <p>
              Our website and platform strive to conform to WCAG 2.1 level AA. We conduct
              ongoing accessibility assessments of our website and platform, and we remediate
              issues identified to improve accessibility.
            </p>

            <h2>Accessibility Features</h2>
            <p>Our website and platform include the following accessibility features:</p>
            <ul>
              <li>
                <strong>Keyboard accessibility:</strong> All features and content are accessible
                using keyboard navigation
              </li>
              <li>
                <strong>Alt text for images:</strong> We provide alternative text for images to
                ensure content is accessible to screen reader users
              </li>
              <li>
                <strong>Color contrast:</strong> We design our interface with sufficient color
                contrast between text and backgrounds
              </li>
              <li>
                <strong>Resizable text:</strong> Our content can be resized without loss of
                functionality
              </li>
              <li>
                <strong>Descriptive links:</strong> We use descriptive link text to help users
                understand where links will take them
              </li>
              <li>
                <strong>Consistent navigation:</strong> Our navigation is consistent across the
                website
              </li>
              <li>
                <strong>Form labels:</strong> All form fields have properly associated labels
              </li>
              <li>
                <strong>Focus indicators:</strong> Visible focus indicators help keyboard users
                navigate our interface
              </li>
            </ul>

            <h2>Assistive Technology Compatibility</h2>
            <p>
              We aim to ensure our website and platform are compatible with various assistive
              technologies, including:
            </p>
            <ul>
              <li>Screen readers (such as JAWS, NVDA, VoiceOver, and TalkBack)</li>
              <li>Speech recognition software</li>
              <li>Screen magnification software</li>
              <li>Alternative input devices</li>
            </ul>

            <h2>Known Limitations</h2>
            <p>
              While we strive to ensure that our website and platform are accessible, there may
              be some limitations:
            </p>
            <ul>
              <li>
                Some older content may not fully meet our current accessibility standards
              </li>
              <li>
                Third-party content and applications that we link to may not conform to the same
                accessibility standards
              </li>
            </ul>
            <p>
              We are working to address these limitations and improve the accessibility of our
              digital properties.
            </p>

            <h2>Feedback</h2>
            <p>
              We welcome your feedback on the accessibility of our website and platform. If you
              encounter accessibility barriers or have suggestions for improvement, please
              contact us at:
            </p>
            <p>
              <strong>Email:</strong>{" "}
              <a href="mailto:support@bestexpresspeptides.com">
                support@bestexpresspeptides.com
              </a>
            </p>
            <p>
              We will make all reasonable efforts to address your concerns and provide the
              information you need in an accessible format.
            </p>

            <h2>Assessment Methodology</h2>
            <p>We assess the accessibility of our website and platform through:</p>
            <ul>
              <li>Regular internal audits</li>
              <li>Automated testing tools</li>
              <li>User testing with assistive technologies</li>
              <li>Feedback from users with disabilities</li>
              <li>Periodic third-party accessibility evaluations</li>
            </ul>

            <h2>Compliance Statement</h2>
            <p>
              BestExpressPeptides is committed to making its website and platform accessible in
              accordance with applicable laws and regulations, including but not limited to the
              Americans with Disabilities Act (ADA), Section 508 of the Rehabilitation Act, and
              other applicable state and local laws.
            </p>

            <h2>Contact Us</h2>
            <p>
              If you have any questions about our accessibility efforts or need assistance,
              please contact us at{" "}
              <a href="mailto:support@bestexpresspeptides.com">
                support@bestexpresspeptides.com
              </a>
              .
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
