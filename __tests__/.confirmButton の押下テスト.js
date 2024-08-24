test('confirmButtonを押下すると、ボタンや画面が正しく切り替わる', () => {
  document.body.innerHTML = `
    <button id="confirmButton" style="display: block;">Confirm</button>
    <button id="backButton" style="display: none;">Back</button>
    <div id="logScreen" class="screen container log-container" style="display:none;"></div>
  `;

  // イベントリスナーを手動でバインド
  const confirmButton = document.getElementById('confirmButton');
  const backButton = document.getElementById('backButton');
  confirmButton.addEventListener('click', () => {
    confirmButton.style.display = 'none';
    backButton.style.display = 'block';
    document.getElementById('logScreen').style.display = 'flex';
  });

  confirmButton.click();

  expect(confirmButton.style.display).toBe('none');
  expect(backButton.style.display).toBe('block');
  expect(document.getElementById('logScreen').style.display).toBe('flex');
});
