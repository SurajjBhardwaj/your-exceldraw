"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Pencil, CreditCard, HardDrive } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export function UserStats() {
  const { data: session } = useSession()
  const [stats, setStats] = useState({
    totalDrawings: 0,
    plan: "FREE",
    storage: { used: 0, total: 5 },
  })
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    let isMounted = true

    async function fetchStats() {
      try {
        const response = await fetch("/api/drawings")
        if (!response.ok) throw new Error("Failed to fetch drawings")
        const drawings = await response.json()

        // Get user from session
        const user = session?.user as any
        const plan = user?.plan || "FREE"

        // Calculate storage
        const storageUsed = drawings.length
        const storageTotal = plan === "PRO" ? 100 : 5

        if (isMounted) {
          setStats({
            totalDrawings: drawings.length,
            plan,
            storage: { used: storageUsed, total: storageTotal },
          })
        }
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    if (session) {
      fetchStats()
    }

    return () => {
      isMounted = false
    }
  }, [session])

  if (loading) {
    return (
      <>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-1/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-1/2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-1/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-1/2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-1/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-1/2" />
          </CardContent>
        </Card>
      </>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-sm font-medium">
            <Pencil className="mr-2 h-4 w-4" />
            Total Drawings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalDrawings}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-sm font-medium">
            <CreditCard className="mr-2 h-4 w-4" />
            Current Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <div className="text-2xl font-bold">{stats.plan}</div>
            {stats.plan === "FREE" && (
              <Button variant="outline" size="sm" onClick={() => router.push("/pricing")}>
                Upgrade to Pro
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-sm font-medium">
            <HardDrive className="mr-2 h-4 w-4" />
            Storage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <div className="text-2xl font-bold">
              {stats.storage.used} / {stats.storage.total}
            </div>
            <div className="w-full bg-muted rounded-full h-2.5">
              <div
                className="bg-primary h-2.5 rounded-full"
                style={{ width: `${(stats.storage.used / stats.storage.total) * 100}%` }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
