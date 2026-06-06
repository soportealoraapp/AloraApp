'use client';

export function GradientBackground() {
    return (
        <div className="fixed inset-0 -z-50 overflow-hidden">
            <div className="absolute inset-0 bg-pink-50/50 backdrop-blur-3xl"></div>
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-pink-300/30 rounded-full blur-[100px] animate-pulse-slow"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-300/30 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        </div>
    );
}
