'use client';

import React from 'react';

export const AnimatedBackground = () => {
    return (
        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-[#0a0614]">
            {/* Soft Ambient Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#CB97C0]/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#D1BBDF]/5 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-[#54444C]/5 rounded-full blur-[80px] animate-pulse" />

            {/* Mesh Gradient Effect */}
            <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150 mix-blend-overlay" />

            {/* Floating Blobs with Glass Effect */}
            <div className="absolute top-[15%] left-[15%] w-64 h-64 bg-primary-gradient rounded-full opacity-[0.08] blur-3xl animate-float" />
            <div className="absolute bottom-[20%] right-[20%] w-96 h-96 bg-[#E1DCEA]/5 rounded-full blur-3xl animate-float [animation-delay:2s]" />
            <div className="absolute middle-0 left-[40%] w-72 h-72 bg-secondary-gradient rounded-full opacity-[0.06] blur-3xl animate-float [animation-delay:4s]" />
        </div>
    );
};
