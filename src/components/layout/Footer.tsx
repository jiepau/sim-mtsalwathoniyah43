import { Building2, Heart } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-card/50 backdrop-blur-sm">
      <div className="px-4 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          {/* Left side - Madrasah info */}
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <span>
              <span className="font-medium text-foreground">© 2025 MTs AL WATHONIYAH 43</span>
            </span>
          </div>

          {/* Center - Islamic quote */}
          <div className="text-center hidden md:block">
            <span className="italic text-xs">
              "مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ طَرِيقًا إِلَى الْجَنَّةِ"
            </span>
          </div>

          {/* Right side - Made with love */}
          <div className="flex items-center gap-1.5">
            <span>Dibuat dengan</span>
            <Heart className="h-3.5 w-3.5 text-destructive fill-destructive animate-pulse" />
            <span>untuk pendidikan Indonesia</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
