"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import useAuth from "../../hooks/useAuth";
import CardSwap, { Card } from "../../components/CardSwap";

export default function LoginPage() {
  const router = useRouter();
  const { isLoggedIn, user, loading: authLoading, setLocalUser } = useAuth();
  const [email, setEmail] = useState("");
  const [applicationId, setApplicationId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Check for OAuth errors
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('error') === 'oauth_failed') {
      setError('GitHub login failed. Please try again or use Application ID.');
    }
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isLoggedIn) {
      const target = user?.isApproved && user?.username
        ? `/profile/${user.username}`
        : '/my-application';
      router.replace(target);
    }
  }, [authLoading, isLoggedIn, user, router]);

  const handleGitHubLogin = () => {
    window.location.href = '/api/auth/github';
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, applicationId })
      });

      const data = await response.json();

      if (data.success) {
        setLocalUser(data.user);
        const target = data.user.isApproved && data.user.username
          ? `/profile/${data.user.username}`
          : '/my-application';
        router.push(target);
      } else {
        setError(data.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider) => {
    try {
      await signIn(provider, {
        callbackUrl: '/apply/contributor?prefill=true',
        redirect: true
      });
    } catch (error) {
      console.error(`${provider} sign in error:`, error);
      setError(`Failed to sign in with ${provider}. Please try again.`);
    }
  };

  // Auth loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-4 border-white/10"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 border-r-purple-500 animate-spin"></div>
        </div>
      </div>
    );
  }

  // Redirect if already logged in
  if (isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <p className="text-lg">Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black overflow-hidden">
      <Navbar />
      
      {/* Split Screen Container */}
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Left Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-6 md:px-20 lg:px-20 py-24 relative z-10 order-2 lg:order-1">
          <div className="w-full max-w-md space-y-6 md:space-y-8">
            {/* Logo */}
            <div className="text-left">
              <div className="inline-block px-3 py-1 bg-white/5 border border-white/10 rounded-full mb-4 md:mb-6">
                <span className="text-white font-bold text-xs tracking-wider">DEVNOVATE</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 md:mb-3">
                Welcome Back
              </h1>
              <p className="text-gray-400 text-base">
                Enter your email and application-id to access your account
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-5 md:space-y-6 mt-6 md:mt-10">
              {/* Email Input */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-300">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-4 py-2 md:py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all duration-300 text-sm md:text-sm"
                  required
                />
              </div>

              {/* Application ID Input */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-300">
                  Application ID
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={applicationId}
                    onChange={(e) => setApplicationId(e.target.value)}
                    placeholder="Enter your application ID"
                    className="w-full px-4 py-2 md:py-2.5 pr-12 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all duration-300 text-sm md:text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {showPassword ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      )}
                    </svg>
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Use your Application ID (ECW-2026-xxxxxx) received via email. 
                </p>
              </div>

              {/* Remember Me & Forgot Password */}
              {/* <div className="flex items-center justify-between text-sm">
                <label className="flex items-center cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500 focus:ring-offset-0" />
                  <span className="ml-2 text-gray-400">Remember me</span>
                </label>
                <a href="/apply" className="text-blue-400 hover:text-blue-300 transition">
                  Forgot password?
                </a>
              </div> */}

              {/* Error Message */}
              {error && (
                <div className="p-3 md:p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <p className="text-red-400 text-xs md:text-sm">{error}</p>
                </div>
              )}

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-black px-6 py-3 md:py-3 rounded-xl font-bold text-sm md:text-base hover:bg-gray-100 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>

              {/* Divider */}
              <div className="relative my-6 md:my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs md:text-sm">
                  <span className="px-4 bg-black text-gray-500">Or continue with</span>
                </div>
              </div>

              {/* GitHub OAuth Button */}
              <button
                onClick={handleGitHubLogin}
                type="button"
                className="w-full flex items-center justify-center gap-3 px-6 py-3 md:py-3 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 hover:border-white/20 transition-all duration-300 font-semibold text-sm md:text-base group"
              >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                <span>Sign in with GitHub</span>
              </button>

              {/* Sign Up Link */}
              <p className="text-center text-gray-400 text-sm md:text-base mt-6 md:mt-8">
                Didn't apply for any role yet?{' '}
                <a href="/apply" className="text-blue-400 hover:text-blue-300 font-semibold transition">
                  Apply here
                </a>
              </p>
            </form>
          </div>
        </div>

        {/* Right Side - Animated Background with Card Swap */}
        <div className="hidden lg:block lg:w-1/2 relative overflow-hidden order-1 lg:order-2">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600/80">
            {/* Animated mesh gradient overlay */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
              <div className="absolute top-0 -right-4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
              <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
            </div>
          </div>

          {/* Content Overlay */}
          <div className="relative z-10 h-full flex flex-col items-center justify-center px-12 pt-12 text-white">
            <div className="max-w-lg text-center mb-6">
              <h2 className="text-4xl font-bold mb-3 leading-tight">
                Get Everything
                <br />
                You Want
              </h2>
              <p className="text-base text-white/90 leading-relaxed">
                You can get everything you want if you work hard,
                trust the process, and stick to it.
              </p>
            </div>

            {/* Card Swap Animation */}
            <div style={{ height: '420px', position: 'relative', width: '100%' }}>
              <CardSwap
                width={400}
                height={320}
                cardDistance={35}
                verticalDistance={45}
                delay={4000}
                pauseOnHover={true}
                easing="elastic"
                skewAmount={4}
              >
                <Card>
                  <div className="h-full w-full p-8 flex flex-col justify-between bg-gradient-to-br from-blue-500 to-cyan-500 shadow-2xl">
                    <div>
                      <div className="w-14 h-14 bg-white/30 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                      </div>
                      <h3 className="text-3xl font-bold text-white mb-3">Open Source</h3>
                      <p className="text-white/90 text-base leading-relaxed">
                        Contribute to amazing projects and build your developer portfolio
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-white/70 text-sm font-medium">
                      <span>•</span>
                      <span>100+ Projects</span>
                    </div>
                  </div>
                </Card>
                <Card>
                  <div className="h-full w-full p-8 flex flex-col justify-between bg-gradient-to-br from-purple-500 to-pink-500 shadow-2xl">
                    <div>
                      <div className="w-14 h-14 bg-white/30 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <h3 className="text-3xl font-bold text-white mb-3">Community</h3>
                      <p className="text-white/90 text-base leading-relaxed">
                        Join thousands of developers learning and growing together
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-white/70 text-sm font-medium">
                      <span>•</span>
                      <span>5000+ Members</span>
                    </div>
                  </div>
                </Card>
                <Card>
                  <div className="h-full w-full p-8 flex flex-col justify-between bg-gradient-to-br from-orange-500 to-red-500 shadow-2xl">
                    <div>
                      <div className="w-14 h-14 bg-white/30 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                      </div>
                      <h3 className="text-3xl font-bold text-white mb-3">Recognition</h3>
                      <p className="text-white/90 text-base leading-relaxed">
                        Earn badges, certificates, and showcase your achievements
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-white/70 text-sm font-medium">
                      <span>•</span>
                      <span>Verified Certificates</span>
                    </div>
                  </div>
                </Card>
              </CardSwap>
            </div>
          </div>
        </div>
      </div>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
