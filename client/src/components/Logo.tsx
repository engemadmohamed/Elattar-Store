interface LogoProps {
  className?: string;
}

// Clean B&W brand mark — always black, no color
export default function Logo({ className = "h-9 w-9" }: LogoProps) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background: pure black square */}
      <rect width="40" height="40" rx="11" fill="hsl(0 0% 7%)" />

      {/* Open notebook — left page */}
      <path
        d="M8 13.5c0-.6.5-1 1.2-.9L19 14v16l-9.4-1.6c-.9-.1-1.6-.9-1.6-1.8V13.5Z"
        fill="white"
        fillOpacity="0.95"
      />
      {/* Open notebook — right page */}
      <path
        d="M32 13.5c0-.6-.5-1-1.2-.9L21 14v16l9.4-1.6c.9-.1 1.6-.9 1.6-1.8V13.5Z"
        fill="white"
        fillOpacity="0.85"
      />
      {/* Spine */}
      <path
        d="M20 14v16"
        stroke="white"
        strokeWidth="1"
        strokeOpacity="0.4"
      />
      {/* Pen diagonal */}
      <rect
        x="-2"
        y="-1.1"
        width="24"
        height="2.2"
        rx="1.1"
        transform="translate(11 27) rotate(-32)"
        fill="white"
        fillOpacity="0.9"
        stroke="white"
        strokeWidth="0.3"
        strokeOpacity="0.3"
      />
      {/* Pen tip */}
      <path
        d="M31.2 10.4l2 1.3-2.3 3.4-2-1.3 2.3-3.4Z"
        fill="white"
        fillOpacity="0.85"
      />
    </svg>
  );
}
