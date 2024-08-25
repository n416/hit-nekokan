import { saveTimeDisplays } from './storage.js';
import { initializeEventListeners } from './events.js';

import { initializeTimePicker } from './timePicker.js';
import { updateNoteCard, collectAndSortLogEntries } from './ui.js';
import { loadTimeDisplays, loadLogs } from './storage.js';
//console.log('Main.js is running');
document.addEventListener('DOMContentLoaded', () => {
  //console.log('DOMContentLoaded event fired in main.js');

  // ローカルストレージからデータをロード
  const logs = loadLogs();
  let timeDisplays = loadTimeDisplays();

  // イベントリスナーの初期化
  initializeEventListeners();

  // 時間ピッカーの初期化
  initializeTimePicker();

  // 5秒ごとにノートカードを更新
  updateNoteCard(); // 最初に一度だけ呼び出す
  setInterval(updateNoteCard, 5000);
});
