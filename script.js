document.addEventListener('DOMContentLoaded', () => {
  let logs = JSON.parse(localStorage.getItem('logs')) || [];
  let timeDisplays = JSON.parse(localStorage.getItem('timeDisplays')) || {};
  let actionHistory = [];

  const logButtons = document.querySelectorAll('.log-btn');
  const confirmButton = document.getElementById('confirmButton');
  const saveButton = document.getElementById('saveButton');
  const copyButton = document.getElementById('copyButton');
  const clearButton = document.getElementById('clearButton');
  const backButton = document.getElementById('backButton');
  const toast = document.getElementById('toast');
  const logTextarea = document.getElementById('logTextarea');
  const modal = document.getElementById('modal');
  const confirmModal = document.getElementById('confirmModal');
  const modalCloseButton = document.getElementById('modalCloseButton');
  const confirmModalCloseButton = document.getElementById('confirmModalCloseButton');
  const confirmYesButton = document.getElementById('confirmYesButton');
  const confirmNoButton = document.getElementById('confirmNoButton');
  const resetButton = document.getElementById('resetButton');
  const undoButton = document.getElementById('undoButton');
  const noteCard = document.getElementById('noteCard');

  const timePickerModal = document.getElementById('timePickerModal');
  const timePickerOkButton = document.getElementById('timePickerOkButton');
  const timeInput = document.getElementById('timeInput');

  const hourHand = document.querySelector('.hour-hand');
  const minuteHand = document.querySelector('.minute-hand');


  // 時刻表示をローカルストレージに保存する関数
  function saveTimeDisplays() {
    localStorage.setItem('timeDisplays', JSON.stringify(timeDisplays));
  }

  logButtons.forEach((button) => {
    button.textContent = '🐈';

    button.addEventListener('click', () => {
      // 操作履歴を保存
      actionHistory.push({
        logs: [...logs],
        timeDisplays: { ...timeDisplays }
      });

      // 現在の時刻を取得し、1時間後の時刻を計算
      const currentTime = new Date();
      const futureTime = new Date(currentTime.getTime() + 60 * 60 * 1000); // 1時間後
      const time = futureTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

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

      const logEntry = `${paddedAreaTitle} ${paddedChannelName} ${time.substring(0, 5)}`;
      logs.push(logEntry);
      logTextarea.value = logs.join('\n');
      localStorage.setItem('logs', JSON.stringify(logs));

      button.textContent = '⏳🐈';

      let timeDisplay = logLabel.querySelector('.time-display');
      if (!timeDisplay) {
        timeDisplay = document.createElement('div');
        timeDisplay.className = 'time-display';
        logLabel.appendChild(timeDisplay);
      }
      timeDisplay.innerHTML = `⏰${time.substring(0, 5)}`; // 表示上は時：分のみ

      // ローカルストレージに時刻を保存
      const key = `${areaTitle}_${channelName}`;
      timeDisplays[key] = time;
      saveTimeDisplays();

      showToast(`${areaTitle} ${channelName}のログを追加しました`);

      // ノートカードを更新
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

  logTextarea.value = logs.join('\n');

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
      // アラームの設定変更や新しいアラームが設定されたときに、resetAlarmFlagsを呼び出す
      resetAlarmFlags
    }
  });

  undoButton.addEventListener('click', () => {
    if (actionHistory.length > 0) {
      const previousState = actionHistory.pop();
      logs = previousState.logs;
      timeDisplays = previousState.timeDisplays;
      logTextarea.value = logs.join('\n');
      saveTimeDisplays();

      // ページ上の表示を更新
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

      // ノートカードを更新
      updateNoteCard();
    } else {
      showToast('戻る操作はできません');
    }
  });

  let orderedLogEntries = [];

  function collectAndSortLogEntries() {
    const logEntries = [];
    const now = new Date();
    document.querySelectorAll('.log-label').forEach(label => {
      const timeDisplay = label.querySelector('.time-display');
      if (timeDisplay) {
        const internalTimeString = timeDisplays[`${label.closest('.area-tile').querySelector('.area-title').textContent.replace('（時刻順）', '')}_${label.childNodes[0].nodeValue.trim()}`];
        const channelName = label.childNodes[0].nodeValue.trim();
        const areaName = label.closest('.area-tile').querySelector('.area-title').textContent.replace('（時刻順）', '');

        const displayTime = internalTimeString.substring(0, 5);
        const logTime = new Date(now.toDateString() + ' ' + internalTimeString); // ログの時刻をDateオブジェクトに変換

        let entryClass = '';
        if (logTime < now) {
          entryClass = 'past-log'; // 現在時刻より前の場合
        } else if (logTime > now && (logTime - now) <= 5 * 60 * 1000) {
          entryClass = 'soon-log'; // 現在時刻より後で5分以内の場合
        }

        logEntries.push({ time: internalTimeString, area: areaName, text: `${areaName} ${displayTime} ${channelName}`, logTime, class: entryClass });
      }
    });

    // 秒単位でソート
    logEntries.sort((a, b) => a.time.localeCompare(b.time));

    // ソートされた結果を外部参照可能な変数に保存
    orderedLogEntries = logEntries;

    // 最も近い未来のエントリを太字にする
    const futureEntries = orderedLogEntries.filter(entry => entry.logTime > now);
    if (futureEntries.length > 0) {
      futureEntries[0].class += ' closest-log';
    }
  }

  function updateNoteCard() {
    // ログの収集とソート
    collectAndSortLogEntries();

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
    if (formattedEntries.length > 0) {
      noteCard.innerHTML = formattedEntries.join(' → ').replace(/ → <hr>/g, '<hr>').replace(/<hr> → /g, '<hr>');
      noteCard.classList.add('active');
    } else {
      noteCard.innerHTML = '';
      noteCard.classList.remove('active');
    }
  }
  // 5秒ごとにnoteCardを更新
  setInterval(updateNoteCard, 5000);

  // ページロード時にノートカードを更新
  updateNoteCard();
  
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
  
    // 表示上は時：分のみ
    timeDisplay.innerHTML = `⏰${newTime.substring(0, 5)}`;
  
    // 内部的に秒を含む時間を保存
    timeDisplays[key] = newTime;
    saveTimeDisplays();
  
    // モーダルを閉じる
    timePickerModal.style.display = 'none';
  
    // ノートカードを更新
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
    localStorage.setItem('logs', JSON.stringify(logs));
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
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  toast.addEventListener('click', () => {
    toast.className = 'toast';
  });

  document.addEventListener('keydown', (e) => {
    // ESCキーでモーダルを閉じる処理
    if (e.key === 'Escape') {
      closeModal();
      closeConfirmModal();
    }

    // CTRL + Z で undoButton をトリガー
    if (e.ctrlKey && e.key === 'z') {
      e.preventDefault(); // デフォルトの動作を無効にする（ブラウザの「戻る」など）
      undoButton.click();  // undoButton のクリックイベントをトリガー
    }
  });

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
    confirmModal.style.display = 'flex';
    confirmModal.style.animation = 'modalFadeInBackground 0.3s forwards';
    document.querySelector('#confirmModal .modal-content').style.animation = 'modalContentFadeIn 0.3s forwards';
  }

  function closeConfirmModal() {
    confirmModal.style.display = 'none';
  }

  function closeModal() {
    modal.style.display = 'none';
  }

  function showToast(message) {
    toast.textContent = message;
    toast.className = 'toast show';
    setTimeout(() => {
      toast.className = 'toast';
    }, 3000);
  }

  document.querySelectorAll('.log-label').forEach(label => {
    label.addEventListener('click', () => {
      selectedChannelLabel = label;

      const timeDisplay = selectedChannelLabel.querySelector('.time-display');

      if (timeDisplay) {
        timeInput.value = timeDisplay.textContent.trim().replace('⏰', '').trim();
      } else {
        const currentTime = new Date();
        const hours = String(currentTime.getHours()).padStart(2, '0');
        const minutes = String(currentTime.getMinutes()).padStart(2, '0');
        timeInput.value = `${hours}:${minutes}`;
      }

      updateClockHands(timeInput.value);
      timePickerModal.style.display = 'flex';
    });
  });

  timeInput.addEventListener('input', () => {
    updateClockHands(timeInput.value);
  });

  function updateClockHands(time) {
    const [hours, minutes] = time.split(':').map(Number);
    const hoursDegree = ((hours % 12) / 12) * 360 + (minutes / 60) * 30;
    const minutesDegree = (minutes / 60) * 360;

    // 要素が存在する場合にのみスタイルを設定
    if (hourHand && minuteHand) {
      hourHand.style.transform = `rotate(${hoursDegree}deg)`;
      minuteHand.style.transform = `rotate(${minutesDegree}deg)`;
    }
  }

  timePickerModal.addEventListener('click', (e) => {
    if (e.target === timePickerModal) {
      timePickerModal.style.display = 'none';
    }
  });
});
