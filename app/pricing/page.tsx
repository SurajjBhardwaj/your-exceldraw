import { PlanComparison } from "@/components/plan-comparison"

export default function PricingPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Pricing Plans</h1>
          <p className="text-muted-foreground">Choose the plan that works best for you and your team</p>
        </div>
        <PlanComparison showButtons={true} />
      </div>
    </div>
  )
}
