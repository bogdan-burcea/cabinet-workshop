export function cuttingTime(minutes){const whole=Math.max(0,Math.round(Number(minutes)||0));return Math.floor(whole/60)+':'+String(whole%60).padStart(2,'0');}
