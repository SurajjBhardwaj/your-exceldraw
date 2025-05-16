import { Button } from "@/components/ui/button"
import { PlanComparison } from "@/components/plan-comparison"
import Link from "next/link"

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <section className="py-12 md:py-24 lg:py-32 flex flex-col items-center text-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4">
          Collaborate, Create, and Share Your Drawings
        </h1>
        <p className="text-xl text-muted-foreground max-w-[800px] mb-8">
          DrawCollab is a powerful drawing application that lets you create, save, and share your drawings with others.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button asChild size="lg">
            <Link href="/dashboard">Get Started</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="#features">Learn More</Link>
          </Button>
        </div>
      </section>

      <section id="features" className="py-12 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center text-center p-6 border rounded-lg">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary"
              >
                <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
                <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
                <path d="M2 2l7.586 7.586"></path>
                <circle cx="11" cy="11" r="2"></circle>
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Powerful Drawing Tools</h3>
            <p className="text-muted-foreground">Access all the features of Exceldraw with our intuitive interface.</p>
          </div>
          <div className="flex flex-col items-center text-center p-6 border rounded-lg">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary"
              >
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
                <path d="M7 10h10"></path>
                <path d="M7 14h10"></path>
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Auto-Save & Versioning</h3>
            <p className="text-muted-foreground">
              Your work is automatically saved every 5 seconds, so you never lose your progress.
            </p>
          </div>
          <div className="flex flex-col items-center text-center p-6 border rounded-lg">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Collaboration</h3>
            <p className="text-muted-foreground">Share your drawings with others and collaborate in real-time.</p>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-24">
        <h2 className="text-3xl font-bold text-center mb-12">Choose Your Plan</h2>
        <PlanComparison />
      </section>
    </div>
  )
}
