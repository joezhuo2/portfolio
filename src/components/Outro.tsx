import { FiArrowUp } from 'react-icons/fi'
import { profile } from '../data/content'
import { scrollToTop } from '../lib/lenis'
import { SocialLinks } from './SocialLinks'

export function OutroContent() {
  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-8 text-center">
      <div>
        <p className="font-mono text-sm tracking-[0.2em] text-glow uppercase">@{profile.username}</p>
        <h2 className="mt-4 text-[clamp(2.75rem,7vw,5.5rem)] leading-[0.95] font-semibold tracking-[-0.04em]">Say hello.</h2>
        <p className="mt-4 text-mist">That's everything for now. Here's where to find me.</p>
      </div>
      <SocialLinks variant="full" />
      <footer className="flex w-full items-center justify-between gap-4 border-t border-white/10 pt-6 text-sm text-mist">
        <span>© {new Date().getFullYear()} {profile.name}</span>
        <button
          type="button"
          onClick={scrollToTop}
          className="group inline-flex items-center gap-2 transition-colors duration-200 hover:text-white"
        >
          Back to the start
          <FiArrowUp className="size-4 transition-transform duration-200 group-hover:-translate-y-0.5" />
        </button>
      </footer>
    </div>
  )
}
