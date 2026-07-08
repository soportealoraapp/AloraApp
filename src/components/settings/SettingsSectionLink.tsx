import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SettingsSectionLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  description?: string;
  badge?: string;
  iconClassName?: string;
  bubbleBg?: string; // custom bg for premium feel
}

export function SettingsSectionLink({
  href,
  icon,
  label,
  description,
  badge,
  iconClassName,
  bubbleBg = "bg-primary/10 border-primary/20 text-primary",
}: SettingsSectionLinkProps) {
  return (
    <Link href={href} className="group block">
      <div className="flex items-center justify-between rounded-2xl px-4 py-4 transition-all duration-200 hover:bg-secondary/40 active:scale-[0.99]">
        <div className="flex min-w-0 items-center gap-3.5">
          {/* Styled Icon Bubble */}
          <div className={cn(
            "h-10 w-10 rounded-xl border flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105", 
            bubbleBg,
            iconClassName
          )}>
            <div className="[&_svg]:h-5 [&_svg]:w-5">
              {icon}
            </div>
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{label}</p>
            {description ? <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground/80">{description}</p> : null}
          </div>
        </div>
        <div className="ml-2 flex shrink-0 items-center gap-2">
          {badge ? (
            <Badge 
              variant="secondary" 
              className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{
                background: 'linear-gradient(135deg, hsl(335 85% 76% / 0.15) 0%, hsl(280 60% 70% / 0.1) 100%)',
                color: 'hsl(var(--primary))',
                border: '1px solid hsl(335 85% 76% / 0.25)'
              }}
            >
              {badge}
            </Badge>
          ) : null}
          <ChevronRight className="h-4 w-4 text-muted-foreground/60 transition-transform duration-200 group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  );
}
