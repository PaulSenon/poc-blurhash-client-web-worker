import { decode } from 'blurhash';

let ctx;
let pixels;
let imageData;

self.onmessage = async m => {
    const {
        hash,
        width,
        height,
        xCount,
        yCount,
        ratio,
        punch = 1,
        canvas,
    } = m.data;

    // const containerWidth = width;
    // const containerHeight = height;
    // let ratioedWidth, ratioedHeight, startX, startY;

    // ratioedWidth = containerWidth;
    // ratioedHeight = Math.round(containerWidth*ratio);

    // ratioedWidth = Math.round(containerHeight/ratio);
    // ratioedHeight = containerHeight;


    // canvas.width = ratioedWidth;
    // canvas.height = ratioedHeight;
    ctx = canvas.getContext('2d');
    pixels = decode(hash, xCount, yCount, punch);
    imageData = ctx.createImageData(xCount, yCount);
    imageData.data.set(pixels);
    const img = await createImageBitmap(imageData, 0, 0, canvas.width,  canvas.height); // use ratio here
    ctx.drawImage(img, 0,0, canvas.width, canvas.height);
  }