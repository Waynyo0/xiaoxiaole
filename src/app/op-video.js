const el = () => document.getElementById('op-video');
const videoEl = () => document.getElementById('op-video-el');
const loadingEl = () => document.getElementById('op-loading');
const skipBtn = () => document.getElementById('op-skip');

export function playOp({ onEnd, onError } = {}) {
  const container = el();
  const video = videoEl();
  const loading = loadingEl();
  const skip = skipBtn();
  const src = './assets/video/op_web.mp4';
  const poster = './assets/video/op_poster.jpg';

  container.classList.remove('hidden');
  skip.classList.remove('hidden');
  loading.classList.remove('hidden');
  video.poster = poster;
  video.volume = 0.1;

  const cleanup = () => {
    skip.classList.add('hidden');
    loading.classList.add('hidden');
  };

  const finish = () => {
    cleanup();
    container.classList.add('hidden');
    try {
      video.pause();
    } catch (e) {
      /* ignore */
    }
    if (onEnd) onEnd();
  };

  const startPlayback = () => {
    video.volume = 0.1;
    loading.classList.remove('hidden');
    video
      .play()
      .then(() => {
        loading.classList.add('hidden');
      })
      .catch(() => {
        loading.classList.add('hidden');
      });
  };

  skip.onclick = () => finish();
  video.onended = () => finish();
  video.onerror = () => {
    cleanup();
    container.classList.add('hidden');
    if (onError) onError();
  };
  video.onclick = () => {
    if (video.paused) startPlayback();
  };

  if (!src) {
    finish();
    return;
  }

  video.src = src;
  video.load();
  startPlayback();
}
