import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, LockKeyhole } from 'lucide-react'
import { getViewer } from '@/lib/dal'
import { LoginForm } from './login-form'

export const dynamic = 'force-dynamic'

export default async function LoginPage() {
  const viewer = await getViewer()
  if (viewer) redirect('/hub/dashboard')

  return (
    <main className="loginPage">
      <section className="loginBrandPanel" aria-label="NICE Social Hub introduction">
        <Link href="/" className="loginBackLink">
          <ArrowLeft size={16} aria-hidden="true" />
          Back to nice.al
        </Link>

        <div className="loginBrandCopy">
          <div className="loginBrandMark">
            <Image
              src="/nice-al-symbol.svg"
              alt=""
              width={48}
              height={48}
              priority
            />
            <span>NICE</span>
          </div>
          <p className="loginEyebrow">NICE Social Hub</p>
          <h1>One place for content to move forward.</h1>
          <p>
            Plan, review and approve social content without scattered threads,
            spreadsheets or guesswork.
          </p>
        </div>

        <p className="loginPanelFooter">Built for focused agency–client work.</p>
      </section>

      <section className="loginFormPanel">
        <div className="loginFormWrap">
          <div className="loginMobileBrand">
            <Image
              src="/nice-al-symbol.svg"
              alt="NICE"
              width={36}
              height={36}
              priority
            />
            <span>Social Hub</span>
          </div>

          <div className="loginHeading">
            <div className="loginLock">
              <LockKeyhole size={18} aria-hidden="true" />
            </div>
            <h2>Welcome back</h2>
            <p>Sign in with your NICE-issued account.</p>
          </div>

          <LoginForm />

          <div className="inviteNotice">
            <span aria-hidden="true" />
            Registration is invite-only. Contact NICE if you need access.
          </div>
        </div>
      </section>
    </main>
  )
}
