import { Building2, Heart } from "lucide-react";
import { APP_VERSION, APP_BUILD_DATE } from "@/config/version";

const APP_YEAR = "2026";

const buildDateLabel = new Date(APP_BUILD_DATE).toLocaleDateString('id-ID', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 lg:left-64 z-30 h-12 border-t border-border bg-card/95 backdrop-blur-md shadow-[0_-1px_3px_rgba(0,0,0,0.04)]">
      <div className="h-full px-4 lg:px-8">
        <div className="h-full flex items-center justify-between gap-3 text-sm text-muted-foreground">
          {/* Left side - Madrasah info */}
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <span>
              <span className="font-medium text-foreground">© {APP_YEAR} MTs AL WATHONIYAH 43</span>
              <span className="mx-2 text-border">|</span>
              <span className="text-xs">v{APP_VERSION}</span>
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
            <span className="hidden sm:inline">Dibuat dengan</span>
            <Heart className="h-3.5 w-3.5 text-destructive fill-destructive animate-pulse" />
            <span className="hidden sm:inline">untuk pendidikan Indonesia</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
