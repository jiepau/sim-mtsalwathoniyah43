import { Building2, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function Footer() {
  const [activeTAYear, setActiveTAYear] = useState<string | null>(null);

  useEffect(() => {
    const fetchActiveTA = async () => {
      const { data } = await supabase
        .from('tahun_ajaran')
        .select('nama_ta')
        .eq('is_active', true)
        .limit(1)
        .single();
      
      if (data?.nama_ta) {
        // Extract year from nama_ta like "2024/2025"
        const years = data.nama_ta.match(/\d{4}/g);
        if (years && years.length >= 2) {
          setActiveTAYear(years[1]); // Use second year (e.g., 2025 from 2024/2025)
        } else if (years && years.length === 1) {
          setActiveTAYear(years[0]);
        }
      }
    };

    fetchActiveTA();
  }, []);

  const displayYear = activeTAYear || new Date().getFullYear().toString();

  return (
    <footer className="mt-auto border-t border-border bg-card/50 backdrop-blur-sm">
      <div className="px-4 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          {/* Left side - Madrasah info */}
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <span>
              <span className="font-medium text-foreground">© {displayYear} MTs AL WATHONIYAH 43</span>
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
