export interface MarketSessionInfo {
  id: 'ASIA' | 'LONDON' | 'NEW_YORK';
  name: string;
  isOpen: boolean;
  startFormatted: string;
  endFormatted: string;
  timeRemainingStr: string;
  progressPercent: number; // 0 to 100
}

export interface SilverBulletWindowInfo {
  session: 'London' | 'New York';
  windowStart: string;
  windowEnd: string;
  isInsideWindow: boolean;
  timeUntilOrRemaining: string;
}

export interface TimezoneDisplay {
  label: string;
  zone: string;
  timeStr: string;
  dateStr: string;
  isMarketSessionActive?: boolean;
}

/**
 * Format a given Date in a specified IANA timezone
 */
export function formatTimeInZone(date: Date, timeZone: string, includeSeconds: boolean = true): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      second: includeSeconds ? '2-digit' : undefined,
      hour12: true,
    }).format(date);
  } catch {
    return date.toLocaleTimeString();
  }
}

export function formatDateInZone(date: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  } catch {
    return date.toLocaleDateString();
  }
}

/**
 * Computes live market sessions based on UTC standards:
 * - Tokyo / Asia: 00:00 UTC - 09:00 UTC
 * - London: 08:00 UTC - 16:30 UTC
 * - New York: 13:00 UTC - 21:00 UTC
 */
export function getMarketSessions(now: Date): MarketSessionInfo[] {
  const currentUtcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();

  const sessionsConfig = [
    { id: 'ASIA' as const, name: 'Tokyo / Asia', startMin: 0 * 60, endMin: 9 * 60, startLabel: '00:00 UTC', endLabel: '09:00 UTC' },
    { id: 'LONDON' as const, name: 'London', startMin: 8 * 60, endMin: 16 * 60 + 30, startLabel: '08:00 UTC', endLabel: '16:30 UTC' },
    { id: 'NEW_YORK' as const, name: 'New York', startMin: 13 * 60, endMin: 21 * 60, startLabel: '13:00 UTC', endLabel: '21:00 UTC' },
  ];

  return sessionsConfig.map((sess) => {
    let isOpen = false;
    let progress = 0;
    let remainingStr = '';

    const sessionDuration = sess.endMin - sess.startMin;

    if (currentUtcMinutes >= sess.startMin && currentUtcMinutes < sess.endMin) {
      isOpen = true;
      const elapsed = currentUtcMinutes - sess.startMin;
      progress = Math.min(100, Math.max(0, Math.round((elapsed / sessionDuration) * 100)));
      const remainingMin = sess.endMin - currentUtcMinutes;
      const rHours = Math.floor(remainingMin / 60);
      const rMins = remainingMin % 60;
      remainingStr = `${rHours}h ${rMins}m left`;
    } else {
      isOpen = false;
      progress = 0;
      let untilStart = sess.startMin - currentUtcMinutes;
      if (untilStart < 0) untilStart += 24 * 60;
      const uHours = Math.floor(untilStart / 60);
      const uMins = untilStart % 60;
      remainingStr = `Opens in ${uHours}h ${uMins}m`;
    }

    return {
      id: sess.id,
      name: sess.name,
      isOpen,
      startFormatted: sess.startLabel,
      endFormatted: sess.endLabel,
      timeRemainingStr: remainingStr,
      progressPercent: progress,
    };
  });
}

/**
 * Calculates whether the current time is inside the configured Silver Bullet windows
 */
export function getSilverBulletStatus(
  now: Date,
  londonStart: string = '15:00',
  londonEnd: string = '16:00',
  nyStart: string = '20:00',
  nyEnd: string = '21:00'
): { isInsideAnyWindow: boolean; windows: SilverBulletWindowInfo[]; activeWindowText: string } {
  // Convert local Bangladesh / Dhaka hours (or user configured window time)
  // Let's check against Asia/Dhaka or user's local clock
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentTotalMin = hours * 60 + minutes;

  function parseTime(tStr: string): number {
    const parts = tStr.split(':');
    const h = parseInt(parts[0] || '0', 10);
    const m = parseInt(parts[1] || '0', 10);
    return h * 60 + m;
  }

  const lStartMin = parseTime(londonStart);
  const lEndMin = parseTime(londonEnd);
  const isLondonSB = currentTotalMin >= lStartMin && currentTotalMin < lEndMin;

  const nyStartMin = parseTime(nyStart);
  const nyEndMin = parseTime(nyEnd);
  const isNySB = currentTotalMin >= nyStartMin && currentTotalMin < nyEndMin;

  const windows: SilverBulletWindowInfo[] = [
    {
      session: 'London',
      windowStart: londonStart,
      windowEnd: londonEnd,
      isInsideWindow: isLondonSB,
      timeUntilOrRemaining: isLondonSB
        ? `${lEndMin - currentTotalMin}m remaining`
        : lStartMin > currentTotalMin
        ? `Starts in ${lStartMin - currentTotalMin}m`
        : 'Closed for today',
    },
    {
      session: 'New York',
      windowStart: nyStart,
      windowEnd: nyEnd,
      isInsideWindow: isNySB,
      timeUntilOrRemaining: isNySB
        ? `${nyEndMin - currentTotalMin}m remaining`
        : nyStartMin > currentTotalMin
        ? `Starts in ${nyStartMin - currentTotalMin}m`
        : 'Closed for today',
    },
  ];

  let activeWindowText = 'Outside Silver Bullet Window';
  if (isLondonSB) activeWindowText = 'London Silver Bullet Active';
  if (isNySB) activeWindowText = 'New York Silver Bullet Active';

  return {
    isInsideAnyWindow: isLondonSB || isNySB,
    windows,
    activeWindowText,
  };
}
