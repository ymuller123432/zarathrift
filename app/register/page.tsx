'use client';

import { useState } from 'react';
import { Navbar } from '../../components/Navbar';
import { register, getPasswordStrength, normalizePhone } from '../../lib/auth';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: '', color: '', feedback: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let newValue = value;

    if (name === 'phone') {
      // Allow only digits, +, spaces, -, () while typing
      newValue = value.replace(/[^0-9+\s\-\(\)]/g, '');
    }

    setFormData(prev => ({ ...prev, [name]: newValue }));

    if (name === 'password') {
      setPasswordStrength(getPasswordStrength(newValue));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const normalizedPhone = normalizePhone(formData.phone);
    const dataToSend = { ...formData, phone: normalizedPhone };

    const result = await register(dataToSend);

    if (result.error) {
      toast.error(result.error);
      setIsLoading(false);
      return;
    }

    toast.success('Registration successful! You are now logged in.');
    // Since register auto-logs in, redirect to home or account
    router.push('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a] text-[#f5f5f5]">
      <Navbar />

      <div className="zara-container max-w-md py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">Create Account</h1>
          <p className="text-[#888] mt-2">Join Zara Thrift and start shopping premium pre-loved fashion.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-[#111] border border-[#222] p-6 rounded">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[#888] mb-1 block">First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="w-full border border-[#333] bg-[#0a0a0a] px-4 py-2.5 text-sm focus:border-[#666]"
                placeholder="Chinedu"
              />
            </div>
            <div>
              <label className="text-xs text-[#888] mb-1 block">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="w-full border border-[#333] bg-[#0a0a0a] px-4 py-2.5 text-sm focus:border-[#666]"
                placeholder="Okoro"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-[#888] mb-1 block">Phone Number (required for login)</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              onBlur={(e) => {
                const normalized = normalizePhone(e.target.value);
                setFormData(prev => ({ ...prev, phone: normalized }));
              }}
              required
              className="w-full border border-[#333] bg-[#0a0a0a] px-4 py-2.5 text-sm focus:border-[#666]"
              placeholder="08012345678 or +2348012345678"
            />
            <p className="text-[10px] text-[#666] mt-1">Nigerian numbers (will be normalized to 0801... format). Example: 0801 234 5678</p>
          </div>

          <div>
            <label className="text-xs text-[#888] mb-1 block">Email (optional)</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full border border-[#333] bg-[#0a0a0a] px-4 py-2.5 text-sm focus:border-[#666]"
              placeholder="you@example.com"
            />
            <p className="text-[10px] text-[#666] mt-1">Can be used to login as well</p>
          </div>

          <div>
            <label className="text-xs text-[#888] mb-1 block">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full border border-[#333] bg-[#0a0a0a] px-4 py-2.5 pr-10 text-sm focus:border-[#666]"
                placeholder="At least 6 characters"
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

            {formData.password && (
              <div className="mt-2 text-xs">
                {/* Fancier segmented strength bar with glow and labels */}
                <div className="flex items-center gap-3 mb-1.5">
                  <div className="flex gap-1 flex-1">
                    {[1,2,3,4].map((level) => {
                      const filled = passwordStrength.score >= level;
                      const isStrong = passwordStrength.score >= 4;
                      const isMedium = passwordStrength.score >= 3 && !isStrong;
                      return (
                        <div
                          key={level}
                          className={`h-2 flex-1 rounded-full transition-all duration-300 ease-out ${
                            filled 
                              ? isStrong 
                                ? 'bg-emerald-500 shadow-[0_0_6px_1px_rgba(16,185,129,0.6)]' 
                                : isMedium 
                                  ? 'bg-amber-500 shadow-[0_0_6px_1px_rgba(245,158,11,0.5)]' 
                                  : 'bg-orange-500 shadow-[0_0_6px_1px_rgba(249,115,22,0.5)]'
                              : 'bg-[#1f1f1f] border border-[#333]'
                          }`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex items-baseline gap-1 min-w-[60px]">
                    <span className={`font-bold text-xs tracking-widest ${passwordStrength.color}`}>
                      {passwordStrength.label.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-[#555] font-mono">
                      {passwordStrength.score}/4
                    </span>
                  </div>
                </div>

                {/* Visual criteria checklist - fancier with icons */}
                <div className="grid grid-cols-2 gap-x-3 gap-y-px text-[10px] text-[#777]">
                  {[
                    { label: '6+ characters', met: formData.password.length >= 6 },
                    { label: '8+ characters', met: formData.password.length >= 8 },
                    { label: 'Number', met: /[0-9]/.test(formData.password) },
                    { label: 'Uppercase (A-Z)', met: /[A-Z]/.test(formData.password) },
                    { label: 'Special (!@# etc)', met: /[^A-Za-z0-9]/.test(formData.password) },
                  ].map((req, idx) => (
                    <div 
                      key={idx} 
                      className={`flex items-center gap-1.5 py-px ${req.met ? 'text-emerald-400' : 'text-[#666]'}`}
                    >
                      <span className={`text-[11px] leading-none ${req.met ? '' : 'opacity-60'}`}>
                        {req.met ? '●' : '○'}
                      </span>
                      <span className="tracking-tight">{req.label}</span>
                    </div>
                  ))}
                </div>

                <div className="text-[#555] mt-1.5 text-[9px] italic tracking-tight">
                  {passwordStrength.feedback}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs text-[#888] mb-1 block">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full border border-[#333] bg-[#0a0a0a] px-4 py-2.5 pr-10 text-sm focus:border-[#666]"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888] hover:text-white transition-colors"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 zara-btn-primary py-3 text-sm font-medium tracking-widest disabled:opacity-50"
          >
            {isLoading ? 'Creating Account...' : 'CREATE ACCOUNT'}
          </button>

          <p className="text-center text-xs text-[#666] pt-2">
            Already have an account?{' '}
            <Link href="/login" className="underline hover:text-white">Login here</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
