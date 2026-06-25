How to convert canvas to pdf
Do you want to save Konva stage into a PDF file?
PDF is a complicated format. So we have to use an external library such as jsPDF.

The idea of saving canvas to pdf is simple:

Generate canvas content
Export canvas into the image
Add image into PDF document created with the PDF library
Save PDF file
Also I have two tips for you:

Thanks to High quality Exports, you can increase the quality of a PDF using pixelRatio attribute when you are converting a node into the image.

It is possible to make a text selectable in the PDF. Even if we are adding the canvas into the PDF as an image, we can insert texts manually. That is not trivial and it can be difficult if you have complex styles. Also text rendering on PDF is different from the text rendering with Konva. But we can try to make it as close as possible. For the demo, we will draw "hidden" text inside PDF file. The text will be places under the image, so it is no visible. But it is still selectable. As a demo of "complex styles" I will blur the text.

Instructions: take a look into the canvas. Then try to save it as PDF.

import { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Rect, Text, Arrow, Image } from 'react-konva';
import useImage from 'use-image';

const App = () => {
const stageRef = useRef(null);
const [darthVaderImage] = useImage('https://konvajs.org/assets/darth-vader.jpg', 'anonymous');
const width = window.innerWidth;
const height = window.innerHeight;

// Load jsPDF library dynamically
useEffect(() => {
const script = document.createElement('script');
script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/1.5.3/jspdf.debug.js';
script.integrity = 'sha384-NaWTHo/8YCBYJ59830LTz/P4aQZK1sS0SneOgAvhsIl3zBu8r9RevNg5lHCHAuQ/';
script.crossOrigin = 'anonymous';
document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };

}, []);

// Handle PDF export
const handleExport = () => {
if (stageRef.current && typeof window.jsPDF !== 'undefined') {
const stage = stageRef.current;
const pdf = new window.jsPDF('l', 'px', [width, height]);
pdf.setTextColor('#000000');

      // First add texts
      stage.find('Text').forEach((text) => {
        const size = text.fontSize() / 0.75; // convert pixels to points
        pdf.setFontSize(size);
        pdf.text(text.text(), text.x(), text.y(), {
          baseline: 'top',
          angle: -text.getAbsoluteRotation(),
        });
      });

      // Then put image on top of texts (so texts are not visible)
      pdf.addImage(
        stage.toDataURL({ pixelRatio: 2 }),
        0,
        0,
        width,
        height
      );

      pdf.save('canvas.pdf');
    } else {
      console.error('jsPDF library is not loaded or stage is not available');
      alert('jsPDF library is not loaded. In a real project, you need to include it.');
    }

};

return (
<div style={{ position: 'relative' }}>
<button
style={{ position: 'absolute', top: '5px', left: '5px', zIndex: 10 }}
onClick={handleExport} >
Save as PDF
</button>

      <Stage width={width} height={height} ref={stageRef}>
        <Layer>
          <Rect
            width={width}
            height={height}
            fill="rgba(200, 200, 200)"
          />

          <Text
            text="This is the Darth Vader"
            x={15}
            y={40}
            rotation={-10}
            fontSize={18}
            filters={[Konva.Filters.Blur]}
            blurRadius={4}
          />

          <Arrow
            points={[70, 50, 100, 80, 150, 100, 190, 100]}
            tension={0.5}
            stroke="black"
            fill="black"
          />

          {darthVaderImage && (
            <Image
              image={darthVaderImage}
              x={200}
              y={50}
              scaleX={0.5}
              scaleY={0.5}
            />
          )}
        </Layer>
      </Stage>
    </div>

);
};

export default App;
