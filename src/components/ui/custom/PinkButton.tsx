import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PinkButtonProps extends ButtonProps {
  glow?: boolean;
}

export function PinkButton({ className, glow, children, ...props }: PinkButtonProps) {
  return (
    <Button
      className={cn(
        "bg-primary hover:bg-primary/90 text-primary-foreground border-none rounded-full font-bold transition-all duration-200",
        glow && "shadow-[0_0_20px_hsl(var(--primary)/0.5)] hover:shadow-[0_0_30px_hsl(var(--primary)/0.7)]",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
}
