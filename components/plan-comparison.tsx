"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

interface PlanComparisonProps {
  showButtons?: boolean
}

export function PlanComparison({ showButtons = false }: PlanComparisonProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleCheckout = async () => {
    if (!session) {
      router.push("/api/auth/signin")
      return
    }

    try {
      setLoading(true)
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId: "price_1OvXYZHGJMPYtz0A0Z5Y5Z5Y", // Replace with your actual Stripe price ID
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create checkout session")
      }

      const { url } = await response.json()
      window.location.href = url
    } catch (error) {
      console.error("Error creating checkout session:", error)
      toast({
        title: "Error",
        description: "Failed to create checkout session. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Get user plan from session
  const userPlan = (session?.user as any)?.plan || "FREE"

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Free Plan */}
      <div className="border rounded-lg p-6 flex flex-col">
        <h3 className="text-2xl font-bold mb-2">Free</h3>
        <p className="text-3xl font-bold mb-6">
          $0 <span className="text-sm font-normal text-muted-foreground">/month</span>
        </p>
        <ul className="space-y-3 mb-8 flex-1">
          <li className="flex items-start">
            <Check className="h-5 w-5 text-green-500 mr-2 shrink-0" />
            <span>Up to 5 drawings</span>
          </li>
          <li className="flex items-start">
            <Check className="h-5 w-5 text-green-500 mr-2 shrink-0" />
            <span>Basic export options</span>
          </li>
          <li className="flex items-start">
            <Check className="h-5 w-5 text-green-500 mr-2 shrink-0" />
            <span>Standard drawing tools</span>
          </li>
          <li className="flex items-start">
            <Check className="h-5 w-5 text-green-500 mr-2 shrink-0" />
            <span>JSON export</span>
          </li>
        </ul>
        {showButtons && (
          <Button variant="outline" className="w-full" onClick={() => router.push("/dashboard")} disabled={loading}>
            {userPlan === "FREE" ? "Current Plan" : "Downgrade"}
          </Button>
        )}
      </div>

      {/* Pro Plan */}
      <div className="border rounded-lg p-6 flex flex-col bg-primary/5 border-primary/20">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-2xl font-bold">Pro</h3>
          <div className="bg-primary text-primary-foreground text-xs font-medium px-2 py-1 rounded">Recommended</div>
        </div>
        <p className="text-3xl font-bold mb-6">
          $9.99 <span className="text-sm font-normal text-muted-foreground">/month</span>
        </p>
        <ul className="space-y-3 mb-8 flex-1">
          <li className="flex items-start">
            <Check className="h-5 w-5 text-green-500 mr-2 shrink-0" />
            <span>Unlimited drawings</span>
          </li>
          <li className="flex items-start">
            <Check className="h-5 w-5 text-green-500 mr-2 shrink-0" />
            <span>High-resolution exports (PNG, SVG, PDF)</span>
          </li>
          <li className="flex items-start">
            <Check className="h-5 w-5 text-green-500 mr-2 shrink-0" />
            <span>Advanced drawing tools</span>
          </li>
          <li className="flex items-start">
            <Check className="h-5 w-5 text-green-500 mr-2 shrink-0" />
            <span>Priority support</span>
          </li>
          <li className="flex items-start">
            <Check className="h-5 w-5 text-green-500 mr-2 shrink-0" />
            <span>Collaboration features</span>
          </li>
        </ul>
        {showButtons && (
          <Button className="w-full" onClick={handleCheckout} disabled={loading || userPlan === "PRO"}>
            {loading ? "Processing..." : userPlan === "PRO" ? "Current Plan" : "Upgrade to Pro"}
          </Button>
        )}
      </div>
    </div>
  )
}
