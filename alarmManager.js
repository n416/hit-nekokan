// alarmManager.js

let alarmQueue = [];
let isMuted = false;
let currentAlarmTimeout = null;

function playAudioSequentially(audioFiles) {
  if (audioFiles.length === 0 || isMuted) return;

  const currentAudio = new Audio(audioFiles[0]);

  // 音声の長さを取得して次の音声再生をセット
  currentAudio.onloadedmetadata = () => {
    const duration = currentAudio.duration;

    // 次の音声を0.75秒早く再生する
    if (audioFiles.length > 1) {
      setTimeout(() => {
        playAudioSequentially(audioFiles.slice(1));
      }, (duration - 0.75) * 1000);
    }

    console.log('Playing:', audioFiles[0]); // 再生中のファイルをログ出力
    currentAudio.play().catch(error => {
      console.error('Audio playback failed:', error);
    });
  };

  currentAudio.onended = () => {
    if (audioFiles.length === 1) {
      currentAlarmTimeout = null; // 全ての音声が再生し終わったら、タイマーをクリア
    }
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
