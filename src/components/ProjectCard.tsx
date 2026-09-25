import { FaGithub } from 'react-icons/fa6'
import { FiArrowUpRight } from 'react-icons/fi'
import { SiNuget } from 'react-icons/si'
import type { Project, ProjectLink } from '../data/content'

const LINK_ICONS = { github: FaGithub, nuget: SiNuget, site: FiArrowUpRight }

export function ProjectIcon({ project }: { project: Project }) {
  return (
    <div className="relative mx-auto aspect-square w-[min(16rem,60vw)] md:w-[min(20rem,28vw)]">
      <div
        className="absolute inset-[12%] rounded-full opacity-60 blur-3xl"
        style={{ background: project.accent }}
        aria-hidden
      />
      <div className="glass relative flex size-full items-center justify-center overflow-hidden rounded-[22%]">
        <div
          className="absolute inset-0 opacity-40"
          style={{ background: `radial-gradient(90% 70% at 30% 20%, ${project.accent}55, transparent 65%)` }}
          aria-hidden
        />
        {project.icon ? (
          <img src={project.icon} alt="" className="relative size-3/5 object-contain" />
        ) : (
          <span
            className="relative bg-clip-text font-semibold tracking-[-0.06em] text-transparent"
            style={{
              fontSize: project.monogram.length > 2 ? 'clamp(3rem,7vw,5.5rem)' : 'clamp(4.5rem,10vw,8rem)',
              backgroundImage: `linear-gradient(160deg, #ffffff 10%, ${project.accent} 90%)`,
            }}
            aria-hidden
          >
            {project.monogram}
          </span>
        )}
      </div>
    </div>
  )
}

export function ProjectDetails({ project, index, total }: { project: Project; index: number; total: number }) {
  return (
    <article className="glass @container min-w-0 rounded-3xl p-7 md:p-10">
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs tracking-[0.18em] text-mist uppercase">
        <span className="text-glow">
          {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </span>
        <span className="h-px w-6 bg-white/20" aria-hidden />
        {project.kind}
      </p>
      {/* sized to the card, not the viewport, so long names like ObjectPoolLinter always fit */}
      <h2 className="mt-4 text-[clamp(1.5rem,9.5cqi,3.75rem)] leading-none font-semibold tracking-[-0.035em] [overflow-wrap:anywhere]">
        {project.name}
      </h2>
      <p className="mt-5 max-w-[58ch] text-[1.05rem] leading-relaxed text-pretty text-mist">{project.description}</p>
      <ul className="mt-6 flex flex-wrap gap-2">
        {project.tags.map((t) => (
          <li key={t} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-mono text-xs text-ink/75">
            {t}
          </li>
        ))}
      </ul>
      <div className="mt-8 flex flex-wrap gap-3">
        {project.links.map((l, i) => (
          <LinkButton key={l.href} link={l} primary={i === 0} />
        ))}
      </div>
    </article>
  )
}

function LinkButton({ link, primary }: { link: ProjectLink; primary: boolean }) {
  const Icon = LINK_ICONS[link.kind]
  return (
    <a
      href={link.href}
      target="_blank"
      rel="noreferrer"
      className={`group inline-flex items-center gap-2.5 rounded-full px-5 py-2.5 text-sm font-medium transition-[transform,background-color,border-color] duration-200 ease-out hover:-translate-y-0.5 active:scale-[0.97] ${
        primary ? 'bg-ink text-void hover:bg-white' : 'glass text-ink hover:border-glow/50'
      }`}
    >
      <Icon className="size-4" />
      {link.label}
      <FiArrowUpRight className="size-4 opacity-60 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </a>
  )
}
