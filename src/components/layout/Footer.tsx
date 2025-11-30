import Link from "next/link"
import { FlaskConical, Mail, Phone } from "lucide-react"
import { Separator } from "@/components/ui/separator"

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FlaskConical className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold text-white">PeptideLabs</span>
            </div>
            <p className="text-sm">
              Premium research peptides for scientific study. All products are for research purposes only.
            </p>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4" />
              <span>support@peptidelabs.com</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4" />
              <span>1-800-PEPTIDE</span>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Products</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/peptides" className="hover:text-primary transition-colors">All Peptides</Link></li>
              <li><Link href="/peptides?category=recovery" className="hover:text-primary transition-colors">Recovery</Link></li>
              <li><Link href="/peptides?category=longevity" className="hover:text-primary transition-colors">Longevity</Link></li>
              <li><Link href="/peptides?category=weight-loss" className="hover:text-primary transition-colors">Weight Loss</Link></li>
              <li><Link href="/peptides?category=cognitive" className="hover:text-primary transition-colors">Cognitive</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Information</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="/shipping" className="hover:text-primary transition-colors">Shipping Info</Link></li>
              <li><Link href="/faq" className="hover:text-primary transition-colors">FAQ</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/disclaimer" className="hover:text-primary transition-colors">Disclaimer</Link></li>
              <li><Link href="/refund" className="hover:text-primary transition-colors">Refund Policy</Link></li>
            </ul>
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
          <p>&copy; {new Date().getFullYear()} PeptideLabs. All rights reserved.</p>
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
