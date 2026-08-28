// Save this file as: app/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export default function LoginPage() {
  const router = useRouter();

  // isSignup toggles between "Login" and "Create Account" mode on the SAME page.
  // Simpler than two separate pages for a beginner project.
  const [isSignup, setIsSignup] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("teammate"); // default — see note below on why this is a demo-only shortcut
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); // clear old error before trying again

    try {
      if (isSignup) {
        // STEP 1: Create the account in Firebase Authentication.
        // This returns a "userCredential" object — userCredential.user.uid
        // is the unique ID Firebase generated for this person.
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const uid = userCredential.user.uid;

        // STEP 2: Save role + profile info in Firestore, using the SAME uid
        // as the document ID. setDoc (not addDoc) is used here on purpose —
        // addDoc auto-generates a random ID, but we WANT the ID to be the uid
        // so that later we can look this user up directly: doc(db, "users", uid)
        // instead of running a search query for it.
        await setDoc(doc(db, "users", uid), {
          name,
          email,
          role, // "admin" or "teammate" — picked from the dropdown below
        });
      } else {
        // Login mode: just verify credentials. No Firestore write needed —
        // AuthContext.tsx already listens for this and fetches the role automatically.
        await signInWithEmailAndPassword(auth, email, password);
      }

      // Both signup and login end up here. We don't decide admin-vs-teammate
      // routing on THIS page — that's the next piece we build (a "traffic
      // controller" on the home page that reads the role from AuthContext
      // and redirects). For now, just go to "/".
      router.push("/");
    } catch (err: any) {
      // Firebase throws readable error messages like
      // "Firebase: Error (auth/email-already-in-use)." — good enough to show directly.
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">
          {isSignup ? "Create Account" : "Log In"}
        </h1>
        <p className="text-gray-500 mb-6">
          {isSignup
            ? "Set up your Task Tracker account"
            : "Welcome back to Task Tracker"}
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name + role only needed at signup — no point asking for them at login */}
          {isSignup && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6} // Firebase itself rejects passwords under 6 chars
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {isSignup && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="teammate">Teammate</option>
                <option value="admin">Admin</option>
              </select>
              {/* Interview talking point: letting users self-select "admin" here
                  is a demo shortcut, not production-safe. Say this out loud if asked. */}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 transition"
          >
            {isSignup ? "Sign Up" : "Log In"}
          </button>
        </form>

        <button
          onClick={() => {
            setIsSignup(!isSignup);
            setError("");
          }}
          className="text-sm text-blue-600 hover:underline mt-4 block text-center w-full"
        >
          {isSignup
            ? "Already have an account? Log in"
            : "No account yet? Sign up"}
        </button>
      </div>
    </div>
  );
}