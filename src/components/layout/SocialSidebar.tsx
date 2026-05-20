const LINKS = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61590154406784",
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.5 1.55-1.5H17V3.6c-.3-.04-1.3-.13-2.5-.13-2.5 0-4.2 1.5-4.2 4.3v2.13H7.6V13h2.7v8h3.2z" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/oldtimers._/",
    svg: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
      </svg>
    ),
  },
];

export function SocialSidebar() {
  return (
    <div className="fixed right-3 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-3 sm:flex md:right-6">
      {LINKS.map((l) => (
        <a
          key={l.label}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={l.label}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-primary shadow-sm transition hover:-translate-x-1 hover:bg-primary hover:text-[var(--color-cream)]"
        >
          <span className="block h-[18px] w-[18px]">{l.svg}</span>
        </a>
      ))}
    </div>
  );
}
