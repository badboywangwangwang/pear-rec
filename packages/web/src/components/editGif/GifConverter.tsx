import { ZoomInOutlined, ZoomOutOutlined } from '@ant-design/icons';
import { FloatButton, Progress } from 'antd';
import { useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GifContext } from '../context/GifContext';
import { UserContext } from '../context/UserContext';
import FileTool from './tool/File';
import FrameTool from './tool/Frame';
import HistoryTool from './tool/History';
import MoveTool from './tool/Move';
import PlayTool from './tool/Play';
import SettingTool from './tool/Setting';
import SpliceTool from './tool/Splice';

export default function VideoToGifConverter() {
  const { t } = useTranslation();
  const canvasRef = useRef(null);
  const videoFramesRef = useRef([]);
  const [scale, setScale] = useState<number>(100);
  const { user, setUser } = useContext(UserContext);
  const { gifState, gifDispatch } = useContext(GifContext);

  // const handleVideoDecodeClick = async () => {
  //   // const dataUri = `
  //   // https://w3c.github.io/webcodecs/samples/data/bbb_video_avc_frag.mp4`;
  //   const dataUri = `http://localhost:9190/video?url=C:\\Users\\Administrator\\Downloads\\davinci.mp4`;
  //   // `http://localhost:9190/video?url=C:\\Users\\Administrator\\Documents\\Pear%20Files\\c106a26a-21bb-5538-8bf2-57095d1976c1\\rs\\rs-1703556579452-320065280.mp4`;
  //   const rendererName = '2d';
  //   const canvas = document.querySelector('canvas').transferControlToOffscreen?.();
  //   const worker = new Worker(new URL('./video-decode-display/worker.js', import.meta.url));
  //   function setStatus(message) {
  //     message.data['imgs'] && setVideoFrames(message.data['imgs']);
  //   }
  //   worker.addEventListener('message', setStatus);
  //   const duration = 100;
  //   worker.postMessage({ dataUri, rendererName, canvas, duration }, [canvas]);
  // };

  useEffect(() => {
    if (videoFramesRef.current.length) {
      const img = videoFramesRef.current[gifState.index];
      img
        ? (img.onload = function () {
            setCurrentVideoFrame(gifState.index);
          })
        : clearCanvas();
    }
  }, [gifState.videoFrames]);

  function renderImgToCanvas(img) {
    const ratio = window.devicePixelRatio || 1;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    let { naturalWidth, naturalHeight } = img;
    canvas.width = naturalWidth * ratio;
    canvas.height = naturalHeight * ratio;
    canvas.style.width = naturalWidth + 'px';
    canvas.style.height = naturalHeight + 'px';
    context.scale(ratio, ratio);
    context.drawImage(img, 0, 0, naturalWidth, naturalHeight);
    img.scrollIntoView();
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const { width, height } = canvas;
    context.clearRect(0, 0, width, height);
  }

  function handleCurrentVideoFrameClick(index) {
    gifDispatch({ type: 'setIndex', index });
    setCurrentVideoFrame(index);
  }

  function setCurrentVideoFrame(index) {
    videoFramesRef.current[index] && renderImgToCanvas(videoFramesRef.current[index]);
  }

  return (
    <div className="gifConverter">
      <div className="tool">
        <FileTool />
        <PlayTool setCurrentVideoFrame={setCurrentVideoFrame} />
        <FrameTool />
        <MoveTool />
        <HistoryTool />
        <SettingTool />
        <SpliceTool />
      </div>
      <div className="content">
        <canvas ref={canvasRef} style={{ transform: 'scale(' + scale / 100 + ')' }}></canvas>
        <div className="info">
          <div>
            {gifState.index + 1} / {gifState.videoFrames?.length || 0}{' '}
          </div>
          <div>{scale}%</div>
        </div>
        <FloatButton.Group shape="square" style={{ right: 24, bottom: 150 }}>
          <FloatButton
            icon={<ZoomInOutlined />}
            onClick={() => {
              setScale((scale) => scale + 2);
            }}
          />
          <FloatButton
            icon={<ZoomOutOutlined />}
            onClick={() => {
              setScale((scale) => scale - 2);
            }}
          />
        </FloatButton.Group>
      </div>
      <div className="videoFrames">
        {gifState.videoFrames.length ? (
          gifState.videoFrames.map((videoFrame, index) => (
            <div
              className={`${'videoFrame ' + (index == gifState.index ? 'current' : '')}`}
              key={index}
              onClick={(e) => handleCurrentVideoFrameClick(index)}
            >
              <img
                src={videoFrame.url}
                alt={videoFrame.filePath}
                ref={(el) => (videoFramesRef.current[index] = el)}
              />
              <div className="info">
                <div className="index">{index + 1}</div>
                <div className="duration">{videoFrame.duration}ms</div>
              </div>
            </div>
          ))
        ) : (
          <Progress size="small" percent={gifState.load} />
        )}
      </div>
    </div>
  );
}
