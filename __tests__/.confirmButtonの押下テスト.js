import fs from 'fs';
import path from 'path';
import { initializeEventListeners } from '../events.js';

test('confirmButtonを押下すると、ボタンや画面が正しく切り替わる', (done) => {
  const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
  document.body.innerHTML = html;

  initializeEventListeners();

  const confirmButton = document.getElementById('confirmButton');
  if (!confirmButton) {
    console.error('Confirm button not found');
    return;
  }

  // ボタンクリック前の logScreen のスタイルを確認
  // console.log('Before click logScreen display:', document.getElementById('logScreen').style.display);

  confirmButton.click();

  // 少し待機してから結果を確認
  setTimeout(() => {
    const logScreenDisplay = document.getElementById('logScreen').style.display;
    // console.log('After click logScreen display:', logScreenDisplay);

    expect(confirmButton.style.display).toBe('none');
    expect(document.getElementById('backButton').style.display).toBe('block');
    expect(logScreenDisplay).toBe('flex');

    done(); // テストの終了を通知
  }, 400); // アニメーションが終わるまでの時間を少し長めに設定
});
