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
import { ArrowLeft, Lock, CreditCard, AlertTriangle, Loader2, MapPin, AlertCircle } from "lucide-react"

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
    if (!/^[a-zA-Z]{2}$/.test(value)) return "State must be 2 letters (e.g., NY)"
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
    validateField(field)
  }

  // Validate individual field
  const validateField = (field: string) => {
    let error: string | undefined

    switch (field) {
      case "email":
        error = validateEmail(email)
        break
      case "firstName":
        error = validateName(firstName, "First Name")
        break
      case "lastName":
        error = validateName(lastName, "Last Name")
        break
      case "address":
        error = validateAddress(address)
        break
      case "city":
        error = validateCity(city)
        break
      case "state":
        error = validateState(state)
        break
      case "zipCode":
        error = validateZipCode(zipCode)
        break
      case "phone":
        error = validatePhone(phone)
        break
    }

    if (error) {
      setErrors({ ...errors, [field]: error })
    } else {
      const newErrors = { ...errors }
      delete newErrors[field as keyof Errors]
      setErrors(newErrors)
    }
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
  const total = subtotal + shipping

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
        }),
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error("Failed to create checkout session")
      }
    } catch (error) {
      console.error("Checkout error:", error)
      alert("There was an error processing your checkout. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const InputWithError = ({ id, label, value, onChange, error, type = "text", placeholder, required, optional }: any) => {
    const hasError = touched[id] && error
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
          onBlur={() => handleBlur(id)}
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
                  onChange={(e: any) => setEmail(e.target.value)}
                  error={errors.email}
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
                    onChange={(e: any) => setFirstName(e.target.value)}
                    error={errors.firstName}
                    required={true}
                  />
                  <InputWithError
                    id="lastName"
                    label="Last Name"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e: any) => setLastName(e.target.value)}
                    error={errors.lastName}
                    required={true}
                  />
                </div>

                <InputWithError
                  id="address"
                  label="Address"
                  placeholder="123 Main Street"
                  value={address}
                  onChange={(e: any) => setAddress(e.target.value)}
                  error={errors.address}
                  required={true}
                />

                <InputWithError
                  id="apartment"
                  label="Apartment, Suite, etc."
                  placeholder="Apt 4B"
                  value={apartment}
                  onChange={(e: any) => setApartment(e.target.value)}
                  error={errors.apartment}
                  optional={true}
                />

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <InputWithError
                      id="city"
                      label="City"
                      placeholder="New York"
                      value={city}
                      onChange={(e: any) => setCity(e.target.value)}
                      error={errors.city}
                      required={true}
                    />
                  </div>
                  <InputWithError
                    id="state"
                    label="State"
                    placeholder="NY"
                    value={state}
                    onChange={(e: any) => setState(e.target.value)}
                    error={errors.state}
                    required={true}
                  />
                </div>

                <InputWithError
                  id="zipCode"
                  label="Zip Code"
                  placeholder="10001"
                  value={zipCode}
                  onChange={(e: any) => setZipCode(e.target.value)}
                  error={errors.zipCode}
                  required={true}
                />

                <InputWithError
                  id="phone"
                  label="Phone Number"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={phone}
                  onChange={(e: any) => setPhone(e.target.value)}
                  error={errors.phone}
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
                <Separator />
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
                      Pay with Stripe
                    </>
                  )}
                </Button>
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  Secured by Stripe - 256-bit SSL
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
