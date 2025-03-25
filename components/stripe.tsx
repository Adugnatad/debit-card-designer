"use client"

import type React from "react"

import { useState, useEffect } from "react"

interface StripeProps {
  options: {
    mode: string
    amount: number
    currency: string
  }
  children: React.ReactNode
  className?: string
}

export function Stripe({ options, children, className }: StripeProps) {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading of Stripe elements
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className={`relative ${className}`}>
      {loading ? (
        <div className="flex items-center justify-center h-full min-h-[300px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#006241]"></div>
        </div>
      ) : (
        <div className="p-4 border rounded-lg">{children}</div>
      )}
    </div>
  )
}

