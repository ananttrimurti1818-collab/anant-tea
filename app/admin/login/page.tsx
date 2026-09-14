"use client";

import { FormEvent, useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase-client";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const credential = await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
      const idToken = await credential.user.getIdToken(true);
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "You are not authorized to access the admin panel.");
      router.replace("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-brand">
          <img src="/logo.png" alt="Anant Tea" />
        </div>
        <div className="admin-login-icon"><ShieldCheck size={25} /></div>
        <div className="eyebrow">Secure access</div>
        <h1>Admin Login</h1>
        <p>Sign in to manage Anant Tea orders, products, customers and more.</p>

        {error && <div className="admin-login-error">{error}</div>}

        <form onSubmit={handleSubmit} className="admin-login-form">
          <label>
            Email address
            <span className="admin-login-input"><Mail size={18} /><input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></span>
          </label>
          <label>
            Password
            <span className="admin-login-input"><LockKeyhole size={18} /><input type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /><button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></span>
          </label>
          <button className="admin-login-submit" disabled={loading}>{loading ? "Signing in…" : "Sign in to Admin"}</button>
        </form>
        <a className="admin-login-store" href="/">← Back to Anant Tea store</a>
      </div>
    </main>
  );
}
