function leftPadZeroes(number: number, size = 2) {
  let s = String(number);
  while (s.length < size) {
    s = '0' + s;
  }
  return s;
}

export function formatTime(milliseconds: number) {
  const sec = milliseconds / 1000;
  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec / 60) % 60);
  const seconds = Math.floor(sec % 60);
  const mseconds = Math.floor(milliseconds % 1000).toString().substring(0,2).padEnd(2, '0');
  return `${leftPadZeroes(hours)}:${leftPadZeroes(minutes)}:${leftPadZeroes(seconds)}.${mseconds}`;
}