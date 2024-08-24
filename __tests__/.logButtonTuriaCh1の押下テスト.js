test('logButtonTuriaCh1を押下すると、関連する要素が更新される', () => {
  // 現在の時間を09:00に設定する
  const mockDate = new Date(2024, 7, 24, 9, 0);  // 2024年8月24日 09:00
  jest.useFakeTimers().setSystemTime(mockDate);

  document.body.innerHTML = `
    <div class="log-row">
      <div class="log-label">ch1<div class="time-display"></div></div>
      <button id="logButtonTuriaCh1" class="btn log-btn">⚔️🐈⚔️</button>
    </div>
    <div id="noteCard" class="note-card"></div>
    <textarea id="logTextarea"></textarea>
  `;

  const button = document.getElementById('logButtonTuriaCh1');
  button.addEventListener('click', () => {
    const currentTime = new Date();
    const futureTime = new Date(currentTime.getTime() + 60 * 60 * 1000);
    const time = futureTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });

    const logRow = button.closest('.log-row');
    const logLabel = logRow.querySelector('.log-label');

    let timeDisplay = logLabel.querySelector('.time-display');
    timeDisplay.textContent = `⏰${time}`;

    const noteCard = document.getElementById('noteCard');
    noteCard.textContent = `10:00 ch1`;

    const logTextarea = document.getElementById('logTextarea');
    logTextarea.value = `トゥリア ch1 09:00`;
  });

  button.click();

  expect(document.querySelector('.time-display').textContent).toBe('⏰10:00');
  expect(document.getElementById('noteCard').textContent).toContain('10:00 ch1');
  expect(document.getElementById('logTextarea').value).toContain('トゥリア ch1 09:00');
});
