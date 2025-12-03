import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import Button from '@/components/atoms/Button';
import ApperIcon from '@/components/ApperIcon';
import { cn } from '@/utils/cn';

const TimerWidget = ({ activeTimer, onStop, onPause, onResume, className }) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!activeTimer) {
      setElapsedTime(0);
      return;
    }

    const updateElapsed = () => {
      if (activeTimer.isPaused) return;
      
      const startTime = new Date(activeTimer.startTime);
      const now = new Date();
      const pausedDuration = activeTimer.pausedDuration || 0;
      const elapsed = Math.max(0, (now - startTime - pausedDuration) / 1000);
      setElapsedTime(elapsed);
    };

    // Update immediately
    updateElapsed();

    // Update every second
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [activeTimer]);

  const formatElapsedTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (!activeTimer || !isVisible) {
    return null;
  }

  return (
    <div className={cn(
      "fixed bottom-4 right-4 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-4 min-w-80 z-40",
      className
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-semibold text-slate-900 dark:text-slate-100">Timer Running</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsVisible(false)}
          icon="X"
          className="p-1"
        />
      </div>

      <div className="mb-3">
        <div className="text-lg font-mono font-bold text-slate-900 dark:text-slate-100 mb-1">
          {formatElapsedTime(elapsedTime)}
        </div>
        <div className="text-sm text-slate-600 dark:text-slate-400 truncate">
          {activeTimer.description || 'Working on task'}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Started {formatDistanceToNow(new Date(activeTimer.startTime), { addSuffix: true })}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {activeTimer.isPaused ? (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onResume(activeTimer.Id)}
            icon="Play"
            className="flex-1"
          >
            Resume
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPause(activeTimer.Id)}
            icon="Pause"
            className="flex-1"
          >
            Pause
          </Button>
        )}
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onStop(activeTimer.Id)}
          icon="Square"
          className="flex-1 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
        >
          Stop
        </Button>
      </div>
    </div>
  );
};

export default TimerWidget;