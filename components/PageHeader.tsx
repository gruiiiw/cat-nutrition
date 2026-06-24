import Link from 'next/link';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  gradient?: boolean;
}

export default function PageHeader({
  title,
  subtitle,
  gradient = false,
}: PageHeaderProps) {
  return (
    <div>
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to home
      </Link>

      <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">
        {gradient ? (
          <span className="gradient-text">{title}</span>
        ) : (
          title
        )}
      </h1>

      {subtitle && (
        <p className="mt-3 text-base leading-relaxed text-muted-foreground sm:text-lg">
          {subtitle}
        </p>
      )}
    </div>
  );
}
