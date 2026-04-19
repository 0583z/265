import React from 'react';
import { HallOfFame } from '../data';
import { Badge } from '@/components/ui/badge';
import { Trophy, Quote, MapPin } from 'lucide-react';
import { motion } from 'motion/react';

interface HallOfFameCardProps {
  entry: HallOfFame;
  onClick?: (entry: HallOfFame) => void;
}

export const HallOfFameCard: React.FC<HallOfFameCardProps> = ({ entry, onClick }) => {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="group bg-white rounded-[28px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-300 cursor-pointer overflow-hidden border border-transparent hover:border-blue-50 relative"
      onClick={() => onClick?.(entry)}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 shadow-sm">
          <Trophy className="w-6 h-6" />
        </div>
        <Badge className="bg-amber-100/50 text-amber-600 border-none font-black text-[10px] px-2.5 py-1 uppercase tracking-wider">
          {entry.year} 年度
        </Badge>
      </div>

      <div className="space-y-3">
        <h3 className="font-bold text-lg text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">
          {entry.projectName}
        </h3>
        
        <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
          <span className="text-amber-500">{entry.awardLevel}</span>
          <span>•</span>
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {entry.major}
          </div>
        </div>

        <div className="relative mt-6 pt-6 border-t border-gray-50">
          <Quote className="absolute -top-3 left-0 w-6 h-6 text-blue-500/20" />
          <div className="text-[12px] text-gray-500 font-medium leading-relaxed italic">
            <span className="font-bold text-blue-600 mr-1">关键秘籍:</span>
            {entry.keyToSuccess}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
