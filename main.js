import { saveTimeDisplays } from './storage.js';

import { initializeEventListeners } from './events.js';

import { initializeTimePicker } from './timePicker.js';
import { updateNoteCard } from './ui.js';
import { loadTimeDisplays, loadLogs } from './storage.js';
//console.log('Main.js is running');
document.addEventListener('DOMContentLoaded', () => {
  //console.log('DOMContentLoaded event fired in main.js');



  // ローカルストレージからデータをロード
  const logs = loadLogs();
  let timeDisplays = loadTimeDisplays();
  /*
      // timeDisplays にダミーデータを設定
      timeDisplays = {
        "フォントゥナス_ch5": "10:00:00",
        "フォントゥナス_ch4": "11:00:00",
        "フォントゥナス_ch3": "12:00:00"
    };
    saveTimeDisplays(timeDisplays);  // 保存
  */
  updateNoteCard();  // noteCard を更新


  // イベントリスナーの初期化
  initializeEventListeners();

  // 時間ピッカーの初期化
  initializeTimePicker();

  // ノートカードの初期更新
  updateNoteCard();

  // 5秒ごとにノートカードを更新
  updateNoteCard(); // 最初に一度だけ呼び出す
  setInterval(updateNoteCard, 5000);
});
