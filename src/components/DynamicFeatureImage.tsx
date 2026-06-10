/**
 * DynamicFeatureImage
 * Renders either the actual image or a beautiful CSS gradient placeholder
 * when the image is missing. Eliminates broken image links.
 */
import { useState } from 'react';
import type { ComponentType } from 'react';

interface Props {
  src: string;
  alt: string;
  icon: ComponentType<{ className?: string }>;
  color: string; // e.g. 'from-violet-500 to-purple-600'
}

export default function DynamicFeatureImage({ src, alt, icon: Icon, color }: Props) {
  const [hasError, setHasError] = useState(false);

  // Extract color names for the radial gradient accent
  const colorParts = color.replace('from-', '').replace('to-', '').split(' ');
  const accentColor = colorParts[0] || 'blue-500';

  if (hasError) {
    return (
      <div className="w-full aspect-[16/10] rounded-3xl overflow-hidden border border-slate-800 relative">
        {/* Animated gradient background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-20`} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.08)_0%,transparent_70%)]" />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Animated orbs */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-white/5 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 rounded-full bg-white/5 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${color} flex items-center justify-center shadow-2xl`}>
              <Icon className="w-12 h-12 text-white" />
            </div>
            {/* Glow effect */}
            <div className={`absolute inset-0 w-24 h-24 rounded-3xl bg-gradient-to-br ${color} blur-xl opacity-40`} />
          </div>
        </div>

        {/* Bottom label */}
        <div className="absolute bottom-4 left-4 right-4 text-center">
          <span className="text-xs text-slate-500 font-medium">{alt}</span>
        </div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="w-full group-hover:scale-105 transition-transform duration-700"
      onError={() => setHasError(true)}
    />
  );
}
