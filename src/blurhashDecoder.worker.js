import { decode } from 'blurhash';

let ctx;
let pixels;
let imageData;

self.onmessage = async m => {
    let {
        hash,
        width,
        height,
        xCount,
        yCount,
        punch = 1,
        canvas,
        smooth = 'high',
    } = m.data;

    console.time(`decode ${hash}`);

    canvas.width = width || canvas.width;
    canvas.height = height || canvas.height;
    ctx = canvas.getContext('2d');

    // get pixels from blurhash
    // :info: most important is to keep low values in decode width/height. 
    // some tutorial might say to set you image final size, but please dont ! (takes forever to process)
    // instead we generate the minimun size, and we upscale it with good smooth algorithm (important)
    pixels = decode(hash, xCount, yCount, punch);

    // create image from pixels
    imageData = ctx.createImageData(xCount, yCount);
    imageData.data.set(pixels);
    const img = await createImageBitmap(imageData, 0, 0, xCount,  yCount);

    // draw upscalled image + smooth
    ctx.imageSmoothingEnabled = !!smooth;
    if (['low', 'medium', 'high'].includes(smooth)) ctx.imageSmoothingQuality = smooth;
    ctx.drawImage(img, 0,0, canvas.width, canvas.height);

    console.timeEnd(`decode ${hash}`);

    // nothing to return/send, thanks to offscreenCanvas
}


// ! DO NOT USE THIS (just some funny researches)
// function shader(m) {
//     console.time('shader');
//     const {
//         hash,
//         width,
//         height,
//         xCount,
//         yCount,
//         canvas
//     } = m.data;

//     canvas.width = width;
//     canvas.height = height;
//     const gl = canvas.getContext('webgl');

//     const colors = decode(hash, xCount, yCount, 1);

//     const tex = gl.createTexture();
//     gl.bindTexture(gl.TEXTURE_2D, tex);
//     gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
//     gl.texImage2D(
//         gl.TEXTURE_2D,
//         0, // mip level
//         gl.RGBA,  // internal format
//         xCount,  // width,
//         yCount,  // height,
//         0,  // border
//         gl.RGBA, // format
//         gl.UNSIGNED_BYTE, // type
//         new Uint8Array(colors)
//     );
//     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
//     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
//     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
//     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    
//     const vs = gl.createShader(gl.VERTEX_SHADER);
//     gl.shaderSource(vs,`
//         attribute vec4 position;
//         attribute vec2 texcoord;
//         varying vec2 v_texcoord;
//         void main() {
//             gl_Position = position;
//             v_texcoord = texcoord;
//         }
//     `);
//     gl.compileShader(vs);
    
//     const fs = gl.createShader(gl.FRAGMENT_SHADER);
//     gl.shaderSource(fs, `
//         precision mediump float;
//         varying vec2 v_texcoord;
//         const vec2 texSize = vec2(${xCount}, ${yCount});  // could pass this in
//         uniform sampler2D tex;
//         void main() {
//             gl_FragColor = texture2D(tex, 
//                 (v_texcoord * (texSize - 1.0) + 0.5) / texSize);
//         }
//     `);
//     gl.compileShader(fs);
    
//     // const program = twgl.createProgram(gl, [vs, fs]);
//     const program = gl.createProgram();
//     gl.attachShader(program, vs);
//     gl.attachShader(program, fs);
//     gl.linkProgram(program);
//     const positionLoc = gl.getAttribLocation(program, 'position');
//     const texcoordLoc = gl.getAttribLocation(program, 'texcoord');
    
//     function createBufferAndSetupAttribute(loc, data) {
//       const buffer = gl.createBuffer();
//       gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
//       gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
//       gl.enableVertexAttribArray(loc);
//       gl.vertexAttribPointer(
//           loc,
//           2,  // 2 elements per iteration
//           gl.FLOAT,  // type of data in buffer
//           false,  // normalize
//           0,  // stride
//           0,  // offset
//       );
//     }
    
//     createBufferAndSetupAttribute(positionLoc, [
//       -1, -1,
//        1, -1,
//       -1,  1,
//       -1,  1,
//        1, -1,
//        1,  1,
//     ]);
//     createBufferAndSetupAttribute(texcoordLoc, [
//        0,  0,
//        1,  0,
//        0,  1,
//        0,  1,
//        1,  0,
//        1,  1,
//     ]);
    
//     gl.useProgram(program);
//     // note: no need to set sampler uniform as it defaults
//     // to 0 which is what we'd set it to anyway.
//     gl.drawArrays(gl.TRIANGLES, 0, 6);
//     console.timeEnd('shader');
// }