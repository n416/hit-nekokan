import fs from 'fs';
import path from 'path';
import { initializeEventListeners } from '../events.js';

test('logScreenの保存ボタンを押すと、logTextareaの内容がローカルストレージに保存される', () => {
  const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
  document.body.innerHTML = html;

  const logTextarea = document.getElementById('logTextarea');
  if (!logTextarea) {
    console.error('logTextarea element not found');
    return;
  }

  logTextarea.value = 'サンプルログ'; // テキストエリアに内容を設定
  // console.log('Initial logTextarea value:', logTextarea.value); // 初期値の確認

  // initializeEventListenersを呼ぶ前に確認
  // console.log('Before initializeEventListeners logTextarea value:', logTextarea.value);

  const setItemMock = jest.spyOn(Storage.prototype, 'setItem');
  initializeEventListeners();

  // initializeEventListeners呼び出し後に確認
  // console.log('After initializeEventListeners logTextarea value:', logTextarea.value);

  const saveButton = document.getElementById('saveButton');
  if (!saveButton) {
    console.error('Save button not found');
    return;
  }

  saveButton.click();

  // console.log('After click logTextarea value:', logTextarea.value);

  expect(setItemMock).toHaveBeenCalledWith('logs', JSON.stringify(['サンプルログ']));
});
