export function detectBrowserInfo(): { browser: string; version: string; os: string } {
  const userAgent = navigator.userAgent;
  let browser = 'Unknown';
  let version = 'Unknown';
  let os = 'Unknown';

  // Detect browser
  if (userAgent.indexOf('Firefox') > -1) {
    browser = 'Firefox';
    version = userAgent.match(/Firefox\/(\d+\.\d+)/)?.[1] || 'Unknown';
  } else if (userAgent.indexOf('SamsungBrowser') > -1) {
    browser = 'Samsung Internet';
    version = userAgent.match(/SamsungBrowser\/(\d+\.\d+)/)?.[1] || 'Unknown';
  } else if (userAgent.indexOf('Opera') > -1 || userAgent.indexOf('OPR') > -1) {
    browser = 'Opera';
    version = userAgent.match(/(?:Opera|OPR)\/(\d+\.\d+)/)?.[1] || 'Unknown';
  } else if (userAgent.indexOf('Trident') > -1) {
    browser = 'Internet Explorer';
    version = userAgent.match(/rv:(\d+\.\d+)/)?.[1] || 'Unknown';
  } else if (userAgent.indexOf('Edge') > -1) {
    browser = 'Edge';
    version = userAgent.match(/Edge\/(\d+\.\d+)/)?.[1] || 'Unknown';
  } else if (userAgent.indexOf('Chrome') > -1) {
    browser = 'Chrome';
    version = userAgent.match(/Chrome\/(\d+\.\d+)/)?.[1] || 'Unknown';
  } else if (userAgent.indexOf('Safari') > -1) {
    browser = 'Safari';
    version = userAgent.match(/Version\/(\d+\.\d+)/)?.[1] || 'Unknown';
  }

  // Detect OS
  if (userAgent.indexOf('Windows NT 10.0') > -1) os = 'Windows 10';
  else if (userAgent.indexOf('Windows NT 6.3') > -1) os = 'Windows 8.1';
  else if (userAgent.indexOf('Windows NT 6.2') > -1) os = 'Windows 8';
  else if (userAgent.indexOf('Windows NT 6.1') > -1) os = 'Windows 7';
  else if (userAgent.indexOf('Windows NT 6.0') > -1) os = 'Windows Vista';
  else if (userAgent.indexOf('Windows NT 5.1') > -1) os = 'Windows XP';
  else if (userAgent.indexOf('Windows') > -1) os = 'Windows';
  else if (userAgent.indexOf('Mac OS X') > -1) {
    const macVersion = userAgent.match(/Mac OS X (\d+[\._]\d+)/)?.[1];
    os = `macOS ${macVersion?.replace(/_/g, '.') || 'Unknown'}`;
  } else if (userAgent.indexOf('Android') > -1) {
    const androidVersion = userAgent.match(/Android (\d+\.\d+)/)?.[1];
    os = `Android ${androidVersion || 'Unknown'}`;
  } else if (userAgent.indexOf('iOS') > -1 || userAgent.indexOf('iPhone') > -1 || userAgent.indexOf('iPad') > -1) {
    const iosVersion = userAgent.match(/OS (\d+_\d+)/)?.[1];
    os = `iOS ${iosVersion?.replace(/_/g, '.') || 'Unknown'}`;
  } else if (userAgent.indexOf('Linux') > -1) os = 'Linux';

  return { browser, version, os };
}

export function detectDeviceInfo(): {
  type: 'mobile' | 'tablet' | 'desktop';
  os: string;
  screenResolution: string;
} {
  const userAgent = navigator.userAgent;
  let type: 'mobile' | 'tablet' | 'desktop' = 'desktop';
  let os = 'Unknown';

  // Detect device type
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
    if (/iPad|Android(?!.*Mobile)/i.test(userAgent)) {
      type = 'tablet';
    } else {
      type = 'mobile';
    }
  }

  // Detect OS (simplified)
  if (/Windows/i.test(userAgent)) os = 'Windows';
  else if (/Mac OS/i.test(userAgent)) os = 'macOS';
  else if (/Android/i.test(userAgent)) os = 'Android';
  else if (/iOS|iPhone|iPad/i.test(userAgent)) os = 'iOS';
  else if (/Linux/i.test(userAgent)) os = 'Linux';

  // Get screen resolution
  const screenResolution = `${window.screen.width}x${window.screen.height}`;

  return { type, os, screenResolution };
}

export function getViewportInfo(): {
  width: number;
  height: number;
  scrollX: number;
  scrollY: number;
} {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    scrollX: window.scrollX,
    scrollY: window.scrollY,
  };
}