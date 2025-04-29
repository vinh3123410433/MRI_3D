import React, { useState } from 'react';
import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import VolumeMesh from "../models/VolumeMesh";
import mriService, { MriData } from "../../services/MriService";

interface PatientMriViewerProps {
  patientId: string;
  onClose: () => void;
}

const PatientMriViewer: React.FC<PatientMriViewerProps> = ({ patientId, onClose }) => {
  const [patientMris] = useState<MriData[]>(mriService.getMriDataForPatient(patientId));
  const [activeMriIndex, setActiveMriIndex] = useState<number>(patientMris.length > 0 ? 0 : -1);
  const [viewMode, setViewMode] = useState<'3d' | 'slices'>('3d');

  if (patientMris.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-blue-600">MRI 3D</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="h-96 flex items-center justify-center">
          <p className="text-lg text-gray-600">Bệnh nhân này chưa có dữ liệu MRI nào.</p>
        </div>
      </div>
    );
  }

  const activeMri = patientMris[activeMriIndex];

  // Component to display a 2D slice of the MRI data
  const SliceView: React.FC<{
    data: Float32Array;
    dimensions: [number, number, number];
    sliceIndex: number;
    sliceOrientation: "x" | "y" | "z";
  }> = ({ data, dimensions, sliceIndex, sliceOrientation }) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);

    React.useEffect(() => {
      if (!canvasRef.current) return;

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
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-blue-600">MRI 3D</h2>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setViewMode(viewMode === "3d" ? "slices" : "3d")}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            {viewMode === "3d" ? "Xem mặt cắt" : "Xem 3D"}
          </button>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* MRI selection tabs */}
      <div className="flex overflow-x-auto mb-4">
        {patientMris.map((mri, index) => (
          <button
            key={mri.id}
            className={`px-4 py-2 whitespace-nowrap ${
              activeMriIndex === index
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            } rounded-t-lg mr-2`}
            onClick={() => setActiveMriIndex(index)}
          >
            {mri.name} ({mri.date})
          </button>
        ))}
      </div>

      {/* MRI viewer */}
      <div className="h-[70vh]">
        {viewMode === "3d" ? (
          <Canvas
            className="w-full h-full"
            orthographic
            camera={{
              position: [0, 0, 500],
              left: -256,
              right: 256,
              top: 256,
              bottom: -256,
              near: 1,
              far: 1000
            }}
          >
            <ambientLight intensity={0.5} />
            <OrbitControls />
            <VolumeMesh
              volume={{
                xLength: activeMri.dimensions[0],
                yLength: activeMri.dimensions[1],
                zLength: activeMri.dimensions[2],
                data: activeMri.data,
              }}
            />
          </Canvas>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
            {/* X-axis slice (YZ plane) */}
            <div className="flex flex-col bg-white rounded-lg shadow p-4">
              <SliceView
                data={activeMri.data}
                dimensions={activeMri.dimensions}
                sliceIndex={activeMri.slices.x}
                sliceOrientation="x"
              />
            </div>

            {/* Y-axis slice (XZ plane) */}
            <div className="flex flex-col bg-white rounded-lg shadow p-4">
              <SliceView
                data={activeMri.data}
                dimensions={activeMri.dimensions}
                sliceIndex={activeMri.slices.y}
                sliceOrientation="y"
              />
            </div>

            {/* Z-axis slice (XY plane) */}
            <div className="flex flex-col bg-white rounded-lg shadow p-4">
              <SliceView
                data={activeMri.data}
                dimensions={activeMri.dimensions}
                sliceIndex={activeMri.slices.z}
                sliceOrientation="z"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientMriViewer;