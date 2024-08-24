
// ui.js
import { loadTimeDisplays, saveTimeDisplays } from './storage.js';

let timeDisplays = loadTimeDisplays();

// timeDisplays が undefined の場合、空のオブジェクトで初期化
if (!timeDisplays) {
  console.log('Initializing timeDisplays as an empty object');
  timeDisplays = {};
  saveTimeDisplays(timeDisplays); // 初期化後に保存
}

// グローバルに orderedLogEntries を定義
let orderedLogEntries = [];


export function updateNoteCard() {
  timeDisplays = loadTimeDisplays();
  // ログの収集とソート
  collectAndSortLogEntries();

  console.log('Ordered Log Entries after sorting:', orderedLogEntries);

  // `orderedLogEntries` が正しく収集されているか確認
  //    console.log('Ordered Log Entries:', orderedLogEntries);
  // ソート後に地域が変わったタイミングで区切り線を挿入し、連続した地域名を省略
  let lastArea = null;
  const formattedEntries = [];
  orderedLogEntries.forEach((entry, index) => {
    if (lastArea !== null && lastArea !== entry.area) {
      formattedEntries.push('<hr>');
      formattedEntries.push(`<span class="${entry.class}">${entry.text}</span>`);  // 新しい地域の場合は地域名を表示
    } else if (lastArea !== null && lastArea === entry.area) {
      // 同じ地域が続く場合は地域名を省略
      const shortenedText = entry.text.replace(`${entry.area} `, '');
      formattedEntries.push(`<span class="${entry.class}">${shortenedText}</span>`);
    } else {
      formattedEntries.push(`<span class="${entry.class}">${entry.text}</span>`);  // 最初のエントリの場合は地域名を表示
    }
    lastArea = entry.area;
  });

  // 最後の区切り線を除去する
  if (formattedEntries.length > 0 && formattedEntries[formattedEntries.length - 1] === '<hr>') {
    formattedEntries.pop();
  }

  // ソートされた結果を noteCard に反映
  const noteCard = document.getElementById('noteCard');
  if (formattedEntries.length > 0) {
    noteCard.innerHTML = formattedEntries.join(' → ').replace(/ → <hr>/g, '<hr>').replace(/<hr> → /g, '<hr>');
    noteCard.classList.add('active');
  } else {
    noteCard.innerHTML = '';
    noteCard.classList.remove('active');
  }
}
function collectAndSortLogEntries() {
  const logEntries = [];
  const now = new Date();

  console.log('Starting log entry collection...');

  // すべての .log-label 要素を取得
  const logLabels = document.querySelectorAll('.log-label');
  console.log('Found log labels:', logLabels);

  logLabels.forEach(label => {
    const timeDisplay = label.querySelector('.time-display');
    if (timeDisplay) {
      const areaTitle = label.closest('.area-tile').querySelector('.area-title').textContent.replace('（時刻順）', '');
      const channelName = label.childNodes[0].nodeValue.trim();
      const key = `${areaTitle}_${channelName}`;
      const internalTimeString = timeDisplays[key];

      console.log('Processing:', key, 'with internal time:', internalTimeString);

      if (internalTimeString) {
        const displayTime = internalTimeString.substring(0, 5);
        const logTime = new Date(now.toDateString() + ' ' + internalTimeString);

        let entryClass = '';
        if (logTime < now) {
          entryClass = 'past-log';// 現在時刻より前の場合
        } else if (logTime > now && (logTime - now) <= 5 * 60 * 1000) {
          entryClass = 'soon-log';// 現在時刻より後で5分以内の場合
        }

        logEntries.push({ time: internalTimeString, area: areaTitle, text: `${areaTitle} ${displayTime} ${channelName}`, logTime, class: entryClass });
      } else {
        console.log('No internal time found for key:', key);
      }
    } else {
      console.log('No time display found for label:', label);
    }
  });
  // 秒単位でソート
  logEntries.sort((a, b) => a.time.localeCompare(b.time));
  orderedLogEntries = logEntries;

  // 最も近い未来のエントリを太字にする
  const futureEntries = orderedLogEntries.filter(entry => entry.logTime > now);
  if (futureEntries.length > 0) {
    futureEntries[0].class += ' closest-log';
  }
  console.log('Final ordered log entries:', orderedLogEntries);
}

export function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = 'toast show';
  setTimeout(() => {
    toast.className = 'toast';
  }, 3000);
}