// alarmManager.js

let alarmQueue = [];
let isMuted = false;
let currentAlarmTimeout = null;

function playAudioSequentially(audioFiles) {
  if (audioFiles.length === 0 || isMuted) return;
  console.log('Playing:', audioFiles[0]); // 再生中のファイルをログ出力
  
  const audio = new Audio(audioFiles[0]);
  audio.play().catch(error => {
    console.error('Audio playback failed:', error);
  });

  audio.onended = () => {
    setTimeout(() => playAudioSequentially(audioFiles.slice(1)), -300); // 次の音声を再生（0.3秒のラグ）
  };
}

function scheduleAlarm(time, area, channel, messageFile, entryTime) {
  // エントリ時刻から指定した分数を引いてアラーム時刻を計算
  const alarmTime = new Date(entryTime.getTime() - (time * 60000)).getTime();

  const areaFileMap = {
    "テラガード": "tera",
    "トゥリア": "tori",
    "アンゲロス": "ange",
    "フォントゥナス": "fon"
  };

  const alarmEntry = {
    time: alarmTime,
    audioFiles: [
      `./mp3/${time}fungo.mp3`,
      `./mp3/${areaFileMap[area]}.mp3`,
      `./mp3/${channel}.mp3`,
      `./mp3/${messageFile}.mp3`
    ]
  };

  alarmQueue.push(alarmEntry);
  processAlarms();
}

function processAlarms() {
  console.log("alarmQueue",alarmQueue)

  if (currentAlarmTimeout || alarmQueue.length === 0) return;

  const now = new Date().getTime();
  alarmQueue.sort((a, b) => a.time - b.time);

  const nextAlarm = alarmQueue.shift();

  if (nextAlarm.time <= now) {
    playAudioSequentially(nextAlarm.audioFiles);
    processAlarms();
  } else {
    currentAlarmTimeout = setTimeout(() => {
      playAudioSequentially(nextAlarm.audioFiles);
      currentAlarmTimeout = null;
      processAlarms();
    }, nextAlarm.time - now);
  }
}

function clearAlarms() {
  if (currentAlarmTimeout) {
    clearTimeout(currentAlarmTimeout);
    currentAlarmTimeout = null;
  }
  alarmQueue = [];
}

function muteAlarms() {
  isMuted = true;
  clearAlarms();
}

function unmuteAlarms() {
  isMuted = false;
  processAlarms();
}

export { scheduleAlarm, muteAlarms, unmuteAlarms };
