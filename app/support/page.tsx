import Footer from '@/components/Footer';
import PageHeader from '@/components/PageHeader';

export const metadata = {
  title: "Support | Let's Feed Your Cat!",
  description:
    'Support our mission to help cat owners make informed nutrition decisions.',
};

export default function SupportPage() {
  return (
    <div className="flex min-h-full flex-col">
      <main className="flex-1 px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <PageHeader title="Support This Project" />

          <section className="mt-10 space-y-4">
            <h2 className="text-xl font-bold">Keeping the Lights On</h2>
            <p className="leading-relaxed text-muted-foreground">
              This site is a labor of love, but hosting, data collection, and
              development take time and resources. We use affiliate links on
              product pages to help cover costs. When you buy cat food through
              our links at Chewy, Amazon, PetSmart, or Petco, we may earn a
              small commission at no extra cost to you.
            </p>
            <p className="leading-relaxed text-muted-foreground">
              Importantly, affiliate partnerships never influence our rankings
              or recommendations. Foods are scored purely based on nutritional
              match for your cat.
            </p>
          </section>

          <section className="mt-10 space-y-4">
            <h2 className="text-xl font-bold">How You Can Help</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  title: 'Use Our Links',
                  desc: 'When you decide to purchase cat food, consider using the retailer links on our product pages. It costs you nothing extra.',
                  icon: (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.813a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L5.25 9.564" /></svg>
                  ),
                },
                {
                  title: 'Spread the Word',
                  desc: 'Tell other cat owners about us. Share the site with friends, family, or your favorite cat communities.',
                  icon: (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" /></svg>
                  ),
                },
                {
                  title: 'Report Issues',
                  desc: 'Found incorrect data or a bug? Let us know so we can fix it and make the site better for everyone.',
                  icon: (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 12.75c1.148 0 2.278.08 3.383.237 1.037.146 1.866.966 1.866 2.013 0 3.728-2.35 6.75-5.25 6.75S6.75 18.728 6.75 15c0-1.046.83-1.867 1.866-2.013A24.204 24.204 0 0112 12.75zm0 0c2.883 0 5.647.508 8.207 1.44a23.91 23.91 0 01-1.152-6.135c-.22-2.058-1.794-3.555-3.835-3.555h-6.44c-2.04 0-3.615 1.497-3.835 3.555a23.906 23.906 0 01-1.152 6.135c2.56-.932 5.324-1.44 8.207-1.44z" /></svg>
                  ),
                },
                {
                  title: 'Buy Us a Coffee',
                  desc: 'If you find the site helpful, consider a small donation to help keep it running.',
                  icon: (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
                  ),
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="card-hover flex gap-4 rounded-2xl border bg-card p-5"
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
          </section>

          <section className="mt-10 space-y-4">
            <h2 className="text-xl font-bold">Contact</h2>
            <p className="leading-relaxed text-muted-foreground">
              Have questions, suggestions, or feedback? We&apos;d love to hear
              from you.
            </p>
            <p className="text-sm italic text-muted-foreground/70">
              Contact form coming soon
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
