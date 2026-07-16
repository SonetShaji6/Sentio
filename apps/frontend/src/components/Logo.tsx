import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  className?: string;
  imageClassName?: string;
  withLink?: boolean;
}

export function Logo({
  className,
  imageClassName,
  withLink = true,
}: LogoProps) {
  const content = (
    <div className={`flex items-center gap-2 ${className || ""}`}>
      <div className={`relative flex-shrink-0 ${imageClassName || "h-8 w-8"}`}>
        <Image
          src="/logo.jpg"
          alt="Sentio Logo"
          fill
          sizes="32px"
          className="object-contain rounded-full"
          priority
        />
      </div>
      <span className="text-xl font-bold tracking-tight text-gray-900">
        Sentio
      </span>
    </div>
  );

  if (withLink) {
    return (
      <Link
        href="/"
        className="inline-block hover:opacity-90 transition-opacity"
      >
        {content}
      </Link>
    );
  }

  return content;
}
