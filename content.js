(function() {
  const currentHost = window.location.hostname.toLowerCase();

  chrome.storage.local.get(['domains', 'schedules', 'unlockedUntil'], (data) => {
    const domains = data.domains || ['bbc.com', 'bbc.co.uk', 'x.com', 'linkedin.com', 'theguardian.com', 'cnn.com', 'reddit.com'];
    const schedules = data.schedules || [{ startTime: "11:00", endTime: "03:00" }];
    const unlockedUntil = data.unlockedUntil || 0;

    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    // 1. Check if host is on the master site list
    const isDomainListed = domains.some(domain => domain && currentHost.includes(domain.toLowerCase()));

    // Helper to parse time string "HH:MM" or legacy hour number into total minutes
    function parseToMinutes(timeVal, defaultVal) {
      if (typeof timeVal === 'string' && timeVal.includes(':')) {
        const [h, m] = timeVal.split(':').map(Number);
        return (h * 60) + (m || 0);
      }
      if (typeof timeVal === 'number') {
        return timeVal * 60;
      }
      return defaultVal;
    }

    // 2. Time checking logic in minutes
    function isTimeBlocked(startMins, endMins, current) {
      if (startMins > endMins) return current >= startMins || current < endMins; // Overnight
      if (startMins < endMins) return current >= startMins && current < endMins; // Same day
      return true; // 24-hour block if start === end
    }

    // 3. Check if ANY configured time schedule is active
    const isAnyScheduleActive = schedules.some(s => {
      const startMins = parseToMinutes(s.startTime ?? s.startHour, 11 * 60);
      const endMins = parseToMinutes(s.endTime ?? s.endHour, 3 * 60);
      return isTimeBlocked(startMins, endMins, currentMins);
    });

    // 4. Check if puzzle unlock timer is active
    const isUnlocked = Date.now() < unlockedUntil;

    // Trigger redirection if site is listed, schedule is active, and puzzle isn't unlocked
    if (isDomainListed && isAnyScheduleActive && !isUnlocked) {
      const redirectUrl = chrome.runtime.getURL("puzzle.html") + "?target=" + encodeURIComponent(window.location.href);
      window.location.replace(redirectUrl);
    }
  });
})();