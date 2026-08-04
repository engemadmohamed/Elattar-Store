interface LogoProps {
  className?: string;
}

export default function Logo({ className = "h-9 w-9" }: LogoProps) {
  return (
    <div className={`relative overflow-hidden rounded-xl shadow-sm bg-white flex items-center justify-center shrink-0 ${className}`}>
      <img
        src="/mohandes-logo.png"
        alt="المهندس"
        className="h-full w-full object-contain p-0.5"
      />
    </div>
  );
}
