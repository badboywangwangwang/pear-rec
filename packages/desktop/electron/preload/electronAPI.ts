import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // logger
  sendLogger: (msg: any) => ipcRenderer.send('lg:send-msg', msg),

  // mainWin
  sendMaOpenWin: () => ipcRenderer.send('ma:open-win'),
  sendMaCloseWin: () => ipcRenderer.send('ma:close-win'),

  //raWin
  sendRaCloseWin: () => ipcRenderer.send('ra:close-win'),
  sendRaOpenWin: () => ipcRenderer.send('ra:open-win'),
  sendRaDownloadRecord: (url: string) => ipcRenderer.send('ra:download-record', url),

  //rsWin
  sendRsOpenWin: (search?: any) => ipcRenderer.send('rs:open-win', search),
  sendRsCloseWin: () => ipcRenderer.send('rs:close-win'),
  sendRsHideWin: () => ipcRenderer.send('rs:hide-win'),
  sendRsMinimizeWin: () => ipcRenderer.send('rs:minimize-win'),
  sendRsStartRecord: () => ipcRenderer.send('rs:start-record'),
  sendRsPauseRecord: () => ipcRenderer.send('rs:pause-record'),
  sendRsStopRecord: () => ipcRenderer.send('rs:stop-record'),
  invokeRsGetBoundsClip: () => ipcRenderer.invoke('rs:get-bounds-clip'),
  invokeRsGetDesktopCapturerSource: () => {
    return ipcRenderer.invoke('rs:get-desktop-capturer-source');
  },
  invokeRsGetCursorScreenPoint: () => ipcRenderer.invoke('rs:get-cursor-screen-point'),
  invokeRsIsFocused: () => ipcRenderer.invoke('rs:is-focused'),
  sendRsFocus: () => ipcRenderer.send('rs:focus'),
  sendRsSetIgnoreMouseEvents: (ignore: boolean, options: any) => {
    ipcRenderer.send('rs:set-ignore-mouse-events', ignore, options);
  },
  handleRsGetSizeClipWin: (callback: any) => ipcRenderer.on('rs:get-size-clip-win', callback),
  handleRsGetShotScreen: (callback: any) => ipcRenderer.on('rs:get-shot-screen', callback),
  handleRsGetEndRecord: (callback: any) => ipcRenderer.on('rs:get-end-record', callback),

  //csWin
  sendCsOpenWin: (search?: any) => ipcRenderer.send('cs:open-win', search),
  sendCsCloseWin: () => ipcRenderer.send('cs:close-win'),
  sendCsHideWin: () => ipcRenderer.send('cs:hide-win'),
  sendCsMinimizeWin: () => ipcRenderer.send('cs:minimize-win'),
  sendCsSetIgnoreMouseEvents: (ignore: boolean, options: any) => {
    ipcRenderer.send('cs:set-ignore-mouse-events', ignore, options);
  },
  invokeCsGetBounds: () => ipcRenderer.invoke('cs:get-bounds'),
  handleCsSetIsPlay: (callback: any) => ipcRenderer.on('cs:set-isPlay', callback),
  sendCsSetBounds: (bounds: any) => {
    ipcRenderer.send('cs:set-bounds', bounds);
  },

  //rvWin
  sendRvCloseWin: () => ipcRenderer.send('rv:close-win'),
  sendRvOpenWin: () => ipcRenderer.send('rv:open-win'),
  sendRvDownloadRecord: (url: string) => ipcRenderer.send('rv:download-record', url),

  //ssWin
  sendSsOpenWin: () => ipcRenderer.send('ss:open-win'),
  sendSsCloseWin: () => ipcRenderer.send('ss:close-win'),
  invokeSsGetShotScreenImg: () => ipcRenderer.invoke('ss:get-shot-screen-img'),
  sendSsDownloadImg: (imgUrl: string) => ipcRenderer.send('ss:download-img', imgUrl),
  sendSsSaveImg: (imgUrl: string) => ipcRenderer.send('ss:save-img', imgUrl),
  sendSsOpenExternal: (tabUrl: string) => ipcRenderer.send('ss:open-external', tabUrl),
  sendSsCopyImg: (imgUrl: string) => ipcRenderer.send('ss:copy-img', imgUrl),

  //viWin
  sendViCloseWin: () => ipcRenderer.send('vi:close-win'),
  sendViOpenWin: (search?: string) => ipcRenderer.send('vi:open-win', search),
  sendViMinimizeWin: () => ipcRenderer.send('vi:minimize-win'),
  sendViMaximizeWin: () => ipcRenderer.send('vi:maximize-win'),
  sendViUnmaximizeWin: () => ipcRenderer.send('vi:unmaximize-win'),
  sendViOpenFile: (imgUrl: string) => ipcRenderer.send('vi:open-file', imgUrl),
  invokeViSetIsAlwaysOnTop: () => ipcRenderer.invoke('vi:set-always-on-top'),
  invokeViGetImgs: (imgUrl: string) => ipcRenderer.invoke('vi:get-imgs', imgUrl),
  sendViDownloadImg: (img: string) => ipcRenderer.send('vi:download-img', img),
  sendViSetHistoryImg: (img: string) => {
    ipcRenderer.send('vi:set-historyImg', img);
  },

  //eiWin
  sendEiCloseWin: () => ipcRenderer.send('ei:close-win'),
  sendEiOpenWin: (search?: string) => ipcRenderer.send('ei:open-win', search),
  sendEiDownloadImg: (imgUrl?: string) => ipcRenderer.send('ei:download-img', imgUrl),

  //egWin
  sendEgCloseWin: () => ipcRenderer.send('eg:close-win'),
  sendEgOpenWin: (search?: string) => ipcRenderer.send('eg:open-win', search),

  //siWin
  sendSiCloseWin: () => ipcRenderer.send('si:close-win'),
  sendSiOpenWin: () => ipcRenderer.send('si:open-win'),

  //vvWin
  sendVvOpenWin: (search?: string) => ipcRenderer.send('vv:open-win', search),
  sendVvCloseWin: () => ipcRenderer.send('vv:close-win'),
  invokeVvGetHistoryVideo: () => ipcRenderer.invoke('vv:get-historyVideo'),
  sendVvSetHistoryVideo: (img: string) => ipcRenderer.send('vv:set-historyVideo', img),

  //vaWin
  sendVaOpenWin: (search?: any) => ipcRenderer.send('va:open-win', search),
  invokeVaGetAudios: (audioUrl: any) => ipcRenderer.invoke('va:get-audios', audioUrl),
  //seWin 设置
  sendSeOpenWin: () => ipcRenderer.send('se:open-win'),
  invokeSeGetUser: () => ipcRenderer.invoke('se:get-user'),
  invokeSeSetFilePath: (filePath: string) => ipcRenderer.invoke('se:set-filePath', filePath),
  invokeSeGetFilePath: () => ipcRenderer.invoke('se:get-filePath'),
  sendSeSetOpenAtLogin: (isOpen: boolean) => ipcRenderer.send('se:set-openAtLogin', isOpen),
  sendSeSetLanguage: (lng: string) => ipcRenderer.send('se:set-language', lng),
  invokeSeGetOpenAtLogin: () => ipcRenderer.invoke('se:get-openAtLogin'),

  //re 记录
  sendReOpenWin: () => ipcRenderer.send('re:open-win'),

  //pi 钉图
  sendPiOpenWin: (search?: any) => ipcRenderer.send('pi:open-win', search),
  sendPiCloseWin: () => ipcRenderer.send('pi:close-win'),
  sendPiMinimizeWin: () => ipcRenderer.send('pi:minimize-win'),
  sendPiMaximizeWin: () => ipcRenderer.send('pi:maximize-win'),
  sendPiUnmaximizeWin: () => ipcRenderer.send('pi:unmaximize-win'),

  //pi 钉视频
  sendPvOpenWin: (search?: any) => ipcRenderer.send('pv:open-win', search),
  sendPvCloseWin: () => ipcRenderer.send('pv:close-win'),
  sendPvMinimizeWin: () => ipcRenderer.send('pv:minimize-win'),
  sendPvMaximizeWin: () => ipcRenderer.send('pv:maximize-win'),
  sendPvUnmaximizeWin: () => ipcRenderer.send('pv:unmaximize-win'),

  // rfs 全屏录屏
  sendRfsOpenWin: () => ipcRenderer.send('rfs:open-win'),
  sendRfsCloseWin: () => ipcRenderer.send('rfs:close-win'),

  // Eu 自动更新
  handleEuUpdateCanAvailable: (callback: any) =>
    ipcRenderer.on('eu:update-can-available', callback),
  handleEuUpdateeError: (callback: any) => ipcRenderer.on('eu:update-error', callback),
  handleEuDownloadProgress: (callback: any) => ipcRenderer.on('eu:download-progress', callback),
  handleEuUpdateDownloaded: (callback: any) => ipcRenderer.on('eu:update-downloaded', callback),
  invokeEuQuitAndInstall: () => ipcRenderer.invoke('eu:quit-and-install'),
  invokeEuStartDownload: () => ipcRenderer.invoke('eu:start-download'),
  invokeEuCheckUpdate: () => ipcRenderer.invoke('eu:check-update'),
  offEuUpdateCanAvailable: (callback: any) => ipcRenderer.on('eu:update-can-available', callback),
  offEuUpdateeError: (callback: any) => ipcRenderer.on('eu:update-error', callback),
  offEuDownloadProgress: (callback: any) => ipcRenderer.on('eu:download-progress', callback),
  offEuUpdateDownloaded: (callback: any) => ipcRenderer.on('eu:update-downloaded', callback),
});
