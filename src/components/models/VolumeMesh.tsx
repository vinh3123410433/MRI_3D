import React, { useMemo } from 'react';
import * as THREE from 'three';
import { VolumeRenderShader1 } from 'three/examples/jsm/shaders/VolumeShader.js';

// Định nghĩa kiểu cho dữ liệu volume
export interface VolumeData {
  xLength: number;
  yLength: number;
  zLength: number;
  data: Float32Array | undefined;
}

// Định nghĩa kiểu cho props của component
interface VolumeMeshProps {
  volume: VolumeData;
}

// Định nghĩa kiểu cho cmtextures
interface ColormapTextures {
  viridis: THREE.Texture;
  gray: THREE.Texture;
}

const VolumeMesh: React.FC<VolumeMeshProps> = ({ volume }) => {
  if (!volume.data) return null;

  // Tải texture bảng màu
  const cmtextures: ColormapTextures = useMemo(() => {
    const loader = new THREE.TextureLoader();
    return {
      viridis: loader.load('/cm_viridis.png'),
      gray: loader.load('/cm_gray.png'),
    };
  }, []);

  // Tạo texture 3D từ dữ liệu volume
  const texture = useMemo(() => {
    const tex = new THREE.Data3DTexture(volume.data, volume.xLength, volume.yLength, volume.zLength);
    tex.format = THREE.RedFormat;
    tex.type = THREE.FloatType;
    tex.minFilter = tex.magFilter = THREE.LinearFilter;
    tex.unpackAlignment = 1;
    tex.needsUpdate = true;
    return tex;
  }, [volume]);

  // Thiết lập uniforms cho shader với các giá trị mặc định
  const uniforms = useMemo(() => {
    const unis = THREE.UniformsUtils.clone(VolumeRenderShader1.uniforms);
    unis.u_data.value = texture;
    unis.u_size.value = new THREE.Vector3(volume.xLength, volume.yLength, volume.zLength);
    unis.u_clim.value = new THREE.Vector2(0, 1); // Giới hạn tương phản mặc định
    unis.u_renderstyle.value = 1; // Isosurface mặc định
    unis.u_renderthreshold.value = 0.15; // Ngưỡng isosurface mặc định
    unis.u_cmdata.value = cmtextures.viridis; // Bảng màu mặc định
    return unis;
  }, [texture, cmtextures, volume]);

  const createBoxGeometry = () => {
    const { xLength, yLength, zLength } = volume;
    const geometry = new THREE.BoxGeometry(xLength, yLength, zLength);
    geometry.translate(
      xLength / 2 - 0.5,
      yLength / 2 - 0.5,
      zLength / 2 - 0.5
    );
    return geometry;
  };

  // Hiển thị lưới
  return (
    <mesh geometry={createBoxGeometry()} position={[-(volume.xLength / 2 - 0.5), -(volume.yLength / 2 - 0.5), -(volume.zLength / 2 - 0.5)]}>
      {/* <boxGeometry args={[volume.xLength, volume.yLength, volume.zLength]}/> */}
      <shaderMaterial
        attach="material"
        uniforms={uniforms}
        vertexShader={VolumeRenderShader1.vertexShader}
        fragmentShader={VolumeRenderShader1.fragmentShader}
        side={THREE.BackSide}
      />
       {/* <Helper type={THREE.BoxHelper} args={['royalblue']} /> */}
    </mesh>
  );
};

export default VolumeMesh;