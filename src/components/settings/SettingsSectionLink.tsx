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
}

export function SettingsSectionLink({
  href,
  icon,
  label,
  description,
  badge,
  iconClassName,
}: SettingsSectionLinkProps) {
  return (
    <Link href={href} className="block group">
      <div className="flex items-center justify-between rounded-xl px-3 py-3 transition-colors duration-150 -mx-3 group-hover:bg-muted/40 group-focus-within:bg-muted/40">
        <div className="flex min-w-0 items-center gap-3">
          <div className={cn("shrink-0 text-muted-foreground", iconClassName)}>{icon}</div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{label}</p>
            {description ? <p className="truncate text-xs text-muted-foreground">{description}</p> : null}
          </div>
        </div>
        <div className="ml-2 flex shrink-0 items-center gap-2">
          {badge ? <Badge variant="secondary" className="text-[11px]">{badge}</Badge> : null}
          <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  );
}
