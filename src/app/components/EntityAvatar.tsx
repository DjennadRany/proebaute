import { BadgeCheck } from 'lucide-react';
import { cn } from './ui/utils';

type EntityAvatarProps = {
  name: string;
  imageSrc?: string | null;
  verified?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const sizeMap = {
  sm: 'h-10 w-10 text-sm',
  md: 'h-14 w-14 text-lg',
  lg: 'h-20 w-20 text-2xl',
};

export function EntityAvatar({
  name,
  imageSrc,
  verified = false,
  size = 'md',
  className,
}: EntityAvatarProps) {
  const safeImageSrc =
    imageSrc && !imageSrc.includes('via.placeholder.com') ? imageSrc : null;
  const initials =
    name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2) || 'PB';

  return (
    <div className={cn('relative shrink-0', className)}>
      <div
        className={cn(
          'overflow-hidden rounded-full bg-gradient-to-br from-[#e8c1b7] via-[#d9a5a5] to-[#6c5ce7] text-white font-semibold flex items-center justify-center',
          sizeMap[size],
        )}
      >
        {safeImageSrc ? (
          <img src={safeImageSrc} alt={name} className="h-full w-full object-cover" />
        ) : (
          initials
        )}
      </div>
      {verified && (
        <div className="absolute -bottom-1 -right-1 rounded-full bg-sky-500 p-1 text-white shadow-sm">
          <BadgeCheck className="h-3.5 w-3.5" />
        </div>
      )}
    </div>
  );
}

