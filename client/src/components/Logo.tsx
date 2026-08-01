interface LogoProps {
  className?: string;
}

export default function Logo({ className = "h-9 w-9" }: LogoProps) {
  return (
    <div className={`relative overflow-hidden rounded-xl bg-black border-2 border-white/20 shadow-md flex items-center justify-center ${className}`}>
      <img
        src="/mohandes-logo.png"
        alt="المهندس"
        className="h-full w-full object-cover grayscale contrast-125"
      />
    </div>
  );
}
