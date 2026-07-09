export interface WarmupDay {
  day: number;
  limit: number;
  status: 'completed' | 'current' | 'pending';
  sent: number;
}

export interface WarmupConfig {
  startLimit: number;
  dailyIncrement: number;
  targetLimit: number;
  strategy: 'conservative' | 'balanced' | 'aggressive';
}

export const generateWarmupSchedule = (config: WarmupConfig): WarmupDay[] => {
  const schedule: WarmupDay[] = [];
  let currentLimit = config.startLimit;
  
  for (let i = 1; i <= 30; i++) {
    schedule.push({
      day: i,
      limit: currentLimit,
      status: i === 1 ? 'current' : 'pending',
      sent: 0
    });
    
    const multiplier = config.strategy === 'aggressive' ? 1.5 : config.strategy === 'balanced' ? 1.25 : 1.15;
    currentLimit = Math.min(config.targetLimit, Math.round(currentLimit * multiplier + config.dailyIncrement));
    
    if (currentLimit >= config.targetLimit && schedule.length >= 14) break;
  }
  
  return schedule;
};

export const getStrategyDetails = (strategy: string) => {
  switch (strategy) {
    case 'aggressive':
      return {
        description: 'Rapidly increases volume. Best for established domains with high trust.',
        risk: 'High',
        multiplier: '1.5x'
      };
    case 'balanced':
      return {
        description: 'Steady growth. Recommended for most professional accounts.',
        risk: 'Medium',
        multiplier: '1.25x'
      };
    case 'conservative':
    default:
      return {
        description: 'Slow and steady. Safest for new domains or IPs.',
        risk: 'Low',
        multiplier: '1.15x'
      };
  }
};
