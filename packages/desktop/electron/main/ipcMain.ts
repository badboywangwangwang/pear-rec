import { editConfig } from '@pear-rec/server/src/config';
import {
  BrowserWindow,
  app,
  desktopCapturer,
  dialog,
  ipcMain,
  screen,
  shell,
  webContents,
} from 'electron';
import * as clipScreenWin from '../win/clipScreenWin';
import * as editGifWin from '../win/editGifWin';
import * as editImageWin from '../win/editImageWin';
import * as mainWin from '../win/mainWin';
import * as pinImageWin from '../win/pinImageWin';
import * as pinVideoWin from '../win/pinVideoWin';
import * as recorderAudioWin from '../win/recorderAudioWin';
import * as recorderFullScreenWin from '../win/recorderFullScreenWin';
import * as recorderScreenWin from '../win/recorderScreenWin';
import * as recorderVideoWin from '../win/recorderVideoWin';
import * as recordsWin from '../win/recordsWin';
import * as settingWin from '../win/settingWin';
import * as shotScreenWin from '../win/shotScreenWin';
import * as spliceImageWin from '../win/spliceImageWin';
import * as viewAudioWin from '../win/viewAudioWin';
import * as viewImageWin from '../win/viewImageWin';
import * as viewVideoWin from '../win/viewVideoWin';
import logger from './logger';
import * as utils from './utils';

const selfWindws = async () =>
  await Promise.all(
    webContents
      .getAllWebContents()
      .filter((item) => {
        const win = BrowserWindow.fromWebContents(item);
        return win && win.isVisible();
      })
      .map(async (item) => {
        const win = BrowserWindow.fromWebContents(item);
        const thumbnail = await win?.capturePage();
        return {
          name: win?.getTitle() + (item.devToolsWebContents === null ? '' : '-dev'), // 给dev窗口加上后缀
          id: win?.getMediaSourceId(),
          thumbnail,
          display_id: '',
          appIcon: null,
        };
      }),
  );

function initIpcMain() {
  // 日志
  ipcMain.on('lg:send-msg', (e, msg) => {
    logger.info(msg);
  });

  // 主页
  ipcMain.on('ma:open-win', () => {
    mainWin.openMainWin();
  });
  ipcMain.on('ma:close-win', () => {
    mainWin.closeMainWin();
  });
  // 录屏
  ipcMain.on('rs:open-win', (e, search) => {
    clipScreenWin.closeClipScreenWin();
    recorderScreenWin.closeRecorderScreenWin();
    mainWin.closeMainWin();
    recorderScreenWin.openRecorderScreenWin(search);
  });
  ipcMain.on('rs:close-win', (e, filePath) => {
    recorderScreenWin.closeRecorderScreenWin();
  });
  ipcMain.on('rs:hide-win', () => {
    recorderScreenWin.hideRecorderScreenWin();
  });
  ipcMain.on('rs:minimize-win', () => {
    recorderScreenWin.minimizeRecorderScreenWin();
  });
  ipcMain.handle('rs:get-desktop-capturer-source', async () => {
    return [...(await desktopCapturer.getSources({ types: ['screen'] })), ...(await selfWindws())];
  });
  ipcMain.handle('rs:get-bounds-clip', async () => {
    return clipScreenWin.getBoundsClipScreenWin();
  });
  ipcMain.on('rs:start-record', (event) => {
    recorderScreenWin.setMovableRecorderScreenWin(false);
    recorderScreenWin.setResizableRecorderScreenWin(false);
    clipScreenWin.setMovableClipScreenWin(false);
    clipScreenWin.setResizableClipScreenWin(false);
    clipScreenWin.setIgnoreMouseEventsClipScreenWin(event, true, {
      forward: true,
    });
    clipScreenWin.setIsPlayClipScreenWin(true);
  });
  ipcMain.on('rs:pause-record', (event) => {
    recorderScreenWin.setMovableRecorderScreenWin(true);
    recorderScreenWin.setResizableRecorderScreenWin(true);
    clipScreenWin.setMovableClipScreenWin(true);
    clipScreenWin.setResizableClipScreenWin(true);
    clipScreenWin.setIgnoreMouseEventsClipScreenWin(event, false);
    clipScreenWin.setIsPlayClipScreenWin(false);
  });
  ipcMain.on('rs:stop-record', (event) => {
    recorderScreenWin.setMovableRecorderScreenWin(true);
    recorderScreenWin.setResizableRecorderScreenWin(true);
    clipScreenWin.setMovableClipScreenWin(true);
    clipScreenWin.setResizableClipScreenWin(true);
    clipScreenWin.setIgnoreMouseEventsClipScreenWin(event, false);
    clipScreenWin.setIsPlayClipScreenWin(false);
  });
  ipcMain.handle('rs:get-cursor-screen-point', () => {
    return recorderScreenWin.getCursorScreenPointRecorderScreenWin();
  });
  ipcMain.handle('rs:is-focused', () => {
    return recorderScreenWin.isFocusedRecorderScreenWin();
  });
  ipcMain.on('rs:focus', () => {
    recorderScreenWin.focusRecorderScreenWin();
  });
  // 录屏截图
  ipcMain.on('cs:open-win', (e, search) => {
    clipScreenWin.closeClipScreenWin();
    clipScreenWin.openClipScreenWin(search);
  });
  ipcMain.on('cs:close-win', () => {
    clipScreenWin.closeClipScreenWin();
    recorderScreenWin.closeRecorderScreenWin();
  });
  ipcMain.on('cs:hide-win', () => {
    clipScreenWin.hideClipScreenWin();
    recorderScreenWin.hideRecorderScreenWin();
  });
  ipcMain.on('cs:minimize-win', () => {
    clipScreenWin.minimizeClipScreenWin();
  });
  ipcMain.on('cs:set-bounds', (event, bounds) => {
    clipScreenWin.setBoundsClipScreenWin(bounds);
  });
  ipcMain.on('cs:set-ignore-mouse-events', (event, ignore, options) => {
    recorderScreenWin.setIgnoreMouseEventsRecorderScreenWin(event, ignore, options);
  });
  ipcMain.handle('cs:get-bounds', () => clipScreenWin.getBoundsClipScreenWin());
  // 截图
  ipcMain.handle('ss:get-shot-screen-img', async () => {
    const { id } = screen.getPrimaryDisplay();
    const { width, height } = utils.getScreenSize();
    const sources = [
      ...(await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: {
          width,
          height,
        },
      })),
    ];

    let source = sources.filter((e: any) => parseInt(e.display_id, 10) == id)[0];
    source || (source = sources[0]);
    const img = source.thumbnail.toDataURL();
    return img;
  });
  ipcMain.on('ss:open-win', () => {
    shotScreenWin.closeShotScreenWin();
    shotScreenWin.openShotScreenWin();
  });
  ipcMain.on('ss:close-win', () => {
    shotScreenWin.closeShotScreenWin();
  });
  ipcMain.on('ss:save-img', async (e, downloadUrl) => {
    shotScreenWin.downloadURLShotScreenWin(downloadUrl);
  });
  ipcMain.on('ss:download-img', async (e, downloadUrl) => {
    shotScreenWin.downloadURLShotScreenWin(downloadUrl, true);
  });
  ipcMain.on('ss:open-external', async (e, tabUrl) => {
    shell.openExternal(tabUrl);
  });
  ipcMain.handle('ss:get-desktop-capturer-source', async () => {
    return [...(await desktopCapturer.getSources({ types: ['screen'] })), ...(await selfWindws())];
  });
  ipcMain.on('ss:copy-img', (e, imgUrl) => {
    shotScreenWin.copyImg(imgUrl);
  });
  // 图片展示
  ipcMain.on('vi:open-win', (e, search) => {
    viewImageWin.closeViewImageWin();
    viewImageWin.openViewImageWin(search);
  });
  ipcMain.on('vi:close-win', () => {
    viewImageWin.closeViewImageWin();
  });
  ipcMain.on('vi:hide-win', () => {
    viewImageWin.hideViewImageWin();
  });
  ipcMain.on('vi:minimize-win', () => {
    viewImageWin.minimizeViewImageWin();
  });
  ipcMain.on('vi:maximize-win', () => {
    viewImageWin.maximizeViewImageWin();
  });
  ipcMain.on('vi:unmaximize-win', () => {
    viewImageWin.unmaximizeViewImageWin();
  });
  ipcMain.on('vi:open-file', (e, imgUrl) => {
    shell.openExternal(imgUrl);
  });
  ipcMain.handle('vi:set-always-on-top', () => {
    const isAlwaysOnTop = viewImageWin.getIsAlwaysOnTopViewImageWin();
    return viewImageWin.setIsAlwaysOnTopViewImageWin(!isAlwaysOnTop);
  });
  ipcMain.handle('vi:get-imgs', async (e, img) => {
    const imgs = await viewImageWin.getImgs(img);
    return imgs;
  });
  ipcMain.on('vi:download-img', async (e, imgUrl) => {
    viewImageWin.downloadImg(imgUrl);
  });

  // 图片编辑
  ipcMain.on('ei:close-win', () => {
    editImageWin.closeEditImageWin();
  });
  ipcMain.on('ei:open-win', (e, search) => {
    editImageWin.openEditImageWin(search);
  });
  ipcMain.on('ei:download-img', (e, imgUrl) => {
    editImageWin.downloadImg(imgUrl);
  });

  // 图片拼接
  ipcMain.on('si:close-win', () => {
    spliceImageWin.closeSpliceImageWin();
  });
  ipcMain.on('si:open-win', () => {
    spliceImageWin.openSpliceImageWin();
  });

  // 动图编辑
  ipcMain.on('eg:close-win', () => {
    editGifWin.closeEditGifWin();
  });
  ipcMain.on('eg:open-win', (e, search) => {
    editGifWin.openEditGifWin(search);
  });
  // 视频音频展示;
  ipcMain.on('vv:open-win', (e, search) => {
    viewVideoWin.closeViewVideoWin();
    viewVideoWin.openViewVideoWin(search);
  });
  ipcMain.on('vv:close-win', () => {
    viewVideoWin.closeViewVideoWin();
  });
  ipcMain.on('vv:hide-win', () => {
    viewVideoWin.hideViewVideoWin();
  });
  ipcMain.on('vv:minimize-win', () => {
    viewVideoWin.minimizeViewVideoWin();
  });
  ipcMain.on('vv:maximize-win', () => {
    viewVideoWin.maximizeViewVideoWin();
  });
  ipcMain.on('vv:unmaximize-win', () => {
    viewVideoWin.unmaximizeViewVideoWin();
  });
  ipcMain.on('vv:set-always-on-top', (e, isAlwaysOnTop) => {
    viewVideoWin.setAlwaysOnTopViewVideoWin(isAlwaysOnTop);
  });

  // 录音;
  ipcMain.on('ra:open-win', () => {
    recorderAudioWin.closeRecorderAudioWin();
    recorderAudioWin.openRecorderAudioWin();
  });
  ipcMain.on('ra:close-win', () => {
    recorderAudioWin.closeRecorderAudioWin();
  });
  ipcMain.on('ra:hide-win', () => {
    recorderAudioWin.hideRecorderAudioWin();
  });
  ipcMain.on('ra:minimize-win', () => {
    recorderAudioWin.minimizeRecorderAudioWin();
  });
  ipcMain.on('ra:download-record', (e, downloadUrl) => {
    recorderAudioWin.downloadURLRecorderAudioWin(downloadUrl);
  });
  ipcMain.on('ra:start-record', () => {
    recorderAudioWin.setSizeRecorderAudioWin(285, 43);
  });
  ipcMain.on('ra:pause-record', () => {
    recorderAudioWin.setSizeRecorderAudioWin(260, 43);
  });
  ipcMain.on('ra:stop-record', () => {});
  // 录像
  ipcMain.on('rv:open-win', () => {
    recorderVideoWin.closeRecorderVideoWin();
    mainWin.hideMainWin();
    recorderVideoWin.openRecorderVideoWin();
  });
  ipcMain.on('rv:close-win', () => {
    recorderVideoWin.closeRecorderVideoWin();
  });
  ipcMain.on('rv:download-record', (e, downloadUrl) => {
    recorderVideoWin.downloadURLRecorderVideoWin(downloadUrl);
  });
  // 音频
  ipcMain.on('va:open-win', (e, search) => {
    viewAudioWin.closeViewAudioWin();
    viewAudioWin.openViewAudioWin(search);
  });
  ipcMain.handle('va:get-audios', async (e, audioUrl) => {
    const audios = await viewAudioWin.getAudios(audioUrl);
    return audios;
  });
  // 设置
  ipcMain.on('se:open-win', () => {
    settingWin.closeSettingWin();
    settingWin.openSettingWin();
  });
  ipcMain.on('se:close-win', () => {
    settingWin.closeSettingWin();
  });
  ipcMain.handle('se:set-filePath', async (e, filePath) => {
    let res = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    });
    if (!res.canceled) {
      filePath = res.filePaths[0];
    }
    return filePath;
  });
  ipcMain.handle('se:get-filePath', async () => {
    // return await store.getFilePath();
  });
  ipcMain.handle('se:get-user', async () => {
    // return await store.getUser();
  });
  ipcMain.on('se:set-openAtLogin', (e, isOpen) => {
    app.setLoginItemSettings({ openAtLogin: isOpen });
  });
  ipcMain.on('se:set-language', (e, lng) => {
    editConfig('language', lng, () => {
      app.relaunch();
      app.exit(0);
    });
  });
  ipcMain.handle('se:get-openAtLogin', () => {
    return app.getLoginItemSettings();
  });

  // 记录
  ipcMain.on('re:open-win', () => {
    recordsWin.closeRecordsWin();
    recordsWin.openRecordsWin();
  });

  // 钉图
  ipcMain.on('pi:open-win', (e, search) => {
    pinImageWin.openPinImageWin(search);
  });
  ipcMain.on('pi:close-win', () => {
    pinImageWin.closePinImageWin();
  });
  ipcMain.on('pi:minimize-win', () => {
    pinImageWin.minimizePinImageWin();
  });
  ipcMain.on('pi:maximize-win', () => {
    pinImageWin.maximizePinImageWin();
  });
  ipcMain.on('pi:unmaximize-win', () => {
    pinImageWin.unmaximizePinImageWin();
  });

  // 钉图
  ipcMain.on('pv:open-win', (e, search) => {
    pinVideoWin.openPinVideoWin(search);
  });
  ipcMain.on('pv:close-win', () => {
    pinVideoWin.closePinVideoWin();
  });
  ipcMain.on('pv:minimize-win', () => {
    pinVideoWin.minimizePinVideoWin();
  });
  ipcMain.on('pv:maximize-win', () => {
    pinVideoWin.maximizePinVideoWin();
  });
  ipcMain.on('pv:unmaximize-win', () => {
    pinVideoWin.unmaximizePinVideoWin();
  });

  // 录全屏
  ipcMain.on('rfs:open-win', () => {
    recorderFullScreenWin.closeRecorderFullScreenWin();
    recorderFullScreenWin.openRecorderFullScreenWin();
  });
  ipcMain.on('rfs:close-win', () => {
    recorderFullScreenWin.closeRecorderFullScreenWin();
  });
}

initIpcMain();
