document.addEventListener('DOMContentLoaded', () => {
  let logs = JSON.parse(localStorage.getItem('logs')) || [];
  let timeDisplays = JSON.parse(localStorage.getItem('timeDisplays')) || {};
  let actionHistory = [];

  const logButtons = document.querySelectorAll('.log-btn');
  const areaTitles = document.querySelectorAll('.area-title');
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

  const alarm1min = document.getElementById('alarm1min');
  const alarm3min = document.getElementById('alarm3min');
  const alarm5min = document.getElementById('alarm5min');
  const muteAlarm = document.getElementById('muteAlarm');

  let glassSound = new Audio('glass06.mp3');
  let isAlarmPlaying = false;
  let alarmQueue = []; // 再生待ちのアラームを管理するキュー

  const alarmAudioFiles = {
    "1min": new Audio('1fungo.mp3'),
    "3min": new Audio('3fungo.mp3'),
    "5min": new Audio('5fungo.mp3'),
    "テラガード": new Audio('tera.mp3'),
    "トゥリア": new Audio('tori.mp3'),
    "アンゲロス": new Audio('ange.mp3'),
    "フォントゥナス": new Audio('fon.mp3'),
    "PVP": new Audio('PVP.mp3'),
    "ch1": new Audio('ch1.mp3'),
    "ch2": new Audio('ch2.mp3'),
    "ch3": new Audio('ch3.mp3'),
    "ch4": new Audio('ch4.mp3'),
    "ch5": new Audio('ch5.mp3'),
    "出現": new Audio('syutugen.mp3')
  };

  // 事前に全ての音声ファイルを読み込む
  Object.values(alarmAudioFiles).forEach(audio => {
    audio.preload = 'auto';
  });

  // フラグ管理用のオブジェクト
  let alarmFlags = {};

  function checkAndPlayAlarm() {
    if (muteAlarm.checked) return;

    const currentTime = new Date();
    const currentHours = currentTime.getHours();
    const currentMinutes = currentTime.getMinutes();
    const currentSeconds = currentTime.getSeconds();

    document.querySelectorAll('.log-label').forEach(label => {
      const timeDisplay = label.querySelector('.time-display');
      if (timeDisplay) {
        const timeString = timeDisplay.textContent.trim().substring(1).padStart(5, '0'); // '⏰'を除外
        const [targetHours, targetMinutes] = timeString.split(':').map(Number);

        const targetTime = new Date();
        targetTime.setHours(targetHours, targetMinutes, 0, 0);

        const diffMilliseconds = targetTime - currentTime;
        const diffMinutes = Math.floor(diffMilliseconds / 60000) + 1;

        if (diffMilliseconds < -1000 || diffMilliseconds > 5 * 60 * 1000) return; // 過去や5分以上先のアラームは無視

        const areaName = label.closest('.area-tile').querySelector('.area-title').textContent.replace('（時刻順）', '').trim();
        const channelName = label.childNodes[0].nodeValue.trim();
        const alarmKey = `${areaName}_${channelName}`;

        if (!alarmFlags[alarmKey]) {
          alarmFlags[alarmKey] = { "5min": false, "3min": false, "1min": false };
        }

        if (diffMinutes === 5 && alarm5min.checked && !alarmFlags[alarmKey]["5min"]) {
          console.log("5分前のアラームを再生キューに追加します。");
          alarmQueue.push({ areaName, channelName, timeKey: "5min", alarmKey, timeFlagKey: "5min" });
          alarmFlags[alarmKey]["5min"] = true;
        } else if (diffMinutes === 3 && alarm3min.checked && !alarmFlags[alarmKey]["3min"]) {
          console.log("3分前のアラームを再生キューに追加します。");
          alarmQueue.push({ areaName, channelName, timeKey: "3min", alarmKey, timeFlagKey: "3min" });
          alarmFlags[alarmKey]["3min"] = true;
        } else if (diffMinutes === 1 && alarm1min.checked && !alarmFlags[alarmKey]["1min"]) {
          console.log("1分前のアラームを再生キューに追加します。");
          alarmQueue.push({ areaName, channelName, timeKey: "1min", alarmKey, timeFlagKey: "1min" });
          alarmFlags[alarmKey]["1min"] = true;
        } else if (currentHours === targetHours && currentMinutes === targetMinutes && Math.abs(currentSeconds - 0) < 2) {
          console.log("設定した時刻になりました。アラームを再生します。");
          glassSound.play();
          lastPlayedArea = areaName;
        }
      }
    });

    // キューにある次のアラームを再生
    if (!isAlarmPlaying && alarmQueue.length > 0) {
      const nextAlarm = alarmQueue.shift();
      playAlarm(nextAlarm.areaName, nextAlarm.channelName, nextAlarm.timeKey, nextAlarm.alarmKey, nextAlarm.timeFlagKey);
    }
  }

  function playAlarm(areaName, channelName, timeKey, alarmKey, timeFlagKey) {
    if (isAlarmPlaying) {
      console.log("既にアラームが再生中です。新しいアラームは再生しません。");
      return;
    }

    isAlarmPlaying = true;
    console.log(`アラームを再生開始: ${areaName} ${channelName} - ${timeKey}`);

    const audioSequence = [
      alarmAudioFiles[timeKey],
      alarmAudioFiles[areaName],
      alarmAudioFiles[channelName],
      alarmAudioFiles["出現"]
    ];

    const playSequentially = (audioFiles) => {
      if (audioFiles.length === 0) {
        console.log("すべての音声ファイルを再生しました。");
        console.log("alarmQueue",alarmQueue);
        isAlarmPlaying = false;
        alarmFlags[alarmKey][timeFlagKey] = true; // フラグをここで立てる

        // キューにある次のアラームを再生
        if (alarmQueue.length > 0) {
          const nextAlarm = alarmQueue.shift();
          playAlarm(nextAlarm.areaName, nextAlarm.channelName, nextAlarm.timeKey, nextAlarm.alarmKey, nextAlarm.timeFlagKey);
        }
        return;
      }

      const audio = audioFiles.shift();
      console.log(`再生中の音声: ${audio.src}`);

      // 再生中の音声が再生完了したら次を再生
      audio.play();
      audio.addEventListener('ended', () => {
        playSequentially(audioFiles);
      });

      // エラーハンドリング: 再生に失敗した場合でも次のファイルを再生する
      audio.addEventListener('error', () => {
        console.log(`音声ファイルの再生に失敗しました: ${audio.src}`);
        playSequentially(audioFiles);
      });
    };

    // 再生シーケンスを開始
    playSequentially([...audioSequence]); // 配列のコピーを使用して、状態を保持
  }

  // アラームの設定が変更されたときにフラグをリセットする関数
  function resetAlarmFlags() {
    alarmFlags = {}; // フラグをクリアする
    console.log("アラームフラグがリセットされました");
  }

  // アラームの設定変更や新しいアラームが設定されたときに、resetAlarmFlagsを呼び出す
  resetButton.addEventListener('click', resetAlarmFlags);
  timePickerOkButton.addEventListener('click', resetAlarmFlags);

  // ページロード時に一度だけチェックを行います。
  checkAndPlayAlarm();

  // その後、毎秒チェックを行います。
  setInterval(checkAndPlayAlarm, 1000);

  muteAlarm.addEventListener('change', () => {
    const isMuted = muteAlarm.checked;
    alarm1min.disabled = isMuted;
    alarm3min.disabled = isMuted;
    alarm5min.disabled = isMuted;
  });

  let selectedChannelLabel = null;

  // 最初のユーザー操作後に音を準備する
  document.addEventListener('click', () => {
    if (!glassSound) {
      glassSound = new Audio('glass06.mp3');
    }
  }, { once: true });

  logTextarea.value = logs.join('\n');

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

      checkAndPlayAlarm(); // アラームをチェック
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

  function updateNoteCard() {
    const noteEntries = [];
    let lastArea = null;

    // ページ上に存在するすべての time-display 要素を取得して処理
    document.querySelectorAll('.log-label').forEach(label => {
      const timeDisplay = label.querySelector('.time-display');
      if (timeDisplay) {
        const timeString = timeDisplays[`${label.closest('.area-tile').querySelector('.area-title').textContent.replace('（時刻順）', '')}_${label.childNodes[0].nodeValue.trim()}`];
        const channelName = label.childNodes[0].nodeValue.trim();
        const areaName = label.closest('.area-tile').querySelector('.area-title').textContent.replace('（時刻順）', '');

        if (lastArea && lastArea === areaName) {
          noteEntries.push(`${timeString.substring(0, 5)} ${channelName}`);
        } else {
          noteEntries.push(`${timeString.substring(0, 5)} ${areaName} ${channelName}`);
          lastArea = areaName;
        }
      }
    });

    // ノートカードの内容を更新
    if (noteEntries.length > 0) {
      noteCard.innerHTML = noteEntries.join(' → ');
      noteCard.classList.add('active');
    } else {
      noteCard.innerHTML = '';
      noteCard.classList.remove('active');
    }
  }

  // ページロード時にノートカードを更新
  updateNoteCard();

  timePickerOkButton.addEventListener('click', () => {
    if (!selectedChannelLabel) return;

    // 操作履歴を保存
    actionHistory.push({
      logs: [...logs],
      timeDisplays: { ...timeDisplays }
    });

    const timeString = timeInput.value + ':00'; // 秒は 00 として追加

    const logRow = selectedChannelLabel.closest('.log-row');
    const areaTitle = logRow.closest('.area-tile').querySelector('.area-title').textContent.replace('（時刻順）', '');
    const channelName = selectedChannelLabel.childNodes[0].nodeValue.trim();

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

    const logEntry = `${paddedAreaTitle} ${paddedChannelName} ${timeString.substring(0, 5)}`;
    logs.push(logEntry);
    logTextarea.value = logs.join('\n');
    localStorage.setItem('logs', JSON.stringify(logs));

    let timeDisplay = selectedChannelLabel.querySelector('.time-display');
    if (!timeDisplay) {
      timeDisplay = document.createElement('div');
      timeDisplay.className = 'time-display';
      selectedChannelLabel.appendChild(timeDisplay);
    }
    timeDisplay.innerHTML = `⏰${timeString.substring(0, 5)}`; // 表示上は時：分のみ

    // ローカルストレージに時刻を保存
    const key = `${areaTitle}_${channelName}`;
    timeDisplays[key] = timeString;
    saveTimeDisplays();

    timePickerModal.style.display = 'none';

    showToast(`${areaTitle} ${channelName}のログを追加しました`);

    // ノートカードを更新
    updateNoteCard();

    checkAndPlayAlarm(); // アラームをチェック
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

