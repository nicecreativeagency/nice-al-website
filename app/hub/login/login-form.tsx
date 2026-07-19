'use client'

import { FormEvent, useState } from 'react'
import { Eye, EyeOff, LoaderCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'

export function LoginForm() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') ?? '').trim()
    const password = String(form.get('password') ?? '')

    const { error: signInError } = await authClient.signIn.email({
      email,
      password,
      rememberMe: true,
    })

    if (signInError) {
      setError('That email or password is not correct. Please try again.')
      setIsSubmitting(false)
      return
    }

    router.replace('/hub')
    router.refresh()
  }

  return (
    <form className="loginForm" onSubmit={handleSubmit}>
      <label>
        <span>Email address</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          required
          disabled={isSubmitting}
        />
      </label>

      <label>
        <span>Password</span>
        <div className="passwordField">
          <input
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Enter your password"
            minLength={12}
            required
            disabled={isSubmitting}
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            disabled={isSubmitting}
          >
            {showPassword ? (
              <EyeOff size={18} aria-hidden="true" />
            ) : (
              <Eye size={18} aria-hidden="true" />
            )}
          </button>
        </div>
      </label>

      {error ? (
        <p className="loginError" role="alert">
          {error}
        </p>
      ) : null}

      <button className="loginSubmit" type="submit" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <LoaderCircle className="spinner" size={18} aria-hidden="true" />
            Signing in
          </>
        ) : (
          'Sign in'
        )}
      </button>
    </form>
  )
}
