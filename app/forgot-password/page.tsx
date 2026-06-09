'use client';

import { useState } from 'react';
import { Navbar } from '../../components/Navbar';
import { requestPasswordReset, resetPassword, normalizePhone } from '../../lib/auth';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [identifier, setIdentifier] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const normalizedId = /^[\d\s\-\(\)\+]+$/.test(identifier.trim()) 
      ? normalizePhone(identifier) 
      : identifier.trim();

    const result = await requestPasswordReset(normalizedId);

    if (result.error) {
      toast.error(result.error);
      setIsLoading(false);
      return;
    }

    if (result.user) {
      setUserId(result.user.id);
      setStep('reset');
      toast.success('Account found. Set a new password below.');
    }
    setIsLoading(false);
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setIsLoading(true);

    const result = await resetPassword(userId, newPassword, confirmNewPassword);

    if (result.error) {
      toast.error(result.error);
      setIsLoading(false);
      return;
    }

    toast.success('Password reset successfully! Please login with your new password.');
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a] text-[#f5f5f5]">
      <Navbar />

      <div className="zara-container max-w-md py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">Reset Password</h1>
          <p className="text-[#888] mt-2">Demo mode — no real email is sent.</p>
        </div>

        {step === 'request' && (
          <form onSubmit={handleRequest} className="space-y-4 bg-[#111] border border-[#222] p-6 rounded">
            <div>
              <label className="text-xs text-[#888] mb-1 block">Phone Number or Email</label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                className="w-full border border-[#333] bg-[#0a0a0a] px-4 py-2.5 text-sm focus:border-[#666]"
                placeholder="08012345678 or you@example.com"
              />
              <p className="text-[10px] text-[#666] mt-1">Enter the phone or email associated with your account.</p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 zara-btn-primary py-3 text-sm font-medium tracking-widest disabled:opacity-50"
            >
              {isLoading ? 'Checking...' : 'FIND ACCOUNT'}
            </button>

            <p className="text-center text-xs text-[#666] pt-2">
              Remembered your password? <Link href="/login" className="underline hover:text-white">Login</Link>
            </p>
          </form>
        )}

        {step === 'reset' && (
          <form onSubmit={handleReset} className="space-y-4 bg-[#111] border border-[#222] p-6 rounded">
            <div className="text-sm text-[#ccc] mb-2">
              Account found. Enter a new password.
            </div>

            <div>
              <label className="text-xs text-[#888] mb-1 block">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full border border-[#333] bg-[#0a0a0a] px-4 py-2.5 pr-10 text-sm focus:border-[#666]"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888] hover:text-white transition-colors"
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs text-[#888] mb-1 block">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirmNewPassword ? "text" : "password"}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  required
                  className="w-full border border-[#333] bg-[#0a0a0a] px-4 py-2.5 pr-10 text-sm focus:border-[#666]"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888] hover:text-white transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 zara-btn-primary py-3 text-sm font-medium tracking-widest disabled:opacity-50"
            >
              {isLoading ? 'Resetting...' : 'RESET PASSWORD'}
            </button>

            <button
              type="button"
              onClick={() => { setStep('request'); setIdentifier(''); setNewPassword(''); setConfirmNewPassword(''); }}
              className="w-full text-xs text-[#888] hover:text-white mt-2"
            >
              ← Try a different account
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
