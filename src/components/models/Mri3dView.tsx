import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import React from "react";
import VolumeMesh from "./VolumeMesh";

const Mri3dView: React.FC<{
  data?: Float32Array;
  dimensions?: [number, number, number];
}> = ({ data, dimensions }) => {
  const h = 512; // frustum height
  const aspect = window.innerWidth / window.innerHeight;
  return (
    <div className="w-full h-full">
			{(dimensions && data) ? (

      <Canvas
        orthographic
        camera={{
          position: [0, 0, 500],
          near: 1,
          far: 1000,
          left: (-h * aspect) / 2,
          right: (h * aspect) / 2,
          top: h / 2,
          bottom: -h / 2,
        }}
      >
        <ambientLight intensity={0.5} />
        <OrbitControls />
          <VolumeMesh
            volume={{
              xLength: dimensions[0],
              yLength: dimensions[1],
              zLength: dimensions[2],
              data: data,
            }}
          />
      </Canvas>
			): <div>dang tai</div>}
    </div>
  );
};

export default Mri3dView;