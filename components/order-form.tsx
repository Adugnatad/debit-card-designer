"use client"

import type React from "react"

import { useState } from "react"
import type { CardDesign } from "@/components/card-designer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, CheckCircle2 } from "lucide-react"

interface OrderFormProps {
  onBackToDesign: () => void
  cardDesign: CardDesign
}

export function OrderForm({ onBackToDesign, cardDesign }: OrderFormProps) {
  const [formState, setFormState] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    agreeToTerms: false,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormState({
      ...formState,
      [name]: type === "checkbox" ? checked : value,
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false)
      setIsSubmitted(true)
    }, 1500)
  }

  if (isSubmitted) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-10">
            <CheckCircle2 className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Order Submitted Successfully!</h2>
            <p className="text-gray-600 mb-6">
              Thank you for your order. Your custom debit card will be processed and delivered within 7-10 business
              days.
            </p>
            <p className="text-gray-600 mb-6">A confirmation email has been sent to {formState.email}.</p>
            <Button onClick={() => window.location.reload()}>Design Another Card</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={onBackToDesign} className="mr-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <CardTitle>Complete Your Order</CardTitle>
            <CardDescription>
              Please provide your shipping information to complete your custom card order.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" name="fullName" value={formState.fullName} onChange={handleInputChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formState.email}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" name="phone" type="tel" value={formState.phone} onChange={handleInputChange} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Shipping Address</Label>
            <Input id="address" name="address" value={formState.address} onChange={handleInputChange} required />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" value={formState.city} onChange={handleInputChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" name="state" value={formState.state} onChange={handleInputChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zipCode">ZIP Code</Label>
              <Input id="zipCode" name="zipCode" value={formState.zipCode} onChange={handleInputChange} required />
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-4">
            <Checkbox
              id="agreeToTerms"
              name="agreeToTerms"
              checked={formState.agreeToTerms}
              onCheckedChange={(checked) => setFormState({ ...formState, agreeToTerms: checked as boolean })}
              required
            />
            <Label htmlFor="agreeToTerms" className="text-sm">
              I agree to the terms and conditions and understand that my card design will be reviewed before production.
            </Label>
          </div>

          <div className="pt-4">
            <Button type="submit" className="w-full" disabled={isSubmitting || !formState.agreeToTerms}>
              {isSubmitting ? "Processing..." : "Submit Order"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

