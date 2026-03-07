"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useCartStore } from "@/store/cart"
import { formatPrice } from "@/lib/utils"
import { ArrowLeft, Lock, CreditCard, AlertTriangle, Loader2, MapPin, AlertCircle, Tag, X } from "lucide-react"

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware",
  "District of Columbia", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
  "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico",
  "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island",
  "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington",
  "West Virginia", "Wisconsin", "Wyoming"
]

interface Errors {
  email?: string
  firstName?: string
  lastName?: string
  address?: string
  apartment?: string
  city?: string
  state?: string
  zipCode?: string
  phone?: string
}

interface InputWithErrorProps {
  id: string
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onBlur: (field: string) => void
  error?: string
  type?: string
  placeholder?: string
  required?: boolean
  optional?: boolean
  touched: Record<string, boolean>
}

function InputWithError({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  type = "text",
  placeholder,
  required,
  optional,
  touched,
}: InputWithErrorProps) {
  const hasError = error && (touched[id] || value !== "")
  return (
    <div>
      <Label htmlFor={id} className={hasError ? "text-red-500" : ""}>
        {label} {required && !optional && "*"} {optional && "(Optional)"}
      </Label>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={() => onBlur(id)}
        className={hasError ? "border-red-500 focus:border-red-500" : ""}
      />
      {hasError && (
        <div className="flex items-center gap-1 mt-1 text-red-500 text-xs">
          <AlertCircle className="h-3 w-3" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, getTotal, clearCart } = useCartStore()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [address, setAddress] = useState("")
  const [apartment, setApartment] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [zipCode, setZipCode] = useState("")
  const [phone, setPhone] = useState("")
  const [errors, setErrors] = useState<Errors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [couponCode, setCouponCode] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState("")

  useEffect(() => {
    setMounted(true)
  }, [])

  // Validation functions
  const validateEmail = (value: string): string | undefined => {
    if (!value) return "Email is required"
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) return "Please enter a valid email address"
    return undefined
  }

  const validateName = (value: string, fieldName: string): string | undefined => {
    if (!value) return `${fieldName} is required`
    if (value.length < 2) return `${fieldName} must be at least 2 characters`
    if (!/^[a-zA-Z\s'-]+$/.test(value)) return `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`
    return undefined
  }

  const validateAddress = (value: string): string | undefined => {
    if (!value) return "Address is required"
    if (value.length < 5) return "Please enter a valid address"
    return undefined
  }

  const validateCity = (value: string): string | undefined => {
    if (!value) return "City is required"
    if (!/^[a-zA-Z\s'-]+$/.test(value)) return "City can only contain letters, spaces, hyphens, and apostrophes"
    return undefined
  }

  const validateState = (value: string): string | undefined => {
    if (!value) return "State is required"
    if (!US_STATES.includes(value)) return "Please select a valid state"
    return undefined
  }

  const validateZipCode = (value: string): string | undefined => {
    if (!value) return "Zip code is required"
    if (!/^\d{5}(-\d{4})?$/.test(value)) return "Zip code must be valid (e.g., 10001 or 10001-1234)"
    return undefined
  }

  const validatePhone = (value: string): string | undefined => {
    if (!value) return undefined // Optional field
    if (!/^[\d\s()+-]+$/.test(value) || value.replace(/\D/g, "").length < 10) {
      return "Please enter a valid phone number"
    }
    return undefined
  }

  // Handle field blur
  const handleBlur = (field: string) => {
    setTouched({ ...touched, [field]: true })
  }

  // Validate individual field with live feedback
  const validateFieldLive = (fieldName: string, value: string) => {
    let error: string | undefined
    
    if (fieldName === "email") error = validateEmail(value)
    else if (fieldName === "firstName") error = validateName(value, "First Name")
    else if (fieldName === "lastName") error = validateName(value, "Last Name")
    else if (fieldName === "address") error = validateAddress(value)
    else if (fieldName === "apartment") return
    else if (fieldName === "city") error = validateCity(value)
    else if (fieldName === "state") error = validateState(value)
    else if (fieldName === "zipCode") error = validateZipCode(value)
    else if (fieldName === "phone") error = validatePhone(value)

    const newErrors = { ...errors }
    if (error) {
      newErrors[fieldName as keyof Errors] = error
    } else {
      delete newErrors[fieldName as keyof Errors]
    }
    setErrors(newErrors)
  }

  // Validate entire form
  const validateForm = (): boolean => {
    const newErrors: Errors = {}

    const emailError = validateEmail(email)
    if (emailError) newErrors.email = emailError

    const firstNameError = validateName(firstName, "First Name")
    if (firstNameError) newErrors.firstName = firstNameError

    const lastNameError = validateName(lastName, "Last Name")
    if (lastNameError) newErrors.lastName = lastNameError

    const addressError = validateAddress(address)
    if (addressError) newErrors.address = addressError

    const cityError = validateCity(city)
    if (cityError) newErrors.city = cityError

    const stateError = validateState(state)
    if (stateError) newErrors.state = stateError

    const zipCodeError = validateZipCode(zipCode)
    if (zipCodeError) newErrors.zipCode = zipCodeError

    const phoneError = validatePhone(phone)
    if (phoneError) newErrors.phone = phoneError

    setErrors(newErrors)
    setTouched({
      email: true,
      firstName: true,
      lastName: true,
      address: true,
      apartment: true,
      city: true,
      state: true,
      zipCode: true,
      phone: true,
    })
    return Object.keys(newErrors).length === 0
  }

  if (!mounted) {
    return (
      <div className="py-16">
        <div className="container-custom">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-pulse text-muted-foreground">Loading checkout...</div>
          </div>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    router.push("/cart")
    return null
  }

  const subtotal = getTotal()
  const shipping = subtotal >= 20000 ? 0 : 1500
  const discount = appliedCoupon ? appliedCoupon.discount : 0
  const total = subtotal + shipping - discount

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code")
      return
    }

    setCouponLoading(true)
    setCouponError("")
    
    try {
      const response = await fetch("/api/coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode.trim(), subtotal }),
      })

      const data = await response.json()

      if (response.ok) {
        setAppliedCoupon({ code: couponCode.trim(), discount: data.discount })
        setCouponCode("")
      } else {
        setCouponError(data.message || "Invalid coupon code")
      }
    } catch (error) {
      setCouponError("Error validating coupon. Please try again.")
      console.error("Coupon error:", error)
    } finally {
      setCouponLoading(false)
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode("")
    setCouponError("")
  }

  const handleCheckout = async () => {
    if (!validateForm()) {
      setTouched({
        email: true,
        firstName: true,
        lastName: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        phone: true,
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items,
          email,
          shippingAddress: {
            firstName,
            lastName,
            address,
            apartment,
            city,
            state,
            zipCode,
            phone,
          },
          coupon: appliedCoupon,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit order")
      }

      if (data.success) {
        window.location.href = "/checkout/success"
      } else {
        throw new Error("Failed to submit order")
      }
    } catch (error) {
      console.error("Checkout error:", error)
      const message = error instanceof Error ? error.message : "There was an error submitting your order."
      alert(message + " Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="py-8">
      <div className="container-custom max-w-4xl">
        <Link href="/cart" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Cart
        </Link>

        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <InputWithError
                  id="email"
                  label="Email Address"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); validateFieldLive("email", e.target.value); }}
                  onBlur={handleBlur}
                  error={errors.email}
                  touched={touched}
                  required={true}
                />
                <p className="text-xs text-muted-foreground">Your order confirmation and tracking info will be sent here.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Shipping Address
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-2">Enter the address where you want your order delivered.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <InputWithError
                    id="firstName"
                    label="First Name"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => { setFirstName(e.target.value); validateFieldLive("firstName", e.target.value); }}
                    onBlur={handleBlur}
                    error={errors.firstName}
                    touched={touched}
                    required={true}
                  />
                  <InputWithError
                    id="lastName"
                    label="Last Name"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => { setLastName(e.target.value); validateFieldLive("lastName", e.target.value); }}
                    onBlur={handleBlur}
                    error={errors.lastName}
                    touched={touched}
                    required={true}
                  />
                </div>

                <InputWithError
                  id="address"
                  label="Address"
                  placeholder="123 Main Street"
                  value={address}
                  onChange={(e) => { setAddress(e.target.value); validateFieldLive("address", e.target.value); }}
                  onBlur={handleBlur}
                  error={errors.address}
                  touched={touched}
                  required={true}
                />

                <InputWithError
                  id="apartment"
                  label="Apartment, Suite, etc."
                  placeholder="Apt 4B"
                  value={apartment}
                  onChange={(e) => setApartment(e.target.value)}
                  onBlur={handleBlur}
                  error={errors.apartment}
                  touched={touched}
                  optional={true}
                />

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <InputWithError
                      id="city"
                      label="City"
                      placeholder="New York"
                      value={city}
                      onChange={(e) => { setCity(e.target.value); validateFieldLive("city", e.target.value); }}
                      onBlur={handleBlur}
                      error={errors.city}
                      touched={touched}
                      required={true}
                    />
                  </div>
                  <div>
                    <Label htmlFor="state" className={errors.state && (touched.state || state !== "") ? "text-red-500" : ""}>
                      State *
                    </Label>
                    <select
                      id="state"
                      value={state}
                      onChange={(e) => { setState(e.target.value); validateFieldLive("state", e.target.value); }}
                      onBlur={() => handleBlur("state")}
                      className={`w-full px-3 py-2 border rounded-md ${
                        errors.state && (touched.state || state !== "") ? "border-red-500 focus:border-red-500" : ""
                      }`}
                    >
                      <option value="">Select State</option>
                      {US_STATES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    {errors.state && (touched.state || state !== "") && (
                      <div className="flex items-center gap-1 mt-1 text-red-500 text-xs">
                        <AlertCircle className="h-3 w-3" />
                        <span>{errors.state}</span>
                      </div>
                    )}
                  </div>
                </div>

                <InputWithError
                  id="zipCode"
                  label="Zip Code"
                  placeholder="10001"
                  value={zipCode}
                  onChange={(e) => { setZipCode(e.target.value); validateFieldLive("zipCode", e.target.value); }}
                  onBlur={handleBlur}
                  error={errors.zipCode}
                  touched={touched}
                  required={true}
                />

                <InputWithError
                  id="phone"
                  label="Phone Number"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); validateFieldLive("phone", e.target.value); }}
                  onBlur={handleBlur}
                  error={errors.phone}
                  touched={touched}
                  optional={true}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.variantId} className="flex justify-between text-sm">
                      <span>
                        {item.name} ({item.variantName}) x {item.quantity}
                      </span>
                      <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-semibold mb-1">Research Use Acknowledgment</p>
                  <p>
                    By completing this purchase, I acknowledge that all products ordered are intended for laboratory research purposes only and not for human consumption. I confirm that I am at least 21 years of age and agree to the Terms of Service.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>Subtotal ({items.length} items)</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? "FREE" : formatPrice(shipping)}</span>
                </div>

                {!appliedCoupon ? (
                  <div className="space-y-2 pt-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Coupon code"
                        value={couponCode}
                        onChange={(e) => {
                          setCouponCode(e.target.value.toUpperCase())
                          setCouponError("")
                        }}
                        onKeyPress={(e) => e.key === "Enter" && handleApplyCoupon()}
                        className="text-sm"
                      />
                      <Button
                        onClick={handleApplyCoupon}
                        disabled={couponLoading || !couponCode.trim()}
                        size="sm"
                        variant="outline"
                      >
                        {couponLoading ? "..." : "Apply"}
                      </Button>
                    </div>
                    {couponError && (
                      <div className="flex items-center gap-1 text-red-500 text-xs">
                        <AlertCircle className="h-3 w-3" />
                        <span>{couponError}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">{appliedCoupon.code}</span>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-green-600 hover:text-green-800"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                <Separator />

                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600 font-medium">
                    <span>Discount</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}

                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </CardContent>
              <CardFooter className="flex-col gap-4">
                <Button className="w-full" size="lg" onClick={handleCheckout} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Submit Order
                    </>
                  )}
                </Button>
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  Your order details will be sent securely
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
