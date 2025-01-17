import { Local } from '@/util/storage';
import { CameraOutlined, SettingOutlined } from '@ant-design/icons';
import Timer from '@pear-rec/timer';
import useTimer from '@pear-rec/timer/src/useTimer';
import { mp4StreamToOPFSFile } from '@webav/av-cliper';
import { AVRecorder } from '@webav/av-recorder';
import { Button, Modal, message } from 'antd';
import { saveAs } from 'file-saver';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BsRecordCircle } from 'react-icons/bs';
import { useApi } from '../../api';
import { useUserApi } from '../../api/user';
import PauseRecorder from './PauseRecorder';
import PlayRecorder from './PlayRecorder';
import StopRecorder from './StopRecorder';

const ScreenRecorder = (props) => {
  const { t } = useTranslation();
  const api = useApi();
  const userApi = useUserApi();
  const [user, setUser] = useState({} as any);
  const timer = useTimer();
  const videoRef = useRef<HTMLVideoElement>();
  const mediaStream = useRef<MediaStream>(); // 视频流
  const audioStream = useRef<MediaStream>(); // 声音流
  const mediaRecorder = useRef<AVRecorder | null>(); // 媒体录制器对象
  const outputStream = useRef<any>();
  const recordedChunks = useRef<Blob[]>([]); // 存储录制的音频数据
  const recordedUrl = useRef<string>(''); // 存储录制的音频数据
  const [isRecording, setIsRecording] = useState(false); // 标记是否正在录制
  const isSave = useRef<boolean>(false);

  const paramsString = location.search;
  const searchParams = new URLSearchParams(paramsString);
  const type = searchParams.get('type');
  const worker = new Worker(new URL('./worker.js', import.meta.url), { name: 'Crop worker' });

  useEffect(() => {
    if (window.isElectron) {
      initElectron();
    } else {
      initCropArea();
    }
    user.id || getCurrentUser();
    if (type == 'gif') {
      api.deleteFileCache('cg');
      Local.remove('videoFrames');
    }
    return () => {
      mediaRecorder.current?.stop();
    };
  }, []);

  useEffect(() => {
    (async () => {
      if (outputStream.current == null) return;
      const opfsFile = await mp4StreamToOPFSFile(outputStream.current);
      saveAs(opfsFile, `pear-rec_${+new Date()}.mp4`);
      isSave.current = false;
    })();
  }, [outputStream.current]);

  async function getCurrentUser() {
    try {
      const res = (await userApi.getCurrentUser()) as any;
      if (res.code == 0) {
        setUser(res.data);
      }
    } catch (err) {
      console.log(err);
    }
  }

  async function initElectron() {
    const sources = await window.electronAPI?.invokeRsGetDesktopCapturerSource();
    const source = sources.filter((e: any) => e.id == 'screen:0:0')[0] || sources[0];
    const constraints: any = {
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: source.id,
        },
      },
    };
    mediaStream.current = await navigator.mediaDevices.getUserMedia(constraints);
    return mediaStream.current;
  }

  async function initCropArea() {
    try {
      const innerCropArea = document.querySelector('#innerCropArea');
      const cropTarget = await (window as any).CropTarget.fromElement(innerCropArea);
      mediaStream.current = await navigator.mediaDevices.getDisplayMedia({
        preferCurrentTab: true,
      } as any);
      const [videoTrack] = mediaStream.current.getVideoTracks();
      await (videoTrack as any).cropTo(cropTarget);
      audioStream.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      audioStream.current
        ?.getAudioTracks()
        .forEach((audioTrack) => mediaStream.current?.addTrack(audioTrack));
      videoRef.current.srcObject = mediaStream.current;
    } catch (err) {
      console.log('initCropArea', err);
    }
  }

  async function cropStream() {
    const size = await window.electronAPI?.invokeRsGetBoundsClip();
    const [track] = mediaStream.current.getTracks();
    // @ts-ignore
    const processor = new MediaStreamTrackProcessor({ track });
    const { readable } = processor;
    // @ts-ignore
    const generator = new MediaStreamTrackGenerator({ kind: 'video' });
    const { writable } = generator;
    mediaStream.current = new MediaStream([generator]);
    videoRef.current.srcObject = new MediaStream([generator]);

    worker.postMessage(
      {
        operation: 'crop',
        readable,
        writable,
        size,
        type,
        status: 'start',
      },
      [readable, writable],
    );

    worker.addEventListener('message', function (message) {
      Local.set('videoFrames', message.data);
      worker.terminate();
    });

    audioStream.current = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });
    audioStream.current
      ?.getAudioTracks()
      .forEach((audioTrack) => mediaStream.current?.addTrack(audioTrack));
  }

  async function setMediaRecorder() {
    window.isElectron && (await cropStream());
    const recodeMS = mediaStream.current.clone();
    mediaRecorder.current = new AVRecorder(recodeMS);
  }

  function handleOpenSettingWin() {
    window.electronAPI ? window.electronAPI.sendSeOpenWin() : window.open('/setting.html');
  }

  function handleShotScreen() {
    const { width, height } = props.size;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const url = canvas.toDataURL('image/png');
    saveAs(url, `pear-rec_${+new Date()}.png`);
  }

  // 开始录制
  async function handleStartRecord() {
    await setMediaRecorder();
    await mediaRecorder.current.start();
    outputStream.current = mediaRecorder.current.outputStream;

    setIsRecording(true);
    props.setIsRecording && props.setIsRecording(true);
    timer.start();
  }

  // 暂停录制
  function handlePauseRecord() {
    mediaRecorder.current.pause();
    timer.pause();
  }

  // 恢复录制
  function handleResumeRecord() {
    mediaRecorder.current.resume();
    timer.resume();
  }

  // 停止录制，并将录制的音频数据导出为 Blob 对象
  async function handleStopRecord() {
    isSave.current = true;
    timer.reset();
    if (isRecording) {
      await mediaRecorder.current.stop();
    }
    worker.postMessage({
      status: 'stop',
    });
  }

  // 导出录屏文件
  async function exportRecord() {
    if (type == 'gif') {
      const res = (await api.getFileCache('cg')) as any;
      if (res.code == 0) {
        if (window.isElectron) {
          window.electronAPI.sendRsCloseWin();
          window.electronAPI.sendEgOpenWin({ filePath: res.data });
        } else {
          window.open(`/editGif.html?filePath=${res.data}`);
        }
      }
    } else {
      if (recordedChunks.current.length > 0) {
        const blob = new Blob(recordedChunks.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        recordedUrl.current = url;
        isSave.current = false;
        console.log('录屏地址：', url);
        recordedChunks.current = [];
        window.isOffline ? saveAs(url, `pear-rec_${+new Date()}.webm`) : saveFile(blob);
      }
    }
  }

  async function saveFile(blob) {
    try {
      recordedChunks.current = [];
      const formData = new FormData();
      formData.append('type', 'rs');
      formData.append('userId', user.id);
      formData.append('file', blob);
      const res = (await api.saveFile(formData)) as any;
      if (res.code == 0) {
        if (window.isElectron) {
          window.electronAPI.sendRsCloseWin();
          window.electronAPI.sendVvOpenWin({ videoUrl: res.data.filePath });
        } else {
          Modal.confirm({
            title: '录屏已保存，是否查看？',
            content: `${res.data.filePath}`,
            okText: t('modal.ok'),
            cancelText: t('modal.cancel'),
            onOk() {
              window.open(`/viewVideo.html?videoUrl=${res.data.filePath}`);
            },
          });
        }
      }
    } catch (err) {
      message.error('保存失败');
    }
  }

  return (
    <div
      className="screenRecorder"
      style={{
        top: props.position ? props.position.y + props.size.height + 2 : 0,
        left: props.position ? props.position.x : 0,
        width: props.size ? props.size.width : '100%',
      }}
    >
      <video ref={videoRef} className="hide" playsInline autoPlay />
      <Button
        type="text"
        icon={<BsRecordCircle />}
        className={`toolbarIcon recordBtn ${isRecording ? 'blink' : ''}`}
      ></Button>
      <Button
        type="text"
        icon={<SettingOutlined />}
        className="toolbarIcon settingBtn"
        title={t('nav.setting')}
        onClick={handleOpenSettingWin}
      ></Button>
      <Button
        type="text"
        icon={<CameraOutlined />}
        className="toolbarIcon shotScreenBtn"
        title={t('recorderScreen.shotScreen')}
        onClick={handleShotScreen}
      ></Button>
      <div className="drgan"></div>
      {isSave.current ? (
        <Button type="text" loading>
          {t('recorderScreen.saving')}...
        </Button>
      ) : isRecording ? (
        <>
          {/* <MuteRecorder /> */}
          <Timer
            seconds={timer.seconds}
            minutes={timer.minutes}
            hours={timer.hours}
            isShowTitle={false}
          />
          <PauseRecorder pauseRecord={handlePauseRecord} resumeRecord={handleResumeRecord} />
          <StopRecorder stopRecord={handleStopRecord} />
        </>
      ) : (
        <PlayRecorder startRecord={handleStartRecord} />
      )}
    </div>
  );
};

export default ScreenRecorder;
