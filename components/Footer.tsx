import Link from 'next/link';

const footerLinks = [
  { href: '/about', label: 'About' },
  { href: '/support', label: 'Support' },
  { href: '/disclaimer', label: 'Disclaimer' },
  { href: '/references', label: 'References' },
];

export default function Footer() {
  return (
    <footer className="border-t bg-card/50 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          {/* Links — left side */}
          <nav className="flex gap-6">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Brand — right side */}
          <div>
            <p className="text-sm font-bold tracking-tight">
              <span className="gradient-text">Let&apos;s Feed Your Cat!</span>
            </p>
          </div>
        </div>

        <div className="section-divider mt-8" />

        <div className="mt-6 flex flex-col items-center gap-2 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="text-xs text-muted-foreground">
            &copy; 2026 Let&apos;s Feed Your Cat! All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground/70">
            This site contains affiliate links. We may earn a commission at no
            extra cost to you.
          </p>
        </div>
      </div>
    </footer>
  );
}
