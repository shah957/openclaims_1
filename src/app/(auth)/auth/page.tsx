import { AuthForm } from "@/components/auth/auth-form";

export default function AuthPage() {
  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <AuthForm />
      </div>
    </main>
  );
}
