import { motion } from 'motion/react'
import { profile } from '../data/content'
import { SocialLinks } from './SocialLinks'

const rise = {
  hidden: { opacity: 0, y: 24, filter: 'blur(8px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)' },
}

/** Name, username and socials. Plays a one-off entrance on load. */
export function HeroContent({ entrance = true }: { entrance?: boolean }) {
  return (
    <motion.div
      className="flex max-w-2xl flex-col items-start gap-6"
      initial={entrance ? 'hidden' : false}
      animate="show"
      transition={{ staggerChildren: 0.12, delayChildren: 0.15 }}
    >
      <motion.p variants={rise} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="font-mono text-sm tracking-[0.2em] text-glow uppercase">
        @{profile.username}
      </motion.p>
      <motion.h1
        variants={rise}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="text-[clamp(3.5rem,11vw,9rem)] leading-[0.9] font-semibold tracking-[-0.045em] text-balance"
      >
        {profile.name}
      </motion.h1>
      <motion.div variants={rise} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="mt-2">
        <SocialLinks variant="compact" />
      </motion.div>
    </motion.div>
  )
}

export function ScrollHint() {
  return (
    <div className="flex flex-col items-center gap-3 text-mist" aria-hidden>
      <span className="font-mono text-[0.7rem] tracking-[0.3em] uppercase">Scroll</span>
      <span className="relative h-12 w-px overflow-hidden bg-white/10">
        <motion.span
          className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-transparent to-glow"
          animate={{ y: ['-100%', '200%'] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: [0.65, 0, 0.35, 1] }}
        />
      </span>
    </div>
  )
}
