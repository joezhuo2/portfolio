// All page content lives here. Swap images/icons by changing paths.

export type SocialKind = 'github' | 'linkedin' | 'instagram' | 'discord'

export interface Social {
  kind: SocialKind
  label: string
  /** shown on hover / used by the copy action for Discord */
  handle: string
  /** omitted for Discord, which has no profile URL: the button copies the handle */
  href?: string
}

export interface ProjectLink {
  label: string
  href: string
  kind: 'github' | 'nuget' | 'site'
}

export interface Project {
  name: string
  kind: string
  description: string
  tags: string[]
  links: ProjectLink[]
  /** path under public/, or omit to use the monogram tile */
  icon?: string
  monogram: string
  /** accent for the icon glow */
  accent: string
}

export const profile = {
  name: 'Joe Zhuo',
  username: 'crystalflux',
}

export const socials: Social[] = [
  { kind: 'github', label: 'GitHub', handle: 'joezhuo2', href: 'https://github.com/joezhuo2' },
  { kind: 'linkedin', label: 'LinkedIn', handle: 'joe-zhuo', href: 'https://www.linkedin.com/in/joe-zhuo' },
  { kind: 'instagram', label: 'Instagram', handle: 'jow.zh', href: 'https://www.instagram.com/jow.zh' },
  { kind: 'discord', label: 'Discord', handle: 'crystalflux' },
]

export const projects: Project[] = [
  {
    name: 'Anamnesis',
    kind: 'Game · Unity 6',
    description:
      'A 2D wave-based action roguelite. Survive escalating hordes, draft rewards between waves, gamble on corruption and anomalies, and rebuild your power through a 222-node skill tree, with every attack, effect and wave authored as ScriptableObject data.',
    tags: ['Unity 6', 'C#', 'URP 2D', 'ScriptableObjects'],
    links: [{ label: 'GitHub', href: 'https://github.com/joezhuo2/Anamnesis', kind: 'github' }],
    monogram: 'A',
    accent: '#7c9bff',
  },
  {
    name: 'ObjectPoolLinter',
    kind: 'Developer tool · Roslyn',
    description:
      'A Roslyn analyzer for Unity C# that catches allocations in hot paths like Update and FixedUpdate, then fixes them for you with object pools, cached results or non-allocating APIs. It can even generate the pool.',
    tags: ['Roslyn', 'C#', 'Unity', 'Source generator'],
    links: [
      { label: 'GitHub', href: 'https://github.com/joezhuo2/ObjectPoolLinter', kind: 'github' },
      { label: 'NuGet', href: 'https://www.nuget.org/packages/ObjectPoolLinter', kind: 'nuget' },
    ],
    monogram: 'OPL',
    accent: '#5ee1ff',
  },
  {
    name: 'Crystal OS',
    kind: 'Desktop app · React + Tauri',
    description:
      'A personal productivity dashboard: tasks, Google Calendar, finances, weather, a Pomodoro timer and a read/write view of an Obsidian vault, all behind one glassmorphic interface and one command palette.',
    tags: ['React', 'TypeScript', 'Supabase', 'Tauri'],
    links: [{ label: 'GitHub', href: 'https://github.com/joezhuo2/crystal-os', kind: 'github' }],
    monogram: 'CO',
    accent: '#a78bfa',
  },
]

/**
 * Backdrops flown through, in order. Needs projects.length + 2: one behind
 * the hero, one per project, one behind the closing socials. Generated with
 * Higgsfield (z_image); regenerate or replace freely.
 */
export const images: { src: string; alt: string }[] = [
  { src: '/images/space-01.webp', alt: '' }, // black hole, hero
  { src: '/images/space-02.webp', alt: '' }, // crimson/blue pillar nebula, Anamnesis
  { src: '/images/space-03.webp', alt: '' }, // cyan filament nebula, ObjectPoolLinter
  { src: '/images/space-04.webp', alt: '' }, // violet crystalline nebula, Crystal OS
  { src: '/images/space-05.webp', alt: '' }, // face-on black hole, outro
]
