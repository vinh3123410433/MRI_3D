import React, { useEffect, useRef, useState } from "react";

// Component to display a 2D slice of the MRI data
const a = { x: 0, y: 1, z: 2 };
export const SliceView: React.FC<{
  data: Float32Array;
  dimensions: [number, number, number];
  sliceOrientation: "x" | "y" | "z";
}> = ({ data, dimensions, sliceOrientation }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sliceIndex, setSliceIndex] = useState(
    dimensions[a[sliceOrientation]] / 2
  );

  useEffect(() => {
    if (!canvasRef.current || !data || !dimensions) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const [width, height, depth] = dimensions;

    // Define dimensions and position based on orientation
    let canvasWidth, canvasHeight;
    if (sliceOrientation === "x") {
      canvasWidth = height;
      canvasHeight = depth;
    } else if (sliceOrientation === "y") {
      canvasWidth = width;
      canvasHeight = depth;
    } else {
      // z
      canvasWidth = width;
      canvasHeight = height;
    }

    // Set canvas size
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Create image data
    const imageData = ctx.createImageData(canvasWidth, canvasHeight);

    // Fill image data based on orientation
    for (let y = 0; y < canvasHeight; y++) {
      for (let x = 0; x < canvasWidth; x++) {
        let index;
        if (sliceOrientation === "x") {
          // YZ plane (fixed X)
          index = sliceIndex + x * width + y * width * height;
        } else if (sliceOrientation === "y") {
          // XZ plane (fixed Y)
          index = x + sliceIndex * width + y * width * height;
        } else {
          // z
          // XY plane (fixed Z)
          index = x + y * width + sliceIndex * width * height;
        }

        const pixelIndex = (y * canvasWidth + x) * 4;

        if (index >= 0 && index < data.length) {
          const value = data[index] * 255;
          imageData.data[pixelIndex] = value;
          imageData.data[pixelIndex + 1] = value; // G
          imageData.data[pixelIndex + 2] = value; // B
          imageData.data[pixelIndex + 3] = 0xff; // Alpha
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }, [data, dimensions, sliceIndex, sliceOrientation]);

  return (
    <div className="flex flex-col bg-white rounded-lg shadow p-4">
      <div className="flex flex-col items-center">
        <h3 className="text-lg font-medium text-gray-700 mb-2">
          {sliceOrientation === "x"
            ? "YZ Plane (Coronal)"
            : sliceOrientation === "y"
            ? "XZ Plane (Sagittal)"
            : "XY Plane (Axial)"}
        </h3>
        <canvas
          ref={canvasRef}
          className="border border-gray-300 rounded shadow-md"
          style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
        />
      </div>

      <div className="mt-4 flex items-center">
        <span className="text-sm text-gray-600 mr-2">Slice:</span>
        <input
          type="range"
          min="0"
          max={dimensions[a[sliceOrientation]]}
          value={sliceIndex}
          onChange={(e) => setSliceIndex(+e.target.value)}
          className="w-full"
        />
        <span className="ml-2 text-sm text-gray-600">
          {sliceIndex + 1}/{dimensions[a[sliceOrientation]]}
        </span>
      </div>
    </div>
  );
};
