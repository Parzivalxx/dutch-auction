export function convertUnixTimeToMinutes(unix_time) {
  const minutes = Math.floor(unix_time / 60);
  const seconds = unix_time % 60;
  return `${minutes}m ${seconds}s`;
}
