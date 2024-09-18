// storage.js
import { updateNoteCard, collectAndSortLogEntries, updateAreaCount } from './ui.js';

export function loadLogs() {
  try {
    const logs = localStorage.getItem('logs');
    return logs ? JSON.parse(logs) : [];
  } catch (error) {
    console.error('Failed to load logs:', error);
    return [];
  }
}

export function saveLogs(logs) {
  try {
    localStorage.setItem('logs', JSON.stringify(logs));
  } catch (error) {
    console.error('Failed to save logs:', error);
  }
}

export function loadTimeDisplays() {
  try {
    const timeDisplays = localStorage.getItem('timeDisplays');
    if (!timeDisplays || timeDisplays === "undefined") {
      return {};  // 空のオブジェクトを返す
    }
    return JSON.parse(timeDisplays);
  } catch (error) {
    console.error('Failed to load timeDisplays:', error);
    return {}; // エラーが発生した場合でも、空のオブジェクトを返す
  }
}

export function saveTimeDisplays(timeDisplays) {
  try {
    if (!timeDisplays) {
      timeDisplays = {}; // undefined の場合に空のオブジェクトで初期化
    }
    localStorage.setItem('timeDisplays', JSON.stringify(timeDisplays));
  } catch (error) {
    // console.error('Failed to save timeDisplays:', error);
  }
}

// ローカルストレージからdisabledChannelsを読み込む
export function loadDisabledChannels() {
  return JSON.parse(localStorage.getItem('disabledChannels')) || {};
}

// ローカルストレージにdisabledChannelsを保存する
export function saveDisabledChannels(disabledChannels) {
  localStorage.setItem('disabledChannels', JSON.stringify(disabledChannels));
}

// 各エリアごとにチャンネル数を保存する
export function saveChannelCount(areaName, channelCount) {
  const channelSettings = JSON.parse(localStorage.getItem('channelSettings')) || {};
  channelSettings[areaName] = channelCount;
  localStorage.setItem('channelSettings', JSON.stringify(channelSettings));
}

// 各エリアごとのチャンネル数を取得する
export function loadChannelCount(areaName) {
  const channelSettings = JSON.parse(localStorage.getItem('channelSettings')) || {};
  return channelSettings[areaName] || 5;  // デフォルトは1チャンネル
}

// 全エリアのチャンネル数を保存する
export function saveChannelCounts(channelCounts) {
  localStorage.setItem('channelSettings', JSON.stringify(channelCounts));
}

// 全エリアのチャンネル数を取得する
export function loadChannelCounts() {
  const channelSettings = JSON.parse(localStorage.getItem('channelSettings')) || {};
  return channelSettings;  // デフォルトは1チャンネル
}

export function generateShareableUrl() {
  const logs = loadLogs();
  const timeDisplays = loadTimeDisplays();
  const channelCounts = loadChannelCounts();
  const data = { logs, timeDisplays, channelCounts };
  
  // LZStringで圧縮
  const compressedData = LZString.compressToEncodedURIComponent(JSON.stringify(data));
  const baseUrl = window.location.origin + window.location.pathname;
  
  // 圧縮したデータをURLに追加
  return `${baseUrl}?data=${compressedData}`;
}

export function loadFromUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const compressedData = urlParams.get('data');

  if (compressedData) {
    const decompressedData = LZString.decompressFromEncodedURIComponent(compressedData);
    const data = JSON.parse(decompressedData);

    if (data) {
      saveLogs(data.logs);
      saveTimeDisplays(data.timeDisplays);
      saveChannelCounts(data.channelCounts);
      // データ復元後にUIを更新
      collectAndSortLogEntries();  // ログを整理
      updateNoteCard();  // ノートカードを更新
      updateAreaCount();
    }
  }
}

// URLのクエリパラメータからdataを削除
export function removeHistoryGetData(){
    const url = new URL(window.location);
    url.searchParams.delete('data');
    history.replaceState(null, '', url);  // ブラウザ履歴を更新し、URLからdataパラメータを削除
}
