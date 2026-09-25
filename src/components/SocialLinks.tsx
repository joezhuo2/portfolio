import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import type { IconType } from 'react-icons'
import { FaDiscord, FaGithub, FaInstagram, FaLinkedinIn } from 'react-icons/fa6'
import { FiArrowUpRight, FiCopy } from 'react-icons/fi'
import { socials, type Social, type SocialKind } from '../data/content'

const ICONS: Record<SocialKind, IconType> = {
  github: FaGithub,
  linkedin: FaLinkedinIn,
  instagram: FaInstagram,
  discord: FaDiscord,
}

interface Props {
  /** compact: round icon buttons (hero). full: labelled cards (outro). */
  variant: 'compact' | 'full'
}

export function SocialLinks({ variant }: Props) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 1800)
    return () => clearTimeout(t)
  }, [copied])

  const copy = async (s: Social) => {
    try {
      await navigator.clipboard.writeText(s.handle)
    } catch {
      // clipboard blocked (http, old browser): the toast still shows the handle
    }
    setCopied(true)
  }

  return (
    <>
      <ul className={variant === 'compact' ? 'flex flex-wrap gap-3' : 'grid w-full gap-3 sm:grid-cols-2'}>
        {socials.map((s) => (
          <li key={s.kind}>
            {variant === 'compact' ? <CompactLink social={s} onCopy={copy} /> : <FullLink social={s} onCopy={copy} />}
          </li>
        ))}
      </ul>
      <AnimatePresence>
        {copied && (
          <motion.div
            role="status"
            className="glass fixed bottom-8 left-1/2 z-50 rounded-full px-5 py-2.5 font-mono text-sm"
            initial={{ opacity: 0, y: 16, x: '-50%', scale: 0.96 }}
            animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }}
            exit={{ opacity: 0, y: 8, x: '-50%', scale: 0.98 }}
            transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
          >
            Copied Discord username: <span className="text-glow">{socials.find((s) => s.kind === 'discord')?.handle}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

interface LinkProps {
  social: Social
  onCopy: (s: Social) => void
}

function CompactLink({ social, onCopy }: LinkProps) {
  const Icon = ICONS[social.kind]
  const className =
    'glass group flex size-12 items-center justify-center rounded-full text-ink/80 transition-[color,transform,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-glow/50 hover:text-white active:scale-95'
  const label = social.href ? `${social.label}: ${social.handle}` : `Copy ${social.label} username ${social.handle}`
  return social.href ? (
    <a href={social.href} target="_blank" rel="noreferrer" aria-label={label} title={label} className={className}>
      <Icon className="size-5" />
    </a>
  ) : (
    <button type="button" onClick={() => onCopy(social)} aria-label={label} title={label} className={className}>
      <Icon className="size-5" />
    </button>
  )
}

function FullLink({ social, onCopy }: LinkProps) {
  const Icon = ICONS[social.kind]
  const className =
    'glass group flex w-full items-center gap-4 rounded-2xl px-5 py-4 text-left transition-[transform,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-glow/50 active:scale-[0.98]'
  const body = (
    <>
      <Icon className="size-6 shrink-0 text-ink/85" />
      <span className="flex min-w-0 flex-col">
        <span className="text-sm text-mist">{social.label}</span>
        <span className="truncate font-mono text-[0.95rem]">{social.kind === 'discord' ? social.handle : `@${social.handle}`}</span>
      </span>
      {social.href ? (
        <FiArrowUpRight className="ml-auto size-5 text-mist transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" />
      ) : (
        <FiCopy className="ml-auto size-4 text-mist transition-colors duration-200 group-hover:text-white" />
      )}
    </>
  )
  return social.href ? (
    <a href={social.href} target="_blank" rel="noreferrer" className={className}>
      {body}
    </a>
  ) : (
    <button type="button" onClick={() => onCopy(social)} className={className} aria-label={`Copy ${social.label} username ${social.handle}`}>
      {body}
    </button>
  )
}
