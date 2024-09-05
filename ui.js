
// ui.js
import { loadTimeDisplays, saveTimeDisplays, loadDisabledChannels, saveDisabledChannels } from './storage.js';

let timeDisplays = loadTimeDisplays();

// timeDisplays が undefined の場合、空のオブジェクトで初期化
if (!timeDisplays) {
  console.log('Initializing timeDisplays as an empty object');
  timeDisplays = {};
  saveTimeDisplays(timeDisplays); // 初期化後に保存
}

let orderedLogEntries = [];

export function updateNoteCard() {
  timeDisplays = loadTimeDisplays();
  collectAndSortLogEntries();

  let lastArea = null;
  const formattedEntries = [];
  orderedLogEntries.forEach((entry, index) => {
    if (lastArea !== null && lastArea !== entry.area) {
      formattedEntries.push('<hr>');
      formattedEntries.push(`<span class="${entry.class}">${entry.text}</span>`);  // 新しい地域の場合は地域名を表示
    } else if (lastArea !== null && lastArea === entry.area) {
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

  const noteCard = document.getElementById('noteCard');
  if (formattedEntries.length > 0) {
    noteCard.innerHTML = formattedEntries.join(' → ').replace(/ → <hr>/g, '<hr>').replace(/<hr> → /g, '<hr>');
    noteCard.classList.add('active');
  } else {
    noteCard.innerHTML = '';
    noteCard.classList.remove('active');
  }
}

export function collectAndSortLogEntries() {
  const logEntries = [];
  const now = new Date();

  const logLabels = document.querySelectorAll('.log-label');

  logLabels.forEach(label => {
    const timeDisplay = label.querySelector('.time-display');
    if (timeDisplay) {
      const areaTitle = label.closest('.area-tile').querySelector('.area-title').textContent.replace('（時刻順）', '');
      const channelName = label.childNodes[0].nodeValue.trim();
      const key = `${areaTitle}_${channelName}`;
      const internalTimeString = timeDisplays[key];

      if (internalTimeString) {
        const displayTime = internalTimeString.substring(0, 5);
        const logTime = new Date(now.toDateString() + ' ' + internalTimeString);

        let entryClass = '';
        const timeDifference = logTime - now;
        const fiveMinits = 5 * 60 * 1000;

        if (timeDifference > 0 && timeDifference <= fiveMinits) {
          // 今から5分以内の未来の時刻は soon-log
          entryClass = 'soon-log';
        } else if (timeDifference < 0 && Math.abs(timeDifference) <= fiveMinits) {
          // 5分以内の過去の時刻も soon-log
          entryClass = 'soon-log';
        } else if (timeDifference < 0) {
          // 5分以上過去の時刻は past-log
          entryClass = 'past-log';
        }

        logEntries.push({ time: internalTimeString, area: areaTitle, text: `${areaTitle} ${displayTime} ${channelName}`, logTime, class: entryClass });
      }
    }
  });

  logEntries.sort((a, b) => a.time.localeCompare(b.time));
  orderedLogEntries = logEntries;

  const futureEntries = orderedLogEntries.filter(entry => entry.logTime > now);
  if (futureEntries.length > 0) {
    futureEntries[0].class += ' closest-log';
  }
}

export function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = 'toast show';
  setTimeout(() => {
    toast.className = 'toast';
  }, 3000);
}

// ページロード時にボタンの状態を復元
document.addEventListener('DOMContentLoaded', () => {
  const disabledChannels = loadDisabledChannels();  // ローカルストレージから取得

  Object.keys(disabledChannels).forEach(key => {
    const [englishAreaName, channelName] = key.split('_');
    const logButtonId = `#logButton${englishAreaName}${channelName}`;
    const logButton = document.querySelector(logButtonId);

    if (logButton) {
      logButton.disabled = true;  // ボタンを無効化
      logButton.classList.add('disabled-log-btn');  // スタイルを適用
    }
  });
});

// timePickerModalの閉じるボタン
const timePickerModalCloseButton = document.getElementById('timePickerModalCloseButton');

// 閉じるボタンがクリックされたら、モーダルを非表示にする
timePickerModalCloseButton.addEventListener('click', () => {
  timePickerModal.style.display = 'none';
});