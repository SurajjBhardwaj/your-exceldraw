import { NextResponse } from "next/server"
import Stripe from "stripe"
import { prisma } from "@/lib/prisma"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature") as string

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (error: any) {
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 })
  }

  // Handle the event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session

    // Update user's plan
    if (session.metadata?.userId) {
      await prisma.user.update({
        where: {
          id: session.metadata.userId,
        },
        data: {
          plan: "PRO",
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
        },
      })
    }
  }

  // Handle subscription cancelled/updated
  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription

    // Find user with this subscription
    const user = await prisma.user.findFirst({
      where: {
        stripeSubscriptionId: subscription.id,
      },
    })

    if (user) {
      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          plan: "FREE",
        },
      })
    }
  }

  return new NextResponse(null, { status: 200 })
}

export const config = {
  api: {
    bodyParser: false,
  },
  runtime: "nodejs",
}
