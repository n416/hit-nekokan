// timePicker.js

import { updateNoteCard } from './ui.js';
import { saveTimeDisplays, loadTimeDisplays, loadDisabledChannels, saveDisabledChannels } from './storage.js';
import { scheduleAlarm, muteAlarms, unmuteAlarms } from './alarmManager.js';
import { addLogEntry, pushToActionHistory, getLogs, setLogs, getTimeDisplays, setTimeDisplays } from './events.js'; // 共通のログ関数をインポート

export function initializeTimePicker() {
  const timePickerModal = document.getElementById('timePickerModal');
  const timePickerOkButton = document.getElementById('timePickerOkButton');
  const timePickerClearButton = document.getElementById('timePickerClearButton'); // クリアボタンを取得
  const timeInput = document.getElementById('timeInput');
  const hourHand = document.querySelector('.hour-hand');
  const minuteHand = document.querySelector('.minute-hand');
  const muteAlarmCheckbox = document.getElementById('muteAlarm');

  let selectedChannelLabel = null;

  // disabledChannelsをローカルストレージから取得
  let disabledChannels = JSON.parse(localStorage.getItem('disabledChannels')) || {};

  const areaNameMap = {
    'トゥリア': 'Turia',
    'テラガード': 'Terraguard',
    'アンゲロス': 'Angelos',
    'フォントゥナス': 'Fontunas'
  };
  const channelNameMap = {
    'ch1': 'Ch1',
    'ch2': 'Ch2',
    'ch3': 'Ch3',
    'ch4': 'Ch4',
    'ch5': 'Ch5',
    'PVP': 'PVP' // PVPはそのまま
  };

  // タイムピッカーのOKボタンが押されたときの処理
  timePickerOkButton.addEventListener('click', () => {
    if (!selectedChannelLabel) return;

    const channelName = selectedChannelLabel.childNodes[0].nodeValue.trim();
    const areaName = selectedChannelLabel.closest('.area-tile').querySelector('.area-title').textContent.replace('（時刻順）', '');
    const key = `${areaName}_${channelName}`;
    // logs と timeDisplays を取得
    const logs = getLogs();
    let timeDisplays = getTimeDisplays();

    // 操作履歴に追加
    pushToActionHistory(logs, timeDisplays);

    // タイムピッカーの操作処理
    const [inputHours, inputMinutes] = timeInput.value.trim().split(':').map(Number);
    let entryTime = new Date();
    entryTime.setHours(inputHours);
    entryTime.setMinutes(inputMinutes);
    entryTime.setSeconds(0); // 秒を0に設定

    // 調整された時刻を保存
    const newTime = entryTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

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
    saveTimeDisplays(timeDisplays);

    // ログを追加する処理を呼び出し
    addLogEntry(areaName, channelName, entryTime);

    // モーダルを閉じる
    timePickerModal.style.display = 'none';

    // ノートカードを更新
    updateNoteCard();

    // 現在時刻を取得
    const now = new Date();

    // アラームのスケジュール設定
    const alarmTimes = [1, 3, 5]; // アラームの時間（1分前、3分前、5分前）
    alarmTimes.forEach(alarmTime => {
      if (document.getElementById(`alarm${alarmTime}min`).checked) {
        const alarmScheduleTime = new Date(entryTime.getTime() - alarmTime * 60000);
        const timeDifference = alarmScheduleTime.getTime() - now.getTime();
        /*        if (timeDifference < 0) {
                  console.log(`アラーム時刻が過去のためスキップされました: ${alarmScheduleTime}`);
                } else {
                  console.log(`アラーム設定: ${alarmTime}分前に鳴らします。現在時刻: ${now}, アラーム時刻: ${alarmScheduleTime}, 残り時間: ${timeDifference/1000}秒`);
                  scheduleAlarm(timeDifference, alarmTime, areaName, channelName, 'syutugen');
                }*/
        console.log(`アラーム設定: ${alarmTime}分前に鳴らします。現在時刻: ${now}, アラーム時刻: ${alarmScheduleTime}, 残り時間: ${timeDifference / 1000}秒`);
        scheduleAlarm(timeDifference, alarmTime, areaName, channelName, 'syutugen');
      }
    });
  });

  // クリアボタンの処理
  timePickerClearButton.addEventListener('click', () => {
    if (!selectedChannelLabel) return;

    const channelName = selectedChannelLabel.childNodes[0].nodeValue.trim();
    const areaName = selectedChannelLabel.closest('.area-tile').querySelector('.area-title').textContent.replace('（時刻順）', '');
    const key = `${areaName}_${channelName}`;

    // 表示と保存された時刻をクリア
    let timeDisplay = selectedChannelLabel.querySelector('.time-display');
    if (timeDisplay) {
      selectedChannelLabel.removeChild(timeDisplay);
    }
    delete timeDisplays[key]; // ローカルストレージからも削除
    saveTimeDisplays(timeDisplays);

    timePickerModal.style.display = 'none';
    updateNoteCard();
  });

  // 「チャンネル無し」ボタンの処理
  channelToggleButton.addEventListener('click', () => {
    const disabledChannels = loadDisabledChannels();  // ローカルストレージから読み込み

    if (!selectedChannelLabel) return;

    const channelName = selectedChannelLabel.childNodes[0].nodeValue.trim();
    const areaName = selectedChannelLabel.closest('.area-tile').querySelector('.area-title').textContent.replace('（時刻順）', '');

    const mappedChannelName = channelNameMap[channelName] || channelName;
    const englishAreaName = areaNameMap[areaName] || areaName;
    const key = `${englishAreaName}_${mappedChannelName}`;
    const logButton = document.querySelector(`#logButton${englishAreaName}${mappedChannelName}`);

    if (logButton) {
      if (disabledChannels[key]) {
        delete disabledChannels[key];  // チャンネル有りに戻す
        logButton.disabled = false;
        logButton.classList.remove('disabled-log-btn');
        channelToggleButton.textContent = 'チャンネル無し';
      } else {
        disabledChannels[key] = true;  // チャンネル無しにする
        logButton.disabled = true;
        logButton.classList.add('disabled-log-btn');
        channelToggleButton.textContent = 'チャンネル有り';
      }

      saveDisabledChannels(disabledChannels);  // ローカルストレージに保存
    }
    timePickerModal.style.display = 'none';
  });

  // ログラベルがクリックされたときの処理
  document.querySelectorAll('.log-label').forEach(label => {
    label.addEventListener('click', () => {
      selectedChannelLabel = label;
      const channelName = selectedChannelLabel.childNodes[0].nodeValue.trim();
      const areaName = selectedChannelLabel.closest('.area-tile').querySelector('.area-title').textContent.replace('（時刻順）', '');

      // チャンネル名とエリア名をマップで変換
      const mappedChannelName = channelNameMap[channelName] || channelName;
      const englishAreaName = areaNameMap[areaName] || areaName;
      const key = `${englishAreaName}_${mappedChannelName}`;

      // チャンネル無し状態かどうかを確認してボタンのキャプションを変更
      if (disabledChannels[key]) {
        channelToggleButton.textContent = 'チャンネル有り';  // チャンネル無し状態の場合は「チャンネル有り」に変更
      } else {
        channelToggleButton.textContent = 'チャンネル無し';  // チャンネル有り状態の場合は「チャンネル無し」に
      }

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

  // 時間入力が変わったときに時計の針を更新
  timeInput.addEventListener('input', () => {
    updateClockHands(timeInput.value);
  });

  // 鳴らさないチェックボックスの処理
  muteAlarmCheckbox.addEventListener('change', () => {
    const alarmCheckboxes = document.querySelectorAll('#alarm1min, #alarm3min, #alarm5min');
    const isDisabled = muteAlarmCheckbox.checked;

    if (isDisabled) {
      muteAlarms();
      alarmCheckboxes.forEach(cb => cb.disabled = true);
    } else {
      unmuteAlarms();
      alarmCheckboxes.forEach(cb => cb.disabled = false);
    }
  });

  // 時計の針を更新する関数
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
}
