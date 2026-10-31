import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface PreloaderProps {
    isLoading: boolean;
}

const Preloader: React.FC<PreloaderProps> = ({ isLoading }) => {
    const [shouldRender, setShouldRender] = useState(isLoading);

    useEffect(() => {
        if (isLoading) {
            setShouldRender(true);
        } else {
            // Wait for fade-out animation to complete (500ms)
            const timer = setTimeout(() => {
                setShouldRender(false);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isLoading]);

    if (!shouldRender) return null;

    return (
        <div
            className={cn(
                "fixed inset-0 z-[9999] flex items-center justify-center bg-white transition-opacity duration-700 ease-in-out",
                isLoading ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
            style={{
                background: 'radial-gradient(circle at center, #ffffff 0%, #f7f9fc 100%)'
            }}
        >
            <div className="flex flex-col items-center justify-center p-8 relative">
                {/* Background decorative elements */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
                </div>

                {/* Logo Container */}
                <div className="relative mb-10 z-10">
                    <img
                        src="/logo.jpeg"
                        alt="CIT CampusOS"
                        className="w-[336px] h-auto object-contain rounded-3xl relative animate-[fade-in-up_0.8s_ease-out_forwards]"
                    />
                </div>

                {/* Refined Progress Bar */}
                <div className="w-56 h-1 bg-gray-100 rounded-full overflow-hidden relative z-10">
                    <div className="absolute inset-0 bg-gray-200/50 w-full h-full"></div>
                    <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary/80 to-primary h-full rounded-full animate-[progress_2s_ease-in-out_infinite]"
                        style={{ width: '30%' }}
                    ></div>
                </div>

                {/* Loading Text */}
                <p className="mt-4 text-[10px] font-semibold tracking-[0.2em] text-gray-400 uppercase animate-pulse z-10">
                    Loading Experience
                </p>

                <style>{`
                  @keyframes progress {
                    0% { left: -30%; }
                    50% { left: 100%; }
                    100% { left: 100%; }
                  }
                  @keyframes fade-in-up {
                    0% { opacity: 0; transform: translateY(20px); filter: blur(5px); }
                    100% { opacity: 1; transform: translateY(0); filter: blur(0); }
                  }
                `}</style>
            </div>
        </div>
    );
};

export default Preloader;
