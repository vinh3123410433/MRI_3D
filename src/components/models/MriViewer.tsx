import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import * as NiftiReader from "nifti-reader-js";
import React, { useEffect, useRef, useState } from "react";
import VolumeMesh from "./VolumeMesh";

interface MriData {
  data: Float32Array;
  dimensions: [number, number, number];
  slices: {
    x: number;
    y: number;
    z: number;
  };
}

// Component to display a 2D slice of the MRI data
const SliceView: React.FC<{
  data: Float32Array | null;
  dimensions: [number, number, number] | null;
  sliceIndex: number;
  sliceOrientation: "x" | "y" | "z";
  threshold: number;
}> = ({ data, dimensions, sliceIndex, sliceOrientation, threshold }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
  }, [data, dimensions, sliceIndex, sliceOrientation, threshold]);

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

const Mri3dView: React.FC<{
  data?: Float32Array;
  dimensions?: [number, number, number];
}> = ({ data, dimensions }) => {
  const h = 512; // frustum height
  const aspect = window.innerWidth / window.innerHeight;
  return (
    <div className="w-full h-full">
      <Canvas
        orthographic
        camera={{
          position: [0, 0, 500],
          near: 1,
          far: 1000,
          args: [(-h * aspect) / 2, (h * aspect) / 2, h / 2, -h / 2, 1, 1000],
        }}
      >
        <ambientLight intensity={0.5} />
        <OrbitControls />
        {/* <mesh>
          <boxGeometry args={[10, 10, 10]} />
        </mesh> */}

        <VolumeMesh
          volume={{
            xLength: dimensions?.[0] || 0,
            yLength: dimensions?.[1] || 0,
            zLength: dimensions?.[2] || 0,
            data: data,
          }}
        />
      </Canvas>
    </div>
  );
};

const MriViewer: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mriData, setMriData] = useState<MriData | null>(null);
  const [threshold, setThreshold] = useState(0.5);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"3d" | "slices">("slices");
  // Thêm state cho các file mẫu
  const [sampleFiles, setSampleFiles] = useState<
    { name: string; url: string }[]
  >([
    { name: "Brain MRI Sample", url: "/samples/brain_sample.nii.gz" },
    { name: "Chest MRI Sample", url: "/samples/chest_sample.nii.gz" },
    { name: "Knee MRI Sample", url: "/samples/knee_sample.nii.gz" },
  ]);
  const [showSampleDropdown, setShowSampleDropdown] = useState(false);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        processNiftiBuffer(buffer);
      } catch (error) {
        console.error("Error processing MRI file:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Có lỗi xảy ra khi xử lý file MRI"
        );
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
      setError("Không thể đọc file. Vui lòng thử lại.");
      setIsLoading(false);
    };

    reader.readAsArrayBuffer(file);
  };

  // Hàm mới để xử lý file từ server
  const loadSampleFile = async (url: string) => {
    setIsLoading(true);
    setError(null);
    setShowSampleDropdown(false);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const buffer = await response.arrayBuffer();
      processNiftiBuffer(buffer);
    } catch (error) {
      console.error("Error loading sample file:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Có lỗi xảy ra khi tải file mẫu từ server"
      );
      setIsLoading(false);
    }
  };

  // Tách riêng hàm xử lý buffer để tái sử dụng
  const processNiftiBuffer = (buffer: ArrayBuffer) => {
    try {
      if (!buffer) {
        throw new Error("Không thể đọc file");
      }

      const niftiHeader = NiftiReader.readHeader(buffer);
      if (!niftiHeader) {
        throw new Error("Không thể đọc header của file NIFTI");
      }

      console.log("Header:", niftiHeader);

      const niftiImage = NiftiReader.readImage(niftiHeader, buffer);
      if (!niftiImage) {
        throw new Error("Không thể đọc dữ liệu hình ảnh NIFTI");
      }

      if (!niftiHeader.dims || niftiHeader.dims.length < 4) {
        throw new Error("File NIFTI không có đủ thông tin về kích thước");
      }

      const dimensions: [number, number, number] = [
        niftiHeader.dims[1],
        niftiHeader.dims[2],
        niftiHeader.dims[3],
      ];

      const map_: { [key: number]: any } = {
        [NiftiReader.NIFTI1.TYPE_UINT8]: Uint8Array,
        [NiftiReader.NIFTI1.TYPE_UINT16]: Uint16Array,
        [NiftiReader.NIFTI1.TYPE_UINT32]: Uint32Array,
        [NiftiReader.NIFTI1.TYPE_INT8]: Int8Array,
        [NiftiReader.NIFTI1.TYPE_INT16]: Int16Array,
        [NiftiReader.NIFTI1.TYPE_INT32]: Int32Array,
        [NiftiReader.NIFTI1.TYPE_FLOAT32]: Float32Array,
        [NiftiReader.NIFTI1.TYPE_FLOAT64]: Float64Array,
      };

      const dataType = niftiHeader.datatypeCode;
      const rawData = new (map_[dataType] || Float64Array)(niftiImage);

      let min = Infinity;
      let max = -Infinity;

      for (let i = 0; i < rawData.length; i++) {
        const value = rawData[i];
        min = Math.min(min, value);
        max = Math.max(max, value);
      }

      const data = new Float32Array(rawData.length);
      for (let i = 0; i < rawData.length; i++) {
        data[i] = (rawData[i] - min) / (max - min);
      }

      // Initialize with middle slices for each dimension
      const middleX = Math.floor(dimensions[0] / 2);
      const middleY = Math.floor(dimensions[1] / 2);
      const middleZ = Math.floor(dimensions[2] / 2);

      setMriData({
        data: data,
        dimensions,
        slices: {
          x: middleX,
          y: middleY,
          z: middleZ,
        },
      });
    } catch (error) {
      console.error("Error processing NIFTI buffer:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Có lỗi xảy ra khi xử lý dữ liệu NIFTI"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSliceChange = (orientation: "x" | "y" | "z", value: number) => {
    if (!mriData) return;

    setMriData({
      ...mriData,
      slices: {
        ...mriData.slices,
        [orientation]: value,
      },
    });
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === "3d" ? "slices" : "3d");
  };

  return (
    <div className="w-full h-screen flex flex-col">
      <div className="flex justify-between p-4 bg-white shadow-md">
        <div className="flex flex-wrap items-center gap-4 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              accept=".nii,.nii.gz"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-primary file:text-white
                hover:file:bg-blue-700"
            />
          </div>

          <div className="flex items-center gap-2">
            <label
              htmlFor="threshold"
              className="text-sm font-medium text-gray-700"
            >
              Ngưỡng:
            </label>
            <input
              type="range"
              id="threshold"
              min="0"
              max="1"
              step="0.01"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-32"
            />
            <span className="text-sm text-gray-600">
              {threshold.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="flex items-center">
          <button
            onClick={toggleViewMode}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            {viewMode === "3d" ? (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Chuyển sang chế độ mặt cắt
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.293 15.707a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                  <path
                    fillRule="evenodd"
                    d="M4.293 15.707a1 1 0 010-1.414L8.586 10 4.293 5.707a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Chuyển sang chế độ 3D
              </>
            )}
          </button>
        </div>

        {error && <div className="mt-2 text-red-600 text-sm">Lỗi: {error}</div>}
      </div>

      <div className="flex-1 bg-gray-100 p-4 overflow-auto">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
          </div>
        ) : mriData ? (
          viewMode === "3d" ? (
            <Mri3dView
              data={mriData.data}
              dimensions={mriData.dimensions}
            ></Mri3dView>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
              {/* X-axis slice (YZ plane) */}
              <div className="flex flex-col bg-white rounded-lg shadow p-4">
                <SliceView
                  data={mriData.data}
                  dimensions={mriData.dimensions}
                  sliceIndex={mriData.slices.x}
                  sliceOrientation="x"
                  threshold={threshold}
                />
                <div className="mt-4 flex items-center">
                  <span className="text-sm text-gray-600 mr-2">Slice:</span>
                  <input
                    type="range"
                    min="0"
                    max={mriData.dimensions[0] - 1}
                    value={mriData.slices.x}
                    onChange={(e) =>
                      handleSliceChange("x", parseInt(e.target.value))
                    }
                    className="w-full"
                  />
                  <span className="ml-2 text-sm text-gray-600">
                    {mriData.slices.x + 1}/{mriData.dimensions[0]}
                  </span>
                </div>
              </div>

              {/* Y-axis slice (XZ plane) */}
              <div className="flex flex-col bg-white rounded-lg shadow p-4">
                <SliceView
                  data={mriData.data}
                  dimensions={mriData.dimensions}
                  sliceIndex={mriData.slices.y}
                  sliceOrientation="y"
                  threshold={threshold}
                />
                <div className="mt-4 flex items-center">
                  <span className="text-sm text-gray-600 mr-2">Slice:</span>
                  <input
                    type="range"
                    min="0"
                    max={mriData.dimensions[1] - 1}
                    value={mriData.slices.y}
                    onChange={(e) =>
                      handleSliceChange("y", parseInt(e.target.value))
                    }
                    className="w-full"
                  />
                  <span className="ml-2 text-sm text-gray-600">
                    {mriData.slices.y + 1}/{mriData.dimensions[1]}
                  </span>
                </div>
              </div>

              {/* Z-axis slice (XY plane) */}
              <div className="flex flex-col bg-white rounded-lg shadow p-4">
                <SliceView
                  data={mriData.data}
                  dimensions={mriData.dimensions}
                  sliceIndex={mriData.slices.z}
                  sliceOrientation="z"
                  threshold={threshold}
                />
                <div className="mt-4 flex items-center">
                  <span className="text-sm text-gray-600 mr-2">Slice:</span>
                  <input
                    type="range"
                    min="0"
                    max={mriData.dimensions[2] - 1}
                    value={mriData.slices.z}
                    onChange={(e) =>
                      handleSliceChange("z", parseInt(e.target.value))
                    }
                    className="w-full"
                  />
                  <span className="ml-2 text-sm text-gray-600">
                    {mriData.slices.z + 1}/{mriData.dimensions[2]}
                  </span>
                </div>
              </div>
            </div>
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-lg text-gray-600">
              Tải lên file MRI để xem mô hình
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MriViewer;
