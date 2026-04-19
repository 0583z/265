import React, { useState } from 'react';
import { Competition, competitions as staticCompetitions } from '../data';
import { CompetitionCard } from './CompetitionCard';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const CATEGORIES = ['全部', '程序设计', '创新创业', '数学建模', '电子/芯片', '机器人'];

interface CompetitionListProps {
  onItemClick?: (comp: Competition) => void;
  competitions?: Competition[];
}

export const CompetitionList: React.FC<CompetitionListProps> = ({ onItemClick, competitions: propCompetitions }) => {
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');

  const displayCompetitions = propCompetitions || staticCompetitions;

  const filtered = displayCompetitions.filter(comp => {
    // Defensive check to ensure name exists before calling toLowerCase
    if (!comp || !comp.name) return false;
    
    const matchesCategory = selectedCategory === '全部' || comp.category === selectedCategory;
    const matchesSearch = comp.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Search & Categories */}
      <div className="flex flex-col gap-6">
        <div className="relative w-full max-w-lg mx-auto md:mx-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input 
            placeholder="搜索你感兴趣的比赛..." 
            className="pl-12 h-14 rounded-[20px] bg-white border-none shadow-[0_4px_20px_rgb(0,0,0,0.03)] focus-visible:ring-blue-600/20 text-md"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                selectedCategory === cat 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
                  : 'bg-white text-gray-500 hover:bg-gray-50 shadow-sm border border-gray-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(comp => (
          <CompetitionCard 
            key={comp.id} 
            competition={comp} 
            onClick={onItemClick}
          />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-20 text-center flex flex-col items-center gap-4">
            <div className="text-6xl">🔍</div>
            <h3 className="text-xl font-bold text-gray-900">没找到相关比赛</h3>
            <p className="text-gray-400">试试搜索其它关键词，或者换个分类看看</p>
          </div>
        )}
      </div>
    </div>
  );
};
