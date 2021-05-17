window.addEventListener('DOMContentLoaded', main());

async function main() {

  // * HERE IS THE INTERRESTING PART
  // first check browser compatibility
  if (typeof window.Worker !== 'undefined' 
      && typeof window.OffscreenCanvas !== 'undefined') {

    // load worker only if usefull
    // ! it is possible only since webpack 5 (else, have a look to worker-loader)
    const worker = new Worker(new URL('./blurhashDecoder.worker', import.meta.url));

    // handle all canvas offscreen
    const canvases = document.querySelectorAll('.image-wrapper > canvas[data-blurhash]');
    for (let canvas of canvases) {
      // transfer offscreen (available for last chromium browsers)
      const offCanvas = canvas.transferControlToOffscreen();
      // send async task to worker, and because we're using offscreen canvas don't have to handle any response :D
      worker.postMessage({
        hash: canvas.dataset.blurhash,
        xCount: 8,
        yCount: 6,
        canvas: offCanvas,
      }, [offCanvas]);
    }
  } else {
    console.log('cannot use offscreen canvas (safari/firefox)')
  }
  // * END OF INTERRESTING PART

  // debug buttons (for demo purpose only)
  const images = document.querySelectorAll('.image-wrapper > img');
  toggle.onclick = () => images.forEach(img => img.classList.toggle('hidden'));
  toggleFit.onclick = () => {
    if ([...document.body.classList].find(v => ['contain', 'cover', 'fill'].includes(v))) {
      if (document.body.classList.contains('contain')) {
        document.body.classList.remove('contain');
        document.body.classList.add('cover');
        document.body.classList.remove('fill');
      } else if (document.body.classList.contains('cover')) {
        document.body.classList.remove('contain');
        document.body.classList.remove('cover');
        document.body.classList.add('fill');
      } else if (document.body.classList.contains('fill')) {
        document.body.classList.add('contain');
        document.body.classList.remove('cover');
        document.body.classList.remove('fill');
      }
    } else {
      document.body.classList.add('contain');
    }
  };
}
