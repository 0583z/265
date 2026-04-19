import React, { useState, useEffect } from 'react';
import { Competition } from '../data';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Bell, ExternalLink, CalendarPlus } from 'lucide-react';
import { toast } from 'sonner';
import { downloadICS } from '../lib/CalendarUtils';

interface CompetitionCardProps {
  competition: Competition;
  onClick?: (comp: Competition) => void;
  onFollow?: (id: string) => void;
  onRegister?: (id: string) => void;
  isFollowed?: boolean;
  isRegistered?: boolean;
}

export const CompetitionCard: React.FC<CompetitionCardProps> = ({ 
  competition, 
  onClick, 
  onFollow, 
  onRegister,
  isFollowed,
  isRegistered
}) => {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const updateTimer = () => {
      const deadline = new Date(competition.deadline);
      const now = new Date();
      const diffTime = deadline.getTime() - now.getTime();
      
      if (diffTime <= 0) {
        setTimeLeft('已截止');
      } else {
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 0) {
          setTimeLeft('不足1天');
        } else {
          setTimeLeft(`${diffDays}天后截止`);
        }
      }
    };
    
    updateTimer();
    const timer = setInterval(updateTimer, 60000);
    return () => clearInterval(timer);
  }, [competition.deadline]);

  const handleAddToCalendar = (e: React.MouseEvent) => {
    e.stopPropagation();
    downloadICS({
      title: `竞赛提醒: ${competition.name}`,
      description: `详情: ${competition.description}\n报名地址: ${competition.registrationUrl}`,
      startTime: competition.deadline
    });
    toast.success('日历文件已下载', { description: '手动点击文件即可添加到系统日历' });
  };

  const handleRegister = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRegister?.(competition.id);
    window.open(competition.registrationUrl, '_blank');
  };

  const isClosed = timeLeft === '已截止';

  return (
    <Card 
      className="group border-none rounded-[28px] p-5 flex flex-col gap-4 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-300 cursor-pointer overflow-hidden relative"
      onClick={() => onClick?.(competition)}
    >
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Badge className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border-none ${isClosed ? 'bg-gray-100 text-gray-500' : 'bg-blue-50 text-blue-600'}`}>
              {competition.level}
            </Badge>
            <span className="text-[10px] font-bold text-gray-400 tracking-wider font-mono">#{competition.category}</span>
          </div>
          <h3 className="font-bold text-lg text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">
            {competition.name}
          </h3>
        </div>
      </div>
      
      <div className="flex items-center gap-2 text-sm">
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-xs ${isClosed ? 'bg-gray-50 text-gray-400' : 'bg-red-50 text-red-500 animate-pulse'}`}>
          <Clock className="w-3.5 h-3.5" />
          {timeLeft}
        </div>
        <div className="flex flex-wrap gap-1">
          {Array.isArray(competition.techStack) && competition.techStack.slice(0, 2).map((tech) => (
            <span key={tech} className="text-[10px] px-2 py-0.5 bg-gray-50 text-gray-400 rounded-full border border-gray-100 italic">
              {tech}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-2">
        <Button 
          variant="outline"
          className="rounded-2xl h-11 border-gray-100 bg-gray-50 hover:bg-blue-50 hover:border-blue-100 text-blue-600 font-bold transition-all flex items-center gap-2 text-xs"
          onClick={handleAddToCalendar}
          disabled={isClosed}
        >
          <CalendarPlus className="w-4 h-4" />
          添加到日历
        </Button>
        <Button 
          className={`rounded-2xl h-11 font-bold shadow-md transition-all text-xs flex items-center gap-2 ${isClosed ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-100'}`}
          onClick={handleRegister}
          disabled={isClosed}
        >
          <ExternalLink className="w-4 h-4" />
          {isClosed ? '已截止' : '立即报名'}
        </Button>
      </div>
    </Card>
  );
};
