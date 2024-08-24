// timePicker.js

import { updateNoteCard } from './ui.js';
import { saveTimeDisplays, loadTimeDisplays } from './storage.js';

export function initializeTimePicker() {
  const timePickerModal = document.getElementById('timePickerModal');
  const timePickerOkButton = document.getElementById('timePickerOkButton');
  const timeInput = document.getElementById('timeInput');
  const hourHand = document.querySelector('.hour-hand');
  const minuteHand = document.querySelector('.minute-hand');

  let selectedChannelLabel = null;
  let timeDisplays = loadTimeDisplays();

  // タイムピッカーのOKボタンが押されたときの処理
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
    saveTimeDisplays(timeDisplays);

    // モーダルを閉じる
    timePickerModal.style.display = 'none';

    // ノートカードを更新
    updateNoteCard();
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

  // モーダルがクリックされたときの処理
  timePickerModal.addEventListener('click', (e) => {
    if (e.target === timePickerModal) {
      timePickerModal.style.display = 'none';
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
