"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/shared/toast-provider";

type AuthMode = "sign-in" | "sign-up";

export function AuthForm({ nextPath = "/dashboard" }: { nextPath?: string }) {
  const router = useRouter();
  const { pushToast } = useToast();
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      const supabase = createClient();

      const result =
        mode === "sign-in"
          ? await supabase.auth.signInWithPassword({
              email,
              password,
            })
          : await supabase.auth.signUp({
              email,
              password,
            });

      if (result.error) {
        throw result.error;
      }

      setMessage(
        mode === "sign-in"
          ? "Signed in successfully. Open the dashboard to continue."
          : "Account created. Check your email if confirmation is enabled, then continue to the dashboard.",
      );
      pushToast({
        title: mode === "sign-in" ? "Signed in" : "Account created",
        description:
          mode === "sign-in"
            ? "Your organizer session is ready."
            : "Your organizer account was created successfully.",
        tone: "success",
      });

      if (mode === "sign-in") {
        router.replace(nextPath);
        router.refresh();
      }
    } catch (authError) {
      const nextError =
        authError instanceof Error
          ? authError.message
          : "Authentication failed.";
      setError(
        nextError,
      );
      pushToast({
        title: "Authentication failed",
        description: nextError,
        tone: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr]">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-md">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
          Organizer Access
        </p>
        <h1 className="mt-4 text-4xl font-bold text-[var(--color-primary)]">
          Manage programs, review flagged claims, and export payouts.
        </h1>
        <p className="mt-4 text-slate-600">
          Organizers use email and password here. Claimants stay in the public,
          no-login World ID flow.
        </p>
        <div className="mt-8 grid gap-4">
          <div className="rounded-3xl bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-500">What unlocks next</p>
            <p className="mt-2 text-lg font-semibold text-[var(--color-primary)]">
              Program creation, dashboard analytics, manual review, and exports.
            </p>
          </div>
          <div className="rounded-3xl border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/5 p-4 text-sm text-slate-700">
            If Supabase auth variables are not configured yet, the form will show
            an error instead of signing in.
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-md">
        <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1 text-sm">
          <button
            className={`rounded-full px-4 py-2 ${
              mode === "sign-in"
                ? "bg-[var(--color-primary)] text-white"
                : "text-slate-600"
            }`}
            onClick={() => setMode("sign-in")}
            type="button"
          >
            Sign In
          </button>
          <button
            className={`rounded-full px-4 py-2 ${
              mode === "sign-up"
                ? "bg-[var(--color-primary)] text-white"
                : "text-slate-600"
            }`}
            onClick={() => setMode("sign-up")}
            type="button"
          >
            Sign Up
          </button>
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-medium" htmlFor="email">
              Email
            </label>
            <input
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div>
            <label
              className="mb-2 block text-sm font-medium"
              htmlFor="password"
            >
              Password
            </label>
            <input
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          {error ? <p className="text-sm text-[var(--color-error)]">{error}</p> : null}
          {message ? (
            <p className="text-sm text-[var(--color-success)]">{message}</p>
          ) : null}

          <button
            className="w-full rounded-full bg-[var(--color-primary)] px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting
              ? "Working..."
              : mode === "sign-in"
                ? "Sign In"
                : "Create Account"}
          </button>
        </form>

        <div className="mt-6 text-sm text-slate-600">
          <Link
            className="font-medium text-[var(--color-accent)] underline-offset-4 hover:underline"
            href={nextPath}
          >
            Go to dashboard
          </Link>
        </div>
      </section>
    </div>
  );
}
