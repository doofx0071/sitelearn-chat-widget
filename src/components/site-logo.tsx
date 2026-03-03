import Image from "next/image";

import { cn } from "@/lib/utils";

interface SiteLogoProps {
  className?: string;
  mode?: "auto" | "light" | "dark" | "inverted";
}

export function SiteLogo({ className, mode = "auto" }: SiteLogoProps) {
  if (mode === "light") {
    return (
      <span className={cn("relative inline-flex", className)}>
        <Image
          src="/logo/lightmode-sitelearn.svg"
          alt="SiteLearn"
          fill
          sizes="32px"
          className="object-contain"
        />
      </span>
    );
  }

  if (mode === "dark") {
    return (
      <span className={cn("relative inline-flex", className)}>
        <Image
          src="/logo/darkmode-sitelearn.svg"
          alt="SiteLearn"
          fill
          sizes="32px"
          className="object-contain"
        />
      </span>
    );
  }

  // Inverted: opposite of auto - for panels with inverted theming
  if (mode === "inverted") {
    return (
      <span className={cn("relative inline-flex", className)}>
        <Image
          src="/logo/darkmode-sitelearn.svg"
          alt="SiteLearn"
          fill
          sizes="32px"
          className="object-contain dark:hidden"
        />
        <Image
          src="/logo/lightmode-sitelearn.svg"
          alt="SiteLearn"
          fill
          sizes="32px"
          className="hidden object-contain dark:block"
        />
      </span>
    );
  }

  // Auto: follows global theme
  return (
    <span className={cn("relative inline-flex", className)}>
      <Image
        src="/logo/lightmode-sitelearn.svg"
        alt="SiteLearn"
        fill
        sizes="32px"
        className="object-contain dark:hidden"
      />
      <Image
        src="/logo/darkmode-sitelearn.svg"
        alt="SiteLearn"
        fill
        sizes="32px"
        className="hidden object-contain dark:block"
      />
    </span>
  );
}
