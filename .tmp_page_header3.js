const fs=require('fs'); 
const p='src/components/ui/page-header.tsx'; 
let t=fs.readFileSync(p,'utf8'); 
t=t.replace('className={cn(\"sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 pt-safe\", className)}','className={cn(\"app-page-header gap-4 sm:px-6\", className)}'); 
