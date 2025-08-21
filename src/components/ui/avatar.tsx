import React from 'react';
import { User } from 'lucide-react';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showFallback?: boolean;
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  name = '',
  size = 'md',
  className = '',
  showFallback = true
}) => {
  const sizeClasses = {
    xs: 'w-4 h-4 text-xs',
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
    xl: 'w-12 h-12 text-lg'
  };

  const iconSizes = {
    xs: 'w-2 h-2',
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6'
  };

  // Function to get initials from name
  const getInitials = (fullName: string): string => {
    if (!fullName) return '';
    const words = fullName.trim().split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  };

  const baseClasses = `${sizeClasses[size]} rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium border border-border/20 shadow-sm`;

  // If no src and showFallback is false, return null
  if (!src && !showFallback) {
    return null;
  }

  // If we have a valid image source
  if (src) {
    return (
      <div className={`${baseClasses} ${className} overflow-hidden`}>
        <img
          src={src}
          alt={alt || name || 'Avatar'}
          className="w-full h-full object-cover"
          onError={(e) => {
            // If image fails to load, show fallback
            e.currentTarget.style.display = 'none';
            const parent = e.currentTarget.parentElement;
            if (parent) {
              const initials = getInitials(name);
              if (initials) {
                parent.innerHTML = `<span class="font-medium">${initials}</span>`;
              } else {
                parent.innerHTML = `<svg class="${iconSizes[size]}" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`;
              }
            }
          }}
        />
      </div>
    );
  }

  // Fallback: show initials or user icon
  const initials = getInitials(name);
  
  return (
    <div className={`${baseClasses} ${className}`}>
      {initials ? (
        <span className="font-medium">{initials}</span>
      ) : (
        <User className={iconSizes[size]} />
      )}
    </div>
  );
};

export default Avatar;