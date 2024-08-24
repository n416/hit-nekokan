// storage.js

export function loadLogs() {
  try {
    const logs = localStorage.getItem('logs');
    return logs ? JSON.parse(logs) : [];
  } catch (error) {
    console.error('Failed to load logs:', error);
    return [];
  }
}

export function saveLogs(logs) {
  try {
    localStorage.setItem('logs', JSON.stringify(logs));
  } catch (error) {
    console.error('Failed to save logs:', error);
  }
}
export function loadTimeDisplays() {
  try {
    const timeDisplays = localStorage.getItem('timeDisplays');
    console.log('Loaded timeDisplays:', timeDisplays);
    if (!timeDisplays || timeDisplays === "undefined") {
      return {};  // 空のオブジェクトを返す
    }
    return JSON.parse(timeDisplays);
  } catch (error) {
    console.error('Failed to load timeDisplays:', error);
    return {}; // エラーが発生した場合でも、空のオブジェクトを返す
  }
}

export function saveTimeDisplays(timeDisplays) {
  try {
    if (!timeDisplays) {
      timeDisplays = {}; // undefined の場合に空のオブジェクトで初期化
    }
    console.log('Saving Time Displays:', timeDisplays);
    localStorage.setItem('timeDisplays', JSON.stringify(timeDisplays));
  } catch (error) {
    console.error('Failed to save timeDisplays:', error);
  }
}
