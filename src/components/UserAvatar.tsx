import React from 'react';
import { motion } from 'motion/react';

interface UserAvatarProps {
  name: string;
  url?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ 
  name, 
  url, 
  size = 'md',
  className = ''
}) => {
  const stringToColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      '#3B82F6', // blue-500
      '#6366F1', // indigo-500
      '#8B5CF6', // violet-500
      '#EC4899', // pink-500
      '#EF4444', // red-500
      '#F59E0B', // amber-500
      '#10B981', // emerald-500
      '#06B6D4'  // cyan-500
    ];
    return colors[Math.abs(hash) % colors.length];
  };

  const sizes = {
    sm: 'w-8 h-8 text-xs rounded-lg',
    md: 'w-12 h-12 text-sm rounded-xl',
    lg: 'w-24 h-24 text-2xl rounded-[24px]',
    xl: 'w-32 h-32 text-4xl rounded-[32px]'
  };

  const bgColor = stringToColor(name);
  const initial = name.charAt(0).toUpperCase();

  return (
    <motion.div 
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`relative shrink-0 flex items-center justify-center font-black text-white shadow-xl overflow-hidden ${sizes[size]} ${className}`}
      style={{ backgroundColor: bgColor }}
    >
      {url ? (
        <img 
          src={url} 
          alt={name} 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span className="relative z-10 italic">{initial}</span>
      )}
      
      {/* Decorative Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-50"></div>
    </motion.div>
  );
};
