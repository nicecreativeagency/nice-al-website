import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  LockKeyhole,
} from 'lucide-react'
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
          <h1>Content work,<br />finally in one place.</h1>
          <p>
            Plan every client, collect decisions and keep publishing work moving
            without scattered threads or spreadsheets.
          </p>

          <div className="loginProductPreview" aria-hidden="true">
            <div className="loginPreviewTop">
              <span>
                <small>Today</small>
                <strong>Content flow</strong>
              </span>
              <i><ArrowUpRight size={16} /></i>
            </div>
            <div className="loginPreviewGrid">
              <article>
                <CalendarDays size={17} />
                <strong>08</strong>
                <span>Scheduled</span>
              </article>
              <article>
                <CheckCircle2 size={17} />
                <strong>03</strong>
                <span>Approved</span>
              </article>
              <article className="loginPreviewWide">
                <span>Client review</span>
                <strong>Everything ready for the week.</strong>
                <i>6 / 6</i>
              </article>
            </div>
          </div>
        </div>

        <p className="loginPanelFooter">Content operations by NICE.</p>
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
