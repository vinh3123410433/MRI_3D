import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import * as NiftiReader from "nifti-reader-js";
import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

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

// 3D Model Component
const MriModel: React.FC<{
  data: Float32Array;
  dimensions: [number, number, number];
  threshold: number;
}> = ({ data, dimensions, threshold }) => {
  const geometry = useMemo(() => {
    try {
      const [width, height, depth] = dimensions;
      const vertices: number[] = [];
      const indices: number[] = [];
      const normals: number[] = [];
      const colors: number[] = []; // Màu sắc cơ bản
      const opacities: number[] = []; // Thêm mảng lưu độ trong suốt
      const intensities: number[] = []; // Thêm mảng lưu cường độ sáng
      let vertexIndex = 0;

      if (
        !width ||
        !height ||
        !depth ||
        width <= 0 ||
        height <= 0 ||
        depth <= 0
      ) {
        throw new Error("Kích thước không hợp lệ");
      }

      console.log(`Dimensions: ${width}x${height}x${depth}, data length: ${data.length}`);
      console.time("createMesh");
      
      // Tìm giá trị min và max để chuẩn hóa màu sắc
      let minVal = Number.MAX_VALUE;
      let maxVal = Number.MIN_VALUE;
      
      for (let i = 0; i < data.length; i++) {
        if (data[i] > threshold) {
          minVal = Math.min(minVal, data[i]);
          maxVal = Math.max(maxVal, data[i]);
        }
      }
      
      if (minVal === Number.MAX_VALUE) {
        minVal = 0;
        maxVal = 1;
      }
      
      console.log(`Value range for color mapping: ${minVal} - ${maxVal}`);
      
      // Hàm chuyển đổi giá trị thành màu sắc RGB với độ trong suốt và độ sáng
      const valueToColorAndOpacity = (value: number): {color: [number, number, number], opacity: number, intensity: number} => {
        if (value <= threshold) return {color: [0, 0, 0], opacity: 0, intensity: 0}; // Dưới ngưỡng -> đen (không hiển thị)
        
        // Chuẩn hóa giá trị về khoảng 0-1
        const normalizedValue = (value - minVal) / (maxVal - minVal);
        
        // Tính độ trong suốt - giá trị cao thì trong suốt thấp hơn (đậm hơn)
        // Phạm vi từ 0.3 đến 1.0 để đảm bảo luôn nhìn thấy được phần nào đó
        const opacity = 0.3 + (normalizedValue * 0.7);
        
        // Tính cường độ ánh sáng - giá trị cao thì sáng hơn
        // Phạm vi từ 0.7 đến 1.3 để tránh quá tối hoặc quá sáng
        const intensity = 0.7 + (normalizedValue * 0.6);
        
        // Áp dụng colormap - tương tự như trước
        let color: [number, number, number];
        if (normalizedValue < 0.25) {
          // Xanh dương đến xanh lục
          const t = normalizedValue * 4;
          color = [0, t, 1 - t/2];
        } else if (normalizedValue < 0.5) {
          // Xanh lục đến vàng
          const t = (normalizedValue - 0.25) * 4;
          color = [t, 1, 1 - t];
        } else if (normalizedValue < 0.75) {
          // Vàng đến đỏ
          const t = (normalizedValue - 0.5) * 4;
          color = [1, 1 - t, 0];
        } else {
          // Đỏ đến đỏ đậm
          const t = (normalizedValue - 0.75) * 4;
          color = [1, 0, t/2]; // Thêm chút xanh tím vào đỏ đậm
        }
        
        return {color, opacity, intensity};
      };
      
      // Tạo mảng 3D để đánh dấu giá trị voxel có vượt ngưỡng không
      // Sử dụng Uint8Array để tiết kiệm bộ nhớ (0 = dưới ngưỡng, 1 = trên ngưỡng)
      const voxelValues = new Uint8Array(width * height * depth);
      
      // Bước 1: Xác định tất cả voxel vượt ngưỡng
      console.time("identifyActiveVoxels");
      let activeVoxelCount = 0;
      for (let z = 0; z < depth; z++) {
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const index = x + y * width + z * width * height;
            if (data[index] > threshold) {
              voxelValues[index] = 1;
              activeVoxelCount++;
            } else {
              voxelValues[index] = 0;
            }
          }
        }
      }
      console.timeEnd("identifyActiveVoxels");
      console.log(`Found ${activeVoxelCount} active voxels out of ${data.length}`);
      
      if (activeVoxelCount === 0) {
        console.log("No active voxels found");
        return new THREE.BufferGeometry();
      }
      
      // Hàm helper để kiểm tra xem một voxel có vượt ngưỡng hay không
      const isActive = (x: number, y: number, z: number): boolean => {
        if (x < 0 || y < 0 || z < 0 || x >= width || y >= height || z >= depth) {
          return false;
        }
        return voxelValues[x + y * width + z * width * height] === 1;
      };
      
      // Hàm lấy giá trị dữ liệu tại vị trí x, y, z
      const getValue = (x: number, y: number, z: number): number => {
        if (x < 0 || y < 0 || z < 0 || x >= width || y >= height || z >= depth) {
          return 0;
        }
        return data[x + y * width + z * width * height];
      };
      
      // Hàm thêm đỉnh vào danh sách, giờ đây cũng thêm thông tin màu sắc, độ trong suốt và cường độ
      const addVertex = (x: number, y: number, z: number) => {
        // Scale and center the vertices
        const maxDim = Math.max(width, height, depth);
        const sx = (x - width / 2) / maxDim;
        const sy = (y - height / 2) / maxDim;
        const sz = (z - depth / 2) / maxDim;
        vertices.push(sx * 2, sy * 2, sz * 2);

        // Lấy giá trị dữ liệu tại vị trí này và chuyển đổi thành màu và độ trong suốt
        const value = getValue(x, y, z);
        const {color: [r, g, b], opacity, intensity} = valueToColorAndOpacity(value);
        colors.push(r, g, b);
        opacities.push(opacity);
        intensities.push(intensity);
        
        // Add a temporary normal that will be recomputed later
        normals.push(0, 0, 0);
        return vertexIndex++;
      };
      
      // Xác định mức độ chi tiết dựa trên kích thước
      const maxDimension = Math.max(width, height, depth);
      const skipFactor = maxDimension > 300 ? 3 : (maxDimension > 200 ? 2 : 1);
			// const skipFactor = 4;
      
      // Bước 2: Xác định và tạo các mặt chỉ cho những voxel ở bề mặt
      let surfaceVoxelCount = 0;
      let skippedFacesCount = 0;
      let addedFacesCount = 0;
      
      console.time("createSurfaceFaces");
      
      // Vertex cache dùng để lưu trữ vị trí của các đỉnh đã tạo
      // Cấu trúc: {x_y_z: index}
      const vertexCache: { [key: string]: number } = {};
      
      // Hàm helper để lấy đỉnh từ cache hoặc tạo mới
      const getOrCreateVertex = (x: number, y: number, z: number): number => {
        const key = `${x}_${y}_${z}`;
        if (vertexCache[key] === undefined) {
          vertexCache[key] = addVertex(x, y, z);
        }
        return vertexCache[key];
      };
      
      for (let z = 0; z < depth; z += skipFactor) {
        for (let y = 0; y < height; y += skipFactor) {
          for (let x = 0; x < width; x += skipFactor) {
            const voxelActive = isActive(x, y, z);
            if (!voxelActive) continue;
            
            // Kiểm tra xem đây có phải là voxel bề mặt không bằng cách kiểm tra 6 hướng
            const directions = [
              [-skipFactor, 0, 0], // Left (-X)
              [skipFactor, 0, 0],  // Right (+X)
              [0, -skipFactor, 0], // Bottom (-Y)
              [0, skipFactor, 0],  // Top (+Y)
              [0, 0, -skipFactor], // Back (-Z)
              [0, 0, skipFactor]   // Front (+Z)
            ];
            
            let isSurfaceVoxel = false;
            for (const [dx, dy, dz] of directions) {
              const nx = x + dx;
              const ny = y + dy;
              const nz = z + dz;
              
              if (!isActive(nx, ny, nz)) {
                isSurfaceVoxel = true;
                break;
              }
            }
            
            if (isSurfaceVoxel) {
              surfaceVoxelCount++;
              
              // Mặt Left (-X)
              if (!isActive(x - skipFactor, y, z)) {
                const v0 = getOrCreateVertex(x, y, z);
                const v1 = getOrCreateVertex(x, y + skipFactor, z);
                const v2 = getOrCreateVertex(x, y, z + skipFactor);
                const v3 = getOrCreateVertex(x, y + skipFactor, z + skipFactor);
                indices.push(v0, v1, v2, v2, v1, v3);
                addedFacesCount++;
              } else {
                skippedFacesCount++;
              }
              
              // Mặt Right (+X)
              if (!isActive(x + skipFactor, y, z)) {
                const v0 = getOrCreateVertex(x + skipFactor, y, z);
                const v1 = getOrCreateVertex(x + skipFactor, y, z + skipFactor);
                const v2 = getOrCreateVertex(x + skipFactor, y + skipFactor, z);
                const v3 = getOrCreateVertex(x + skipFactor, y + skipFactor, z + skipFactor);
                indices.push(v0, v1, v2, v2, v1, v3);
                addedFacesCount++;
              } else {
                skippedFacesCount++;
              }
              
              // Mặt Bottom (-Y)
              if (!isActive(x, y - skipFactor, z)) {
                const v0 = getOrCreateVertex(x, y, z);
                const v1 = getOrCreateVertex(x, y, z + skipFactor);
                const v2 = getOrCreateVertex(x + skipFactor, y, z);
                const v3 = getOrCreateVertex(x + skipFactor, y, z + skipFactor);
                indices.push(v0, v1, v2, v2, v1, v3);
                addedFacesCount++;
              } else {
                skippedFacesCount++;
              }
              
              // Mặt Top (+Y)
              if (!isActive(x, y + skipFactor, z)) {
                const v0 = getOrCreateVertex(x, y + skipFactor, z);
                const v1 = getOrCreateVertex(x + skipFactor, y + skipFactor, z);
                const v2 = getOrCreateVertex(x, y + skipFactor, z + skipFactor);
                const v3 = getOrCreateVertex(x + skipFactor, y + skipFactor, z + skipFactor);
                indices.push(v0, v1, v2, v2, v1, v3);
                addedFacesCount++;
              } else {
                skippedFacesCount++;
              }
              
              // Mặt Back (-Z)
              if (!isActive(x, y, z - skipFactor)) {
                const v0 = getOrCreateVertex(x, y, z);
                const v1 = getOrCreateVertex(x + skipFactor, y, z);
                const v2 = getOrCreateVertex(x, y + skipFactor, z);
                const v3 = getOrCreateVertex(x + skipFactor, y + skipFactor, z);
                indices.push(v0, v1, v2, v2, v1, v3);
                addedFacesCount++;
              } else {
                skippedFacesCount++;
              }
              
              // Mặt Front (+Z)
              if (!isActive(x, y, z + skipFactor)) {
                const v0 = getOrCreateVertex(x, y, z + skipFactor);
                const v1 = getOrCreateVertex(x, y + skipFactor, z + skipFactor);
                const v2 = getOrCreateVertex(x + skipFactor, y, z + skipFactor);
                const v3 = getOrCreateVertex(x + skipFactor, y + skipFactor, z + skipFactor);
                indices.push(v0, v1, v2, v2, v1, v3);
                addedFacesCount++;
              } else {
                skippedFacesCount++;
              }
            }
          }
        }
      }
      
      console.timeEnd("createSurfaceFaces");
      console.log(`Created ${surfaceVoxelCount} surface voxels`);
      console.log(`Added ${addedFacesCount} faces, skipped ${skippedFacesCount} internal faces`);
      console.log(`Created ${vertices.length/3} vertices (${Object.keys(vertexCache).length} unique), ${indices.length/3} triangles`);
      
      // Bước 3: Tạo và trả về geometry
      const geometry = new THREE.BufferGeometry();
      
      if (vertices.length === 0) {
        console.log("No vertices created");
        return new THREE.BufferGeometry();
      }

      geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(vertices, 3)
      );
      geometry.setAttribute(
        "normal",
        new THREE.Float32BufferAttribute(normals, 3)
      );
      // Thêm thuộc tính màu sắc vào geometry
      geometry.setAttribute(
        "color",
        new THREE.Float32BufferAttribute(colors, 3)
      );
      
      // Thêm thuộc tính độ trong suốt và cường độ như là thuộc tính tùy chỉnh
      geometry.setAttribute(
        "opacity",
        new THREE.Float32BufferAttribute(opacities, 1)
      );
      geometry.setAttribute(
        "intensity",
        new THREE.Float32BufferAttribute(intensities, 1)
      );
      
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
      
      console.timeEnd("createMesh");
      return geometry;
    } catch (error) {
      console.error("Error creating geometry:", error);
      return new THREE.BufferGeometry();
    }
  }, [data, dimensions, threshold]);

  // Shader tùy chỉnh cho phép điều chỉnh độ trong suốt theo từng vertex
  const materialProps = useMemo(() => ({
    vertexColors: true,
    transparent: true,
    side: THREE.FrontSide,
    roughness: 0.5,
    metalness: 0.2,
    onBeforeCompile: (shader: any) => {
      // Sửa đổi vertex shader để truyền độ trong suốt và cường độ sáng
      shader.vertexShader = shader.vertexShader
        .replace(
          'varying vec3 vViewPosition;',
          'varying vec3 vViewPosition;\nattribute float opacity;\nattribute float intensity;\nvarying float vOpacity;\nvarying float vIntensity;'
        )
        .replace(
          '#include <begin_vertex>',
          '#include <begin_vertex>\nvOpacity = opacity;\nvIntensity = intensity;'
        );

      // Sửa đổi fragment shader để sử dụng độ trong suốt theo vertex
      shader.fragmentShader = shader.fragmentShader
        .replace(
          'varying vec3 vViewPosition;',
          'varying vec3 vViewPosition;\nvarying float vOpacity;\nvarying float vIntensity;'
        )
        .replace(
          '#include <map_fragment>',
          '#include <map_fragment>\ndiffuseColor.rgb *= vIntensity;' // Áp dụng cường độ sáng
        )
        .replace(
          'gl_FragColor = vec4( outgoingLight, diffuseColor.a );',
          'gl_FragColor = vec4( outgoingLight, vOpacity );' // Sử dụng độ trong suốt từ vertex
        );
    }
  }), []);

  return (
    <mesh geometry={geometry}>
      <meshPhysicalMaterial {...materialProps} />
    </mesh>
  );
};

// 3D Scene
const Scene: React.FC<{ mriData: MriData | null; threshold: number }> = ({
  mriData,
  threshold,
}) => {
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
  const [viewMode, setViewMode] = useState<"3d" | "slices">("slices");
  // Thêm state cho các file mẫu
  const [sampleFiles, setSampleFiles] = useState<{name: string, url: string}[]>([
    { name: "Brain MRI Sample", url: "/samples/brain_sample.nii.gz" },
    { name: "Chest MRI Sample", url: "/samples/chest_sample.nii.gz" },
    { name: "Knee MRI Sample", url: "/samples/knee_sample.nii.gz" }
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

      // Đọc dữ liệu và chuẩn hóa thành Float32Array với giá trị trong khoảng 0-1
      let rawData: Float32Array;
      const datatype = niftiHeader.datatypeCode;

      try {
        // Đọc dữ liệu với đúng định dạng
        switch (datatype) {
          case NiftiReader.NIFTI1.TYPE_UINT8:
            const uint8Data = new Uint8Array(niftiImage);
            rawData = new Float32Array(uint8Data.length);
            for (let i = 0; i < uint8Data.length; i++) {
              rawData[i] = uint8Data[i] / 255;
            }
            break;

          case NiftiReader.NIFTI1.TYPE_INT8:
            const int8Data = new Int8Array(niftiImage);
            rawData = new Float32Array(int8Data.length);
            for (let i = 0; i < int8Data.length; i++) {
              rawData[i] = (int8Data[i] + 128) / 255; // Từ -128..127 sang 0..1
            }
            break;

          case NiftiReader.NIFTI1.TYPE_UINT16:
            const uint16Data = new Uint16Array(niftiImage);
            rawData = new Float32Array(uint16Data.length);
            for (let i = 0; i < uint16Data.length; i++) {
              rawData[i] = uint16Data[i] / 65535;
            }
            break;

          case NiftiReader.NIFTI1.TYPE_INT16:
            const int16Data = new Int16Array(niftiImage);
            rawData = new Float32Array(int16Data.length);
            for (let i = 0; i < int16Data.length; i++) {
              rawData[i] = (int16Data[i] + 32768) / 65535; // Từ -32768..32767 sang 0..1
            }
            break;

          case NiftiReader.NIFTI1.TYPE_UINT32:
            const uint32Data = new Uint32Array(niftiImage);
            rawData = new Float32Array(uint32Data.length);
            for (let i = 0; i < uint32Data.length; i++) {
              rawData[i] = uint32Data[i] / 4294967295;
            }
            break;

          case NiftiReader.NIFTI1.TYPE_INT32:
            const int32Data = new Int32Array(niftiImage);
            rawData = new Float32Array(int32Data.length);
            for (let i = 0; i < int32Data.length; i++) {
              rawData[i] = (int32Data[i] + 2147483648) / 4294967295; // Từ -2147483648..2147483647 sang 0..1
            }
            break;

          case NiftiReader.NIFTI1.TYPE_FLOAT32:
            const float32Data = new Float32Array(niftiImage);
            
            // Tìm min và max để chuẩn hóa
            let minVal = Infinity;
            let maxVal = -Infinity;
            for (let i = 0; i < float32Data.length; i++) {
              minVal = Math.min(minVal, float32Data[i]);
              maxVal = Math.max(maxVal, float32Data[i]);
            }
            
            // Chuẩn hóa về 0-1
            rawData = new Float32Array(float32Data.length);
            const range = maxVal - minVal;
            if (range === 0) {
              // Tất cả các giá trị giống nhau
              rawData.fill(0.5);
            } else {
              for (let i = 0; i < float32Data.length; i++) {
                rawData[i] = (float32Data[i] - minVal) / range;
              }
            }
            
            console.log(`Float data normalized: min=${minVal}, max=${maxVal}`);
            break;

          case NiftiReader.NIFTI1.TYPE_FLOAT64:
            const float64Data = new Float64Array(niftiImage);
            
            // Tìm min và max để chuẩn hóa
            let minVal64 = Infinity;
            let maxVal64 = -Infinity;
            for (let i = 0; i < float64Data.length; i++) {
              minVal64 = Math.min(minVal64, float64Data[i]);
              maxVal64 = Math.max(maxVal64, float64Data[i]);
            }
            
            // Chuẩn hóa về 0-1
            rawData = new Float32Array(float64Data.length);
            const range64 = maxVal64 - minVal64;
            if (range64 === 0) {
              // Tất cả các giá trị giống nhau
              rawData.fill(0.5);
            } else {
              for (let i = 0; i < float64Data.length; i++) {
                rawData[i] = (float64Data[i] - minVal64) / range64;
              }
            }
            
            console.log(`Float64 data normalized: min=${minVal64}, max=${maxVal64}`);
            break;

          default:
            throw new Error(`Không hỗ trợ định dạng dữ liệu: ${datatype}`);
        }
      } catch (err) {
        console.error("Lỗi khi xử lý dữ liệu:", err);
        throw new Error("Lỗi khi chuyển đổi dữ liệu hình ảnh");
      }

      if (!rawData || !dimensions.every((d) => d > 0)) {
        throw new Error("Dữ liệu hình ảnh không hợp lệ");
      }

      // Initialize with middle slices for each dimension
      const middleX = Math.floor(dimensions[0] / 2);
      const middleY = Math.floor(dimensions[1] / 2);
      const middleZ = Math.floor(dimensions[2] / 2);

      setMriData({
        data: rawData,
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
      <div className="p-4 bg-white shadow-md">
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
          
            {/* Menu dropdown cho file mẫu */}
            <div className="relative">
              <button
                onClick={() => setShowSampleDropdown(!showSampleDropdown)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                type="button"
              >
                Load từ server
              </button>
              {showSampleDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-10">
                  <ul className="py-1">
                    {sampleFiles.map((file, index) => (
                      <li key={index}>
                        <button
                          onClick={() => loadSampleFile(file.url)}
                          className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100"
                        >
                          {file.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
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
            <div className="w-full h-full">
              <Canvas
                camera={{ position: [0, 0, 5], fov: 75 }}
                style={{ background: "#f3f4f6" }}
                gl={{ antialias: true }}
              >
                <Scene mriData={mriData} threshold={threshold} />
              </Canvas>
            </div>
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
