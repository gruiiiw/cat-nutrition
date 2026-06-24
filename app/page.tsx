import Link from 'next/link';
import Image from 'next/image';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <div className="flex min-h-full flex-col">
      <main className="flex-1">
        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="hero-gradient relative overflow-hidden px-4 pb-24 pt-28 text-center sm:pb-32 sm:pt-36">
          {/* Decorative floating shapes */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
            <div className="absolute right-1/4 top-1/3 h-56 w-56 rounded-full bg-accent/10 blur-3xl" />
            <div className="absolute bottom-0 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-3xl">
            {/* Pill badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              Pricing information from 4 retailers
            </div>

            <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
              Let&apos;s Feed{' '}
              <span className="gradient-text">Your Cat!</span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Nutrition analysis with price tracking.
              Find food that meets your cat needs, and your budget.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/chat"
                className="group inline-flex h-13 items-center justify-center gap-2 rounded-xl bg-primary px-8 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 hover:brightness-110"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                AI Cat Nutritionist
                <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </Link>
              <Link
                href="/quiz"
                className="inline-flex h-13 items-center justify-center rounded-xl border-2 border-border bg-background/80 px-8 text-base font-semibold backdrop-blur-sm transition-all hover:border-primary/30 hover:bg-secondary"
              >
                Take the Quiz
              </Link>
              <Link
                href="/browse"
                className="inline-flex h-13 items-center justify-center rounded-xl border-2 border-border bg-background/80 px-8 text-base font-semibold backdrop-blur-sm transition-all hover:border-primary/30 hover:bg-secondary"
              >
                Browse All Foods
              </Link>
            </div>

            <div className="mt-5 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground sm:gap-8">
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                AI-powered recommendations
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Personalized to your cat
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                Browse the full database
              </span>
            </div>
          </div>
        </section>

        {/* ── How It Works ────────────────────────────────────── */}
        <section className="px-4 py-20 sm:py-24">
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-primary">
                Simple &amp; Transparent
              </p>
              <h2 className="mt-2 text-3xl font-bold sm:text-4xl">
                How It Works
              </h2>
            </div>

            <div className="mt-14 grid gap-8 md:grid-cols-3">
              {[
                {
                  step: '01',
                  title: 'Tell Us About Your Cat',
                  desc: "Just chat naturally about your cat — age, weight, health issues, foods they've tried, your budget. Or take the quick quiz instead.",
                  icon: (
                    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                  ),
                },
                {
                  step: '02',
                  title: 'We Analyze the Data',
                  desc: 'We calculate calorie needs, optimal nutrient ranges, and match foods using dry matter basis analysis.',
                  icon: (
                    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" /></svg>
                  ),
                },
                {
                  step: '03',
                  title: 'Get Matched Foods',
                  desc: "See foods ranked by how well they match your cat's needs, with live prices from Chewy, Amazon, PetSmart, and Petco.",
                  icon: (
                    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
                  ),
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="card-hover group relative rounded-2xl border bg-card p-8"
                >
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    {item.icon}
                  </div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-widest text-primary/60">
                    Step {item.step}
                  </p>
                  <h3 className="text-lg font-bold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Divider ──────────────────────────────────────────── */}
        <div className="section-divider mx-auto max-w-4xl" />

        {/* ── Why Trust Us ────────────────────────────────────── */}
        <section className="px-4 py-20 sm:py-24">
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <h2 className="mt-2 text-3xl font-bold sm:text-4xl">
                What factors into our suggestions?
              </h2>
            </div>

            <div className="mt-14 grid gap-5 sm:grid-cols-2">
              {[
                {
                  title: 'Dry Matter Basis Analysis',
                  desc: 'We convert all nutrition data to dry matter basis so you can compare wet and dry foods on equal footing.',
                  icon: (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
                  ),
                },
                {
                  title: 'Price Tracking Across 4 Retailers',
                  desc: 'We track prices from Chewy, Amazon, PetSmart, and Petco so you always find the best deal.',
                  icon: (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  ),
                },
                {
                  title: 'Recall Monitoring',
                  desc: 'We monitor the FDA recall database so you always know if a brand has had safety issues.',
                  icon: (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
                  ),
                },
                {
                  title: 'No Sponsored Results',
                  desc: 'Rankings are purely nutritional. We use affiliate links for revenue but they never influence recommendations.',
                  icon: (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" /></svg>
                  ),
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="card-hover flex gap-4 rounded-2xl border bg-card p-6"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="font-bold">{item.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Bottom CTA ──────────────────────────────────────── */}
        <section className="px-4 pb-20">
          <div className="mx-auto max-w-3xl rounded-3xl bg-primary/5 p-10 text-center sm:p-14">
            <h2 className="text-2xl font-bold sm:text-3xl">
              Ready to find the perfect food?
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
              Tell us about your cat and we&apos;ll find the best food
              for their needs and your budget.
            </p>
            <Link
              href="/chat"
              className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-8 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 hover:brightness-110"
            >
              Start Chatting
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
          </div>
        </section>
      </main>

      <Footer />

      {/* Mochi — peeking from the bottom-right corner */}
      <div
        className="pointer-events-none fixed -bottom-24 right-4 z-50 hidden md:block"
      >
        <Image
          src="/mochi2.png"
          alt="Mochi the cat peeking from the corner"
          width={300}
          height={360}
          className="drop-shadow-2xl"
          priority
        />
      </div>
    </div>
  );
}
