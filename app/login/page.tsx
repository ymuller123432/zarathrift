'use client';

import { useState } from 'react';
import { Navbar } from '../../components/Navbar';
import { login, normalizePhone } from '../../lib/auth';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState(''); // phone or email
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Normalize phone if it looks like one (for better matching)
    let loginId = identifier.trim();
    if (/^[\d\s\-\(\)\+]+$/.test(loginId)) {
      loginId = normalizePhone(loginId);
    }

    const result = await login(loginId, password);

    if (result.error) {
      toast.error(result.error);
      setIsLoading(false);
      return;
    }

    toast.success(`Welcome back, ${result.user?.firstName}!`);

    // Support redirect after login (e.g. from checkout)
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect') || '/';
    router.push(redirect);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a] text-[#f5f5f5]">
      <Navbar />

      <div className="zara-container max-w-md py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">Welcome Back</h1>
          <p className="text-[#888] mt-2">Login with your phone number or email.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-[#111] border border-[#222] p-6 rounded">
          <div>
            <label className="text-xs text-[#888] mb-1 block">Phone Number or Email</label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              onBlur={(e) => {
                const val = e.target.value.trim();
                if (/^[\d\s\-\(\)\+]+$/.test(val)) {
                  setIdentifier(normalizePhone(val));
                }
              }}
              required
              className="w-full border border-[#333] bg-[#0a0a0a] px-4 py-2.5 text-sm focus:border-[#666]"
              placeholder="08012345678 or you@example.com"
            />
          </div>

          <div>
            <label className="text-xs text-[#888] mb-1 block">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border border-[#333] bg-[#0a0a0a] px-4 py-2.5 pr-10 text-sm focus:border-[#666]"
                placeholder="Your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888] hover:text-white transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 zara-btn-primary py-3 text-sm font-medium tracking-widest disabled:opacity-50"
          >
            {isLoading ? 'Logging in...' : 'LOGIN'}
          </button>

          <div className="text-center text-xs text-[#666] pt-2 space-y-1">
            <div>
              Don't have an account?{' '}
              <Link href="/register" className="underline hover:text-white">Register here</Link>
            </div>
            <div>
              <Link href="/forgot-password" className="underline hover:text-white">Forgot password?</Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
