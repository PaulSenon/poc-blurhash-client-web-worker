# What is this ?

Just a small example project to show how to handle blurhash the smoothest way possible using offScreenCanvas and lazy webworker, plus using average image color as a fallback (old & safari & firefox) and for an overall better ux.

overall cost client-side:

* 180 bytes (per image for: canvas html + blurhash(100B))
* 2.2 KB (the decode function from blurhash lib) => It will not be loaded if blurhash is not supported 


# What did I assumed in this example ?

I assumed you get your image/articles from an api, and for each image, in addition to the source, alt, etc, you also have a 8*6 blurhash string (100 bytes string generated from your backoffice when publishing an image) + optionally the avg color (that you can guess from blurhash easily. But maybe you don't want do do it in the backoffice, but in the front server instead ?, your choice.)

I also assumed you have some templating engine (such as twig) to add, next to each `<img>`, a `<canvas>` with required data
e.g:

```html
    <canvas data-blurhash="qEHV6nWB2yk8$NxujFNGpyoJadR*=ss:I[R%.7kCMdnjx]S2NHs:S#M|%1%2ENRis9a$Sis.slNHW:WBxZ%2ogaekBW;ofo0NHS4" 
            style="background-color: #979695;">
    </canvas>
```

**It is important to decode and set bg-color serverside so it is supper snappy, and does not need to wait till js is loaded, parsed and executed.**

FYI, here is how to extract avg RGB value of image from its blurhash:

```javascript
import { decode83 } from 'blurhash/dist/base83' // 471B gzipped

// take any blurhash:
const blurHash = "qEHV6nWB2yk8$NxujFNGpyoJadR*=ss:I[R%.7kCMdnjx]S2NHs:S#M|%1%2ENRis9a$Sis.slNHW:WBxZ%2ogaekBW;ofo0NHS4";

// decode only the needed chunk (containing avg color data)
const value = decode83(blurHash.substring(2, 6));

// then use the value (few examples)
    // get hex string:
        // convert float to hex
        const hexValue = value.toString(16);
        const hexString = `#${hexValue}`;

    // get rgb string:
        // extract R,G,B components from data 
        const [R,G,B] = [
            value >> 16, 
            (value >> 8) & 255, 
            value & 255
        ];
        // build string
        const rgbString = `rgb(${R},${G},${B})`;

// easy !!
```

# How do I try this ?

Clone this repo and make sure you have node >= 12 with yarn and do the following:

* `yarn` _to install dependencies_
* `yarn start` or `yarn start:dev` _to start build and in prod or dev mode_
* go on `http://localhost:8080`

In the web page:

The **toggle** button is here to trigger the fade transition between blurhash image and real image.

The **fit** button is here to go through different css object-fit properties (cover, fill, contain) so you can see the blurhash image is still matching the real image.