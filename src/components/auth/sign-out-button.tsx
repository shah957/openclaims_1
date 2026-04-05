"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/shared/toast-provider";

type SignOutButtonProps = {
  className?: string;
};

export function SignOutButton({ className }: SignOutButtonProps) {
  const router = useRouter();
  const { pushToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSignOut() {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      pushToast({
        title: "Supabase not configured",
        description: "Sign-out is only available when Supabase auth is configured.",
        tone: "info",
      });
      router.push("/auth");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      pushToast({
        title: "Signed out",
        description: "Your organizer session has ended.",
        tone: "success",
      });
      router.push("/auth");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to sign out right now.";
      pushToast({
        title: "Sign-out failed",
        description: message,
        tone: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <button
      className={
        className ??
        "rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
      }
      disabled={isSubmitting}
      onClick={handleSignOut}
      type="button"
    >
      {isSubmitting ? "Signing out..." : "Sign out"}
    </button>
  );
}
