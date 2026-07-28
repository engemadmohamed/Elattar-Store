interface LogoProps {
  className?: string;
}

// A small brand mark: an open notebook with a pen resting across it,
// rendered in the app's primary color so it follows light/dark theme.
export default function Logo({ className = "h-9 w-9" }: LogoProps) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="elAttarLogoGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="hsl(var(--primary))" />
          <stop offset="1" stopColor="hsl(var(--primary) / 0.75)" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#elAttarLogoGrad)" />
      {/* open notebook */}
      <path
        d="M8 13.5c0-.6.5-1 1.2-.9L19 14v16l-9.4-1.6c-.9-.1-1.6-.9-1.6-1.8V13.5Z"
        fill="white"
        fillOpacity="0.92"
      />
      <path
        d="M32 13.5c0-.6-.5-1-1.2-.9L21 14v16l9.4-1.6c.9-.1 1.6-.9 1.6-1.8V13.5Z"
        fill="white"
        fillOpacity="0.92"
      />
      <path d="M20 14v16" stroke="hsl(var(--primary))" strokeWidth="1" strokeOpacity="0.4" />
      {/* pen resting diagonally */}
      <rect
        x="-2"
        y="-1.1"
        width="24"
        height="2.2"
        rx="1.1"
        transform="translate(11 27) rotate(-32)"
        fill="hsl(var(--primary-foreground))"
        stroke="hsl(var(--primary))"
        strokeWidth="0.6"
      />
      <path
        d="M31.2 10.4l2 1.3-2.3 3.4-2-1.3 2.3-3.4Z"
        fill="hsl(var(--primary))"
      />
    </svg>
  );
}
