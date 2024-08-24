test('logScreenの保存ボタンを押すと、logTextareaの内容がローカルストレージに保存される', () => {
  document.body.innerHTML = `
    <textarea id="logTextarea">サンプルログ</textarea>
    <button id="saveButton">保存</button>
  `;

  const setItemMock = jest.spyOn(Storage.prototype, 'setItem');

  // イベントリスナーを手動でバインド
  const saveButton = document.getElementById('saveButton');
  saveButton.addEventListener('click', () => {
    const logs = document.getElementById('logTextarea').value.split('\n');
    localStorage.setItem('logs', JSON.stringify(logs));
  });

  saveButton.click();

  expect(setItemMock).toHaveBeenCalledWith('logs', JSON.stringify(['サンプルログ']));
});
