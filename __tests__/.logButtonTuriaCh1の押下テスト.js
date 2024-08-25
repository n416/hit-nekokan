import fs from 'fs';
import path from 'path';
import { initializeEventListeners } from '../events.js';
import { updateNoteCard } from '../ui.js';

test('logButtonTuriaCh1を押下すると、関連する要素が更新される', () => {
  const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
  document.body.innerHTML = html;

  const mockDate = new Date(2024, 7, 24, 9, 0); // 2024年8月24日 09:00
  jest.useFakeTimers().setSystemTime(mockDate);

  initializeEventListeners();

  const button = document.getElementById('logButtonTuriaCh1');
  button.click();

  const logTextareaValue = document.getElementById('logTextarea').value.replace(/\s+/g, ''); // 空白を除去
  // console.log('logTextarea value:', logTextareaValue);

  expect(document.querySelector('.time-display').textContent).toBe('⏰10:00');
  expect(document.getElementById('noteCard').textContent).toContain('10:00 ch1');
  expect(logTextareaValue).toContain('トゥリアch109:00');
});
