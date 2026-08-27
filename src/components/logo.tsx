import Image from "next/image";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={`relative drop-shadow-[0_0_10px_rgba(255,255,255,0.4)] ${className}`}>
      <Image
        src="/logo.png"
        alt="Aperture Logo"
        fill
        sizes="(max-width: 768px) 100vw, 33vw"
        className="object-contain"
        priority
        unoptimized
      />
    </div>
  );
}
