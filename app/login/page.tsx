"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export default function LoginPage() {
  const router = useRouter();
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      if (isSignup) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;
        await setDoc(doc(db, "users", uid), { name, email, role: "teammate" });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.push("/");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const inputClass =
    "w-full p-2.5 border border-zinc-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm";
  const labelClass = "block text-sm font-medium text-zinc-700 mb-1";

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="max-w-sm w-full">
        <div className="text-center mb-6">
          <span className="font-semibold text-zinc-900 tracking-tight text-lg">Task Tracker</span>
        </div>

        <div className="bg-white rounded-lg border border-zinc-200 p-8">
          <h1 className="text-lg font-semibold text-zinc-900 mb-1">
            {isSignup ? "Create your account" : "Log in"}
          </h1>
          <p className="text-sm text-zinc-500 mb-6">
            {isSignup ? "Set up your Task Tracker account" : "Welcome back"}
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-md mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div>
                <label className={labelClass}>Full name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} />
              </div>
            )}

            <div>
              <label className={labelClass}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 text-white font-medium py-2.5 rounded-md text-sm hover:bg-indigo-700 transition"
            >
              {isSignup ? "Sign up" : "Log in"}
            </button>
          </form>

          <button
            onClick={() => {
              setIsSignup(!isSignup);
              setError("");
            }}
            className="text-sm text-indigo-600 hover:underline mt-5 block text-center w-full"
          >
            {isSignup ? "Already have an account? Log in" : "No account yet? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}