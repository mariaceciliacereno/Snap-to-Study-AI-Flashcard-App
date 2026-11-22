import { useState } from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
}

export function BrandLogo({ size = 'md' }: BrandLogoProps) {
  const [imgFailed, setImgFailed] = useState(false);

  const dims =
    size === 'sm'
      ? 'w-9 h-9 rounded-xl'
      : size === 'lg'
        ? 'w-14 h-14 rounded-2xl'
        : 'w-11 h-11 rounded-xl';

  return (
    <div
      className={`${dims} relative overflow-hidden bg-gradient-to-br from-violet-700 via-indigo-600 to-blue-600 flex items-center justify-center shrink-0 shadow-sm border border-indigo-200/70`}
    >
      {!imgFailed ? (
        <img
          src="/src/assets/images/snap_study_emblem_1795390085161.jpg"
          alt="Snap-to-Study AI logo"
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <svg
          viewBox="0 0 40 40"
          className="w-7 h-7 text-white"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M20 5L34 11.5L20 18L6 11.5L20 5Z"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <rect
            x="9"
            y="18"
            width="22"
            height="15"
            rx="4"
            stroke="currentColor"
            strokeWidth="2.2"
          />
          <circle
            cx="20"
            cy="25.5"
            r="4"
            stroke="currentColor"
            strokeWidth="2.2"
          />
        </svg>
      )}
    </div>
  );
}
