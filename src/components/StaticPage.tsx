import { images, projects } from '../data/content'
import { HeroContent } from './Hero'
import { OutroContent } from './Outro'
import { ProjectDetails, ProjectIcon } from './ProjectCard'
import { Starfield } from './Starfield'

/** Reduced-motion layout: the same content as plain stacked sections. */
export function StaticPage() {
  return (
    <main className="relative">
      <div className="pointer-events-none fixed inset-0 opacity-60">
        <Starfield animate={false} />
      </div>
      <Section image={images[0].src} className="justify-start px-6 md:px-16 lg:px-24">
        <HeroContent entrance={false} />
      </Section>
      {projects.map((p, i) => (
        <Section key={p.name} image={images[i + 1].src} className="justify-center px-5 md:px-12" label={p.name}>
          <div className="grid w-full max-w-6xl items-center gap-8 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-14">
            <div className={i % 2 ? 'md:order-2' : ''}>
              <ProjectIcon project={p} />
            </div>
            <div className={i % 2 ? 'md:order-1' : ''}>
              <ProjectDetails project={p} index={i} total={projects.length} />
            </div>
          </div>
        </Section>
      ))}
      <Section image={images[images.length - 1].src} className="justify-center px-5" label="Contact">
        <OutroContent />
      </Section>
    </main>
  )
}

function Section({ image, className, label, children }: { image: string; className: string; label?: string; children: React.ReactNode }) {
  return (
    <section aria-label={label} className={`relative flex min-h-svh items-center py-20 ${className}`}>
      <img src={image} alt="" className="absolute inset-0 -z-10 size-full object-cover opacity-60" />
      {children}
    </section>
  )
}
