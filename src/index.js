import InView from './lib/InView';
window.addEventListener('DOMContentLoaded', main());

async function main() {
  const currentUrl = new URLSearchParams(window.location.search);
  const isOff = currentUrl.get('blurhash') === 'off';


  // * HERE IS THE INTERRESTING PART
  // first check browser compatibility
  if (!isOff 
      && typeof window.Worker !== 'undefined' 
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
          // width & height must match image ratio if you want exact same behavior 
          // (if you have ratio from api, use it here for height)
          // as a fallback you can match container dimensions
          width: canvas.clientWidth,
          height: canvas.dataset.ratio ? canvas.clientWidth * canvas.dataset.ratio : canvas.clientHeight,
          // values are not critical. But try to keep those <= generated values (and keep the ratio)
          xCount: 8,
          yCount: 6,
          hash: canvas.dataset.blurhash,
          canvas: offCanvas,
        }, [offCanvas]);
      }
  } else {
    console.log('cannot use offscreen canvas (safari/firefox)')
  }
  // * END OF INTERRESTING PART

  // lazyload
  const inView = new InView({
    // rootMarginBottom: -200,
    // rootMarginTop: -200,
  });
  const lazyImages = document.querySelectorAll('img[data-src]');
  lazyImages.forEach(image => {
    inView.onceVisible(image, () => {
      image.src = image.dataset.src;
      delete image.dataset.src;
    });        
  });

  // debug buttons (for demo purpose only)
  const images = document.querySelectorAll('.image-wrapper > img');
  toggleBackground.onclick = () => document.body.classList.toggle('hide-background');
  togglePlaceholder.onclick = () => document.body.classList.toggle('hide-canvas');
  toggleBlur.onclick = () => window.location.replace(`${window.location.origin}/?blurhash=${isOff?'on':'off'}`);
  toggle.onclick = () => images.forEach(img => img.classList.toggle('hidden-debug'));
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
