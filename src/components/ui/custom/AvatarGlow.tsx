import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface AvatarGlowProps {
    src?: string;
    alt?: string;
    fallback?: string;
    size?: "sm" | "md" | "lg" | "xl";
    className?: string;
    verified?: boolean;
}

export function AvatarGlow({ src, alt, fallback, size = "md", className, verified }: AvatarGlowProps) {
    const sizeClasses = {
        sm: "h-8 w-8",
        md: "h-12 w-12",
        lg: "h-20 w-20",
        xl: "h-32 w-32",
    };

    return (
        <div className={cn("relative inline-block", className)}>
            <div className={cn(
                "rounded-full p-[2px] bg-gradient-to-br from-pink-300 via-purple-300 to-pink-300 animate-gradient",
                sizeClasses[size]
            )}>
                <Avatar className="h-full w-full border-2 border-white">
                    <AvatarImage src={src} alt={alt} className="object-cover" />
                    <AvatarFallback>{fallback || "??"}</AvatarFallback>
                </Avatar>
            </div>
            {verified && (
                <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1 border-2 border-white text-white">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-3 h-3"
                    >
                        <path
                            fillRule="evenodd"
                            d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.491 4.491 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                            clipRule="evenodd"
                        />
                    </svg>
                </div>
            )}
        </div>
    );
}
