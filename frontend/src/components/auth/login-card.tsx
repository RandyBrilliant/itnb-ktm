import type { FormEvent } from "react"
import { useState } from "react"
import { ThemedCheckbox } from "../ui/themed-checkbox"

interface LoginCardProps {
  identifier: string
  password: string
  rememberMe: boolean
  isLoading: boolean
  error?: string
  onIdentifierChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onRememberChange: (value: boolean) => void
  onSubmit: (e: FormEvent) => void
  onForgotPassword: () => void
}

export function LoginCard({
  identifier,
  password,
  rememberMe,
  isLoading,
  error,
  onIdentifierChange,
  onPasswordChange,
  onRememberChange,
  onSubmit,
  onForgotPassword,
}: LoginCardProps) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <section className="relative w-full max-w-md border border-white/40 bg-white/80 p-6 backdrop-blur-2xl sm:p-10">
      <div className="absolute inset-y-0 left-0 w-1.5 bg-[#af0f24]" />

      <div className="mb-8 pl-2 sm:mb-10">
        <img
          src="/img/logo-single.png"
          alt="IT&B crest logo"
          className="mb-4 h-14 w-14 object-contain"
        />
        <h2 className="font-[var(--font-heading)] text-3xl font-black uppercase tracking-tight text-[#1a1c1c]">
          IT&B HUB
        </h2>
        <p className="mt-2 font-[var(--font-body)] text-xs font-semibold tracking-[0.12em] text-[#5f5e5e] sm:text-sm">
          LOGIN TO YOUR ACCOUNT TO CONTINUE
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6 pl-2 sm:space-y-8">
        {error && (
          <div className="rounded-sm border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-5">
          <div>
            <label
              htmlFor="identifier"
              className="mb-2 block font-[var(--font-body)] text-xs font-bold uppercase tracking-[0.12em] text-[#af0f24] sm:text-sm"
            >
              Student ID/ Staff ID/ Email
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-0 top-1/2 -translate-y-1/2 text-[#5f5e5e]">
                badge
              </span>
              <input
                id="identifier"
                type="text"
                autoComplete="username"
                value={identifier}
                onChange={(e) => onIdentifierChange(e.target.value)}
                disabled={isLoading}
                placeholder="Enter your Student ID, Staff ID, or Email"
                className="w-full border-0 border-b border-[#e4beba] bg-transparent pb-2 pl-8 font-[var(--font-body)] text-base text-[#1a1c1c] outline-none placeholder:text-[#8f6f6c] focus:border-[#af0f24] disabled:cursor-not-allowed disabled:opacity-60 sm:text-lg"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block font-[var(--font-body)] text-xs font-bold uppercase tracking-[0.12em] text-[#af0f24] sm:text-sm"
            >
              Password
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-0 top-1/2 -translate-y-1/2 text-[#5f5e5e]">
                lock
              </span>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => onPasswordChange(e.target.value)}
                disabled={isLoading}
                placeholder="••••••••"
                className="w-full border-0 border-b border-[#e4beba] bg-transparent pb-2 pl-8 pr-8 font-[var(--font-body)] text-base text-[#1a1c1c] outline-none placeholder:text-[#8f6f6c] focus:border-[#af0f24] disabled:cursor-not-allowed disabled:opacity-60 sm:text-lg"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-[#5f5e5e] transition-colors hover:text-[#af0f24]"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <span className="material-symbols-outlined">
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <ThemedCheckbox
            checked={rememberMe}
            onChange={(e) => onRememberChange(e.target.checked)}
            label="Keep me logged in"
          />

          <button
            type="button"
            className="font-[var(--font-body)] text-sm font-semibold text-[#5f5e5e] transition-colors hover:text-[#af0f24]"
            onClick={onForgotPassword}
          >
            Forgot Password?
          </button>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 bg-gradient-to-br from-[#af0f24] to-[#d32f39] px-5 py-3 font-[var(--font-heading)] text-lg font-bold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span>{isLoading ? "Signing In..." : "Sign In"}</span>
          {!isLoading && (
            <span
              className="material-symbols-outlined text-xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              arrow_forward
            </span>
          )}
        </button>
      </form>

    </section>
  )
}
