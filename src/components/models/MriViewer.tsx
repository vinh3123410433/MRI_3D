import * as NiftiReader from "nifti-reader-js";
import React, { useEffect, useRef, useState } from "react";
import Mri3dView from "./Mri3dView";
import { SliceView } from "./SliceView";

interface MriData {
  data: Float32Array;
  dimensions: [number, number, number];
}

function useMriLoader({ url, file }: { url?: string; file?: File }): [MriData| undefined, Error | undefined] {
  const [mriData, setMriData] = useState<MriData>();
	const [err, setErr] = useState()

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
      });
    } catch (error) {
      console.error("Error processing NIFTI buffer:", error);
    }
  };

  useEffect(() => {
    if (url && file) {
      throw new Error("url or file not both");
    }

    if (url) {
      fetch(url)
        .then((e) => e.arrayBuffer())
        .then(processNiftiBuffer);
    } else if (file) {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer;
          processNiftiBuffer(buffer);
        } catch (error) {
          console.error("Error processing MRI file:", error);
        }
      };

      reader.onerror = (err) => {
        console.error(err);
      };

      reader.readAsArrayBuffer(file);
    }
  }, [url, file]);

  return [mriData, err];
}


const MriViewer: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
	const [file, setFile] = useState<File>()
  const [mriData, error] = useMriLoader({file})
  const [viewMode, setViewMode] = useState<"3d" | "slices">("3d");

  const toggleViewMode = () => {
    setViewMode(viewMode === "3d" ? "slices" : "3d");
  };


	const handleFileUpload = () => {
		setFile(fileInputRef.current?.files?.[0] || undefined)
	}

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

        {error && <div className="mt-2 text-red-600 text-sm">Lỗi: {String(error)}</div>}
      </div>

      <div className="flex-1 bg-gray-100 p-4 overflow-auto">
        {mriData ? (
          viewMode === "3d" ? (
            <Mri3dView
              data={mriData.data}
              dimensions={mriData.dimensions}
            ></Mri3dView>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
							<SliceView data={mriData.data} dimensions={mriData.dimensions} sliceOrientation="x"/>
							<SliceView data={mriData.data} dimensions={mriData.dimensions} sliceOrientation="y"/>
							<SliceView data={mriData.data} dimensions={mriData.dimensions} sliceOrientation="z"/>
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
