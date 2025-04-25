import React, { useRef, useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as NiftiReader from 'nifti-reader-js';
import MriModel from './MriModel';

interface MriData {
  data: Float32Array;
  dimensions: [number, number, number];
}

const Scene: React.FC<{ mriData: MriData | null; threshold: number }> = ({ mriData, threshold }) => {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      {mriData && mriData.data && mriData.dimensions && (
        <MriModel
          data={mriData.data}
          dimensions={mriData.dimensions}
          threshold={threshold}
        />
      )}
      <OrbitControls enableDamping dampingFactor={0.05} />
    </>
  );
};

const MriViewer: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mriData, setMriData] = useState<MriData | null>(null);
  const [threshold, setThreshold] = useState(0.5);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        if (!buffer) {
          throw new Error('Không thể đọc file');
        }

        const niftiHeader = NiftiReader.readHeader(buffer);
        if (!niftiHeader) {
          throw new Error('Không thể đọc header của file NIFTI');
        }

        const niftiImage = NiftiReader.readImage(niftiHeader, buffer);
        if (!niftiImage) {
          throw new Error('Không thể đọc dữ liệu hình ảnh NIFTI');
        }

        if (!niftiHeader.dims || niftiHeader.dims.length < 4) {
          throw new Error('File NIFTI không có đủ thông tin về kích thước');
        }

        const datatype = niftiHeader.datatypeCode;
        let data: Float32Array;

        try {
          switch (datatype) {
            case NiftiReader.NIFTI1.TYPE_UINT8:
              data = new Float32Array(new Uint8Array(niftiImage).map(x => x / 255));
              break;
            case NiftiReader.NIFTI1.TYPE_INT16:
              data = new Float32Array(new Int16Array(niftiImage).map(x => x / 32767));
              break;
            case NiftiReader.NIFTI1.TYPE_INT32:
              data = new Float32Array(new Int32Array(niftiImage).map(x => x / 2147483647));
              break;
            case NiftiReader.NIFTI1.TYPE_FLOAT32:
              data = new Float32Array(niftiImage);
              break;
            default:
              data = new Float32Array(new Uint8Array(niftiImage).map(x => x / 255));
          }
        } catch (err) {
          throw new Error('Lỗi khi chuyển đổi dữ liệu hình ảnh');
        }

        const dimensions: [number, number, number] = [
          niftiHeader.dims[1],
          niftiHeader.dims[2],
          niftiHeader.dims[3]
        ];

        if (!data || !dimensions.every(d => d > 0)) {
          throw new Error('Dữ liệu hình ảnh không hợp lệ');
        }

        setMriData({ data, dimensions });
      } catch (error) {
        console.error('Error processing MRI file:', error);
        setError(error instanceof Error ? error.message : 'Có lỗi xảy ra khi xử lý file MRI');
      } finally {
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
      setError('Không thể đọc file. Vui lòng thử lại.');
      setIsLoading(false);
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="w-full h-screen flex flex-col">
      <div className="p-4 bg-white shadow-md">
        <div className="flex items-center gap-4">
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
          
          <div className="flex items-center gap-2">
            <label htmlFor="threshold" className="text-sm font-medium text-gray-700">
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
            <span className="text-sm text-gray-600">{threshold.toFixed(2)}</span>
          </div>
        </div>
        {error && (
          <div className="mt-2 text-red-600 text-sm">
            Lỗi: {error}
          </div>
        )}
      </div>
      
      <div className="flex-1 bg-gray-100">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Suspense fallback={
            <div className="w-full h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
            </div>
          }>
            <Canvas
              camera={{ position: [0, 0, 5], fov: 75 }}
              style={{ background: '#f3f4f6' }}
              gl={{ antialias: true }}
            >
              <Scene mriData={mriData} threshold={threshold} />
            </Canvas>
          </Suspense>
        )}
      </div>
    </div>
  );
};

export default MriViewer;