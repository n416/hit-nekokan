import { updateNoteCard, showToast } from './ui.js';
import { saveLogs, loadLogs, saveTimeDisplays, loadTimeDisplays } from './storage.js';
import { initializeTimePicker } from './timePicker.js';

export function initializeEventListeners() {
  let logs = loadLogs();
  let timeDisplays = loadTimeDisplays();
  let actionHistory = [];

  const confirmButton = document.getElementById('confirmButton');
  const backButton = document.getElementById('backButton');
  const saveButton = document.getElementById('saveButton');
  const copyButton = document.getElementById('copyButton');
  const clearButton = document.getElementById('clearButton');
  const undoButton = document.getElementById('undoButton');
  const confirmModalCloseButton = document.getElementById('confirmModalCloseButton');
  const confirmYesButton = document.getElementById('confirmYesButton');
  const confirmNoButton = document.getElementById('confirmNoButton');
  const modalCloseButton = document.getElementById('modalCloseButton');
  const logTextarea = document.getElementById('logTextarea');
  const toast = document.getElementById('toast');
  const resetButton = document.getElementById('resetButton');
  const timePickerModal = document.getElementById('timePickerModal');
  const timePickerOkButton = document.getElementById('timePickerOkButton');
  const timeInput = document.getElementById('timeInput');
  const hourHand = document.querySelector('.hour-hand');
  const minuteHand = document.querySelector('.minute-hand');

  logTextarea.value = logs.length > 0 ? logs.join('\n') : logTextarea.value;

  const logButtons = document.querySelectorAll('.log-btn');
  logButtons.forEach((button) => {
    button.textContent = '🐈';

    button.addEventListener('click', () => {
      actionHistory.push({
        logs: [...logs],
        timeDisplays: { ...timeDisplays }
      });

      const currentTime = new Date();
      const futureTime = new Date(currentTime.getTime() + 60 * 60 * 1000); // 1時間後
      const currentTimeStr = currentTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const futureTimeStr = futureTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      const logRow = button.closest('.log-row');
      const logLabel = logRow.querySelector('.log-label');
      const channelName = logLabel.childNodes[0].nodeValue.trim();
      const areaTitle = button.closest('.area-tile').querySelector('.area-title').textContent.replace('（時刻順）', '');

      const padFullWidth = (str, length) => {
        let fullWidthSpace = '　'; // 全角スペース
        let currentLength = [...str].reduce((sum, char) => sum + (char.match(/[^\x00-\x7F]/) ? 2 : 1), 0);
        let spacesToAdd = (length - currentLength) / 2;

        if (spacesToAdd > 0) {
          return str + fullWidthSpace.repeat(Math.max(0, spacesToAdd));
        } else {
          return str;
        }
      };

      const maxAreaLength = 15;
      const maxChannelLength = 2;

      const paddedAreaTitle = padFullWidth(areaTitle, maxAreaLength);
      const paddedChannelName = padFullWidth(channelName, maxChannelLength);

      // logScreenに表示する時刻（ボタンを押した時刻）
      const logEntry = `${paddedAreaTitle} ${paddedChannelName} ${currentTimeStr.substring(0, 5)}`;
      logs.push(logEntry);
      logTextarea.value = logs.length > 0 ? logs.join('\n') : logTextarea.value;
      saveLogs(logs);

      button.textContent = '⏳🐈';

      // time-displayに次に出現する時刻（1時間後の時刻）を表示
      let timeDisplay = logLabel.querySelector('.time-display');
      if (!timeDisplay) {
        timeDisplay = document.createElement('div');
        timeDisplay.className = 'time-display';
        logLabel.appendChild(timeDisplay);
      }
      timeDisplay.innerHTML = `⏰${futureTimeStr.substring(0, 5)}`;

      const key = `${areaTitle}_${channelName}`;
      timeDisplays[key] = futureTimeStr;
      saveTimeDisplays(timeDisplays);

      showToast(`${areaTitle} ${channelName}のログを追加しました`);

      updateNoteCard();
    });

    button.addEventListener('mouseover', () => {
      if (button.textContent === '🐈') {
        button.textContent = '⚔️';
      }
    });

    button.addEventListener('mouseout', () => {
      if (button.textContent === '⚔️') {
        button.textContent = '🐈';
      }
    });
  });

  let selectedChannelLabel = null;

  // ページロード時に保存された時刻表示を復元
  document.querySelectorAll('.log-label').forEach(label => {
    const channelName = label.childNodes[0].nodeValue.trim();
    const areaName = label.closest('.area-tile').querySelector('.area-title').textContent.replace('（時刻順）', '');
    const key = `${areaName}_${channelName}`;

    if (timeDisplays[key]) {
      let timeDisplay = label.querySelector('.time-display');
      if (!timeDisplay) {
        timeDisplay = document.createElement('div');
        timeDisplay.className = 'time-display';
        label.appendChild(timeDisplay);
      }
      timeDisplay.innerHTML = `⏰${timeDisplays[key].substring(0, 5)}`; // 表示上は時：分のみ
    }
  });

  // リセットボタンの機能
  resetButton.addEventListener('click', () => {
    if (confirm('すべてのデータをリセットしますか？')) {
      localStorage.clear();
      location.reload();
    }
  });

  undoButton.addEventListener('click', () => {
    if (actionHistory.length > 0) {
      const previousState = actionHistory.pop();
      logs = previousState.logs;
      timeDisplays = previousState.timeDisplays;
      logTextarea.value = logs.join('\n');
      saveTimeDisplays(timeDisplays);

      document.querySelectorAll('.time-display').forEach(display => display.remove());
      document.querySelectorAll('.log-label').forEach(label => {
        const channelName = label.childNodes[0].nodeValue.trim();
        const areaName = label.closest('.area-tile').querySelector('.area-title').textContent.replace('（時刻順）', '');
        const key = `${areaName}_${channelName}`;

        if (timeDisplays[key]) {
          let timeDisplay = label.querySelector('.time-display');
          if (!timeDisplay) {
            timeDisplay = document.createElement('div');
            timeDisplay.className = 'time-display';
            label.appendChild(timeDisplay);
          }
          timeDisplay.innerHTML = `⏰${timeDisplays[key].substring(0, 5)}`; // 表示上は時：分のみ
        }
      });

      updateNoteCard();
    } else {
      showToast('戻る操作はできません');
    }
  });

  timePickerOkButton.addEventListener('click', () => {
    if (!selectedChannelLabel) return;

    const [inputHours, inputMinutes] = timeInput.value.trim().split(':').map(Number);
    let currentTime = new Date();
    currentTime.setHours(inputHours);
    currentTime.setMinutes(inputMinutes);
    currentTime.setSeconds(0); // 秒を0に設定

    const channelName = selectedChannelLabel.childNodes[0].nodeValue.trim();
    const areaName = selectedChannelLabel.closest('.area-tile').querySelector('.area-title').textContent.replace('（時刻順）', '');

    const key = `${areaName}_${channelName}`;

    // 時刻の調整を行う
    let adjustedTime = currentTime;
    while (Object.values(timeDisplays).some(storedTime => {
      const storedDate = new Date(currentTime.toDateString() + ' ' + storedTime);
      return storedDate.getHours() === adjustedTime.getHours() &&
        storedDate.getMinutes() === adjustedTime.getMinutes() &&
        storedDate.getSeconds() === adjustedTime.getSeconds();
    })) {
      adjustedTime.setSeconds(adjustedTime.getSeconds() + 1);
    }

    const newTime = adjustedTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    let timeDisplay = selectedChannelLabel.querySelector('.time-display');
    if (!timeDisplay) {
      timeDisplay = document.createElement('div');
      timeDisplay.className = 'time-display';
      selectedChannelLabel.appendChild(timeDisplay);
    }

    timeDisplay.innerHTML = `⏰${newTime.substring(0, 5)}`;

    // 特定のエントリのみ更新し、他のエントリは維持する
    timeDisplays[key] = newTime;
    saveTimeDisplays(timeDisplays);

    timePickerModal.style.display = 'none';

    updateNoteCard();
  });

  confirmButton.addEventListener('click', () => {
    switchScreen('logScreen');
    confirmButton.style.display = 'none';
    backButton.style.display = 'block';
  });

  backButton.addEventListener('click', () => {
    switchScreen('mainScreen');
    confirmButton.style.display = 'block';
    backButton.style.display = 'none';
  });

  saveButton.addEventListener('click', () => {
    logs = logTextarea.value.split('\n');
    saveLogs(logs);
    showToast('ログを保存しました');
  });

  copyButton.addEventListener('click', () => {
    logTextarea.select();
    document.execCommand('copy');
    showToast('クリップボードにコピーしました');
  });

  clearButton.addEventListener('click', () => {
    showConfirmModal();
  });

  confirmModalCloseButton.addEventListener('click', closeConfirmModal);
  confirmNoButton.addEventListener('click', closeConfirmModal);

  confirmYesButton.addEventListener('click', () => {
    logs = [];
    logTextarea.value = '';
    localStorage.removeItem('logs');
    closeConfirmModal();
    showToast('ログをクリアしました');
  });

  modalCloseButton.addEventListener('click', closeModal);
  timePickerModal.addEventListener('click', (e) => {
    if (e.target === timePickerModal) {
      timePickerModal.style.display = 'none';
    }
  });

  toast.addEventListener('click', () => {
    toast.className = 'toast';
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
      closeConfirmModal();
    }

    if (e.ctrlKey && e.key === 'z') {
      e.preventDefault();
      undoButton.click();
    }
  });

  initializeTimePicker();
}
function switchScreen(screenId) {
  const currentScreen = document.querySelector('.screen:not([style*="display: none"])');
  if (currentScreen) {
    currentScreen.style.animation = 'fadeOut 0.3s forwards';
    setTimeout(() => {
      currentScreen.style.display = 'none';
      const nextScreen = document.getElementById(screenId);
      nextScreen.style.display = 'flex';
      nextScreen.style.animation = 'fadeIn 0.3s forwards';
    }, 300);
  }
}

function showConfirmModal() {
  const confirmModal = document.getElementById('confirmModal');
  confirmModal.style.display = 'flex';
  confirmModal.style.animation = 'modalFadeInBackground 0.3s forwards';
  document.querySelector('#confirmModal .modal-content').style.animation = 'modalContentFadeIn 0.3s forwards';
}

function closeConfirmModal() {
  const confirmModal = document.getElementById('confirmModal');
  confirmModal.style.display = 'none';
}

function closeModal() {
  const modal = document.getElementById('modal');
  modal.style.display = 'none';
}
