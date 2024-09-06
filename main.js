import { saveTimeDisplays } from './storage.js';
import { initializeEventListeners } from './events.js';

import { initializeTimePicker } from './timePicker.js';
import { updateNoteCard, collectAndSortLogEntries } from './ui.js';
import { loadTimeDisplays, loadLogs } from './storage.js';

document.addEventListener('DOMContentLoaded', () => {
  // ローカルストレージからデータをロード
  const logs = loadLogs();
  let timeDisplays = loadTimeDisplays();

  // イベントリスナーの初期化
  initializeEventListeners();

  // 5秒ごとにノートカードを更新
  updateNoteCard(); // 最初に一度だけ呼び出す
  setInterval(updateNoteCard, 5000);
});
