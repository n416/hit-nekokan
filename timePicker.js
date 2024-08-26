// timePicker.js

import { updateNoteCard } from './ui.js';
import { saveTimeDisplays, loadTimeDisplays } from './storage.js';
import { scheduleAlarm, muteAlarms, unmuteAlarms } from './alarmManager.js';

export function initializeTimePicker() {
  const timePickerModal = document.getElementById('timePickerModal');
  const timePickerOkButton = document.getElementById('timePickerOkButton');
  const timeInput = document.getElementById('timeInput');
  const hourHand = document.querySelector('.hour-hand');
  const minuteHand = document.querySelector('.minute-hand');
  const muteAlarmCheckbox = document.getElementById('muteAlarm');

  let selectedChannelLabel = null;
  let timeDisplays = loadTimeDisplays();

  // タイムピッカーのOKボタンが押されたときの処理
  timePickerOkButton.addEventListener('click', () => {
    if (!selectedChannelLabel) return;

    // ユーザーが入力した時刻
    const [inputHours, inputMinutes] = timeInput.value.trim().split(':').map(Number);
    let entryTime = new Date();
    entryTime.setHours(inputHours);
    entryTime.setMinutes(inputMinutes);
    entryTime.setSeconds(0); // 秒を0に設定

    const channelName = selectedChannelLabel.childNodes[0].nodeValue.trim();
    const areaName = selectedChannelLabel.closest('.area-tile').querySelector('.area-title').textContent.replace('（時刻順）', '');

    const key = `${areaName}_${channelName}`;

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
        console.log(`アラーム設定: ${alarmTime}分前に鳴らします。現在時刻: ${now}, アラーム時刻: ${alarmScheduleTime}, 残り時間: ${timeDifference/1000}秒`);
        scheduleAlarm(timeDifference, alarmTime, areaName, channelName, 'syutugen');
      }
    });
  });

  // ログラベルがクリックされたときの処理
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
