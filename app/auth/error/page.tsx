import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Authentication Error - DrawCollab",
  description: "There was an error during authentication",
};

export default function AuthErrorPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const errorMessage = getErrorMessage(searchParams.error);

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <div className="flex justify-center">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Authentication Error
          </h1>
          <p className="text-sm text-muted-foreground">{errorMessage}</p>
        </div>
        <div className="flex justify-center">
          <Button asChild>
            <Link href="/api/auth/signin">Try Again</Link>
          </Button>
        </div>
        <p className="px-8 text-center text-sm text-muted-foreground">
          <Link
            href="/"
            className="hover:text-brand underline underline-offset-4"
          >
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}

function getErrorMessage(error?: string): string {
  switch (error) {
    case "Signin":
      return "Try signing in with a different account.";
    case "OAuthSignin":
    case "OAuthCallback":
    case "OAuthCreateAccount":
    case "EmailCreateAccount":
    case "Callback":
      return "There was a problem with the authentication provider. Please try again.";
    case "OAuthAccountNotLinked":
      return "To confirm your identity, sign in with the same account you used originally.";
    case "EmailSignin":
      return "The email could not be sent. Please try again.";
    case "CredentialsSignin":
      return "The email or password you entered is incorrect. Please try again.";
    case "SessionRequired":
      return "Please sign in to access this page.";
    default:
      return "An unexpected error occurred. Please try again.";
  }
}
