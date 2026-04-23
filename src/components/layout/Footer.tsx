import Link from "next/link"
import { FlaskIcon, MailIcon, PhoneIcon } from "@/components/icons"
import { Separator } from "@/components/ui/separator"

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300" role="contentinfo">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FlaskIcon size={24} className="text-primary" />
              <span className="text-lg font-bold text-white">BestExpressPeptides</span>
            </div>
            <p className="text-sm">
              Premium research peptides for scientific study. All products are for research purposes only.
            </p>
            <address className="not-italic space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <MailIcon size={16} />
                <a href="mailto:support@bestexpresspeptides.com" className="hover:text-primary transition-colors">support@bestexpresspeptides.com</a>
              </div>
              {/* <div className="flex items-center gap-2 text-sm">
                <PhoneIcon size={16} />
                <a href="tel:1-800-737-8433" className="hover:text-primary transition-colors">1-800-PEPTIDE</a>
              </div> */}
            </address>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <nav aria-label="Company information">
              <h3 className="font-semibold text-white mb-4">Information</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/shipping" className="hover:text-primary transition-colors">Shipping Info</Link></li>
                <li><Link href="/refund" className="hover:text-primary transition-colors">Refund Policy</Link></li>
                <li><Link href="/disclaimer" className="hover:text-primary transition-colors">Disclaimer</Link></li>
                <li><Link href="/contact" className="hover:text-primary transition-colors">Contact Us</Link></li>
              </ul>
            </nav>

            <nav aria-label="Legal information">
              <h3 className="font-semibold text-white mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
                <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link href="/disclaimer" className="hover:text-primary transition-colors">Disclaimer</Link></li>
                <li><Link href="/refund" className="hover:text-primary transition-colors">Refund and Cancellation Policy</Link></li>
              </ul>
            </nav>
          </div>
        </div>

        <Separator className="my-8 bg-gray-700" />

        <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-lg p-4 mb-8">
          <p className="text-yellow-300 text-sm text-center font-medium">
            All products sold on this website are for research and laboratory use only. Not for human consumption. 
            By purchasing, you agree to use these products solely for research purposes.
          </p>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <p suppressHydrationWarning>&copy; {new Date().getFullYear()} BestExpressPeptides. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>Secure Checkout</span>
            <span>|</span>
            <span>Fast Shipping</span>
            <span>|</span>
            <span>Lab-Tested Quality</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
