import React, { useMemo } from 'react';
import * as THREE from 'three';

interface MriModelProps {
  data: Float32Array;
  dimensions: [number, number, number];
  threshold: number;
}

const MriModel: React.FC<MriModelProps> = ({ data, dimensions, threshold }) => {
  const geometry = useMemo(() => {
    try {
      const [width, height, depth] = dimensions;
      const vertices: number[] = [];
      const indices: number[] = [];
      const normals: number[] = [];
      let vertexIndex = 0;

      if (!width || !height || !depth || width <= 0 || height <= 0 || depth <= 0) {
        throw new Error('Kích thước không hợp lệ');
      }

      // Marching cubes algorithm implementation
      const getIndex = (x: number, y: number, z: number) => {
        if (x < 0 || y < 0 || z < 0 || x >= width || y >= height || z >= depth) return -1;
        const index = x + y * width + z * width * height;
        return index < data.length ? index : -1;
      };

      const addVertex = (x: number, y: number, z: number) => {
        // Scale and center the vertices
        const maxDim = Math.max(width, height, depth);
        const sx = (x - width/2) / maxDim;
        const sy = (y - height/2) / maxDim;
        const sz = (z - depth/2) / maxDim;
        vertices.push(sx * 2, sy * 2, sz * 2);
        
        // Add a temporary normal that will be recomputed later
        normals.push(0, 0, 0);
        return vertexIndex++;
      };

      // Tối ưu hóa vòng lặp bằng cách giảm số lượng điểm kiểm tra
      const skipFactor = Math.ceil(Math.max(width, height, depth) / 100);

      for (let z = 0; z < depth - 1; z += skipFactor) {
        for (let y = 0; y < height - 1; y += skipFactor) {
          for (let x = 0; x < width - 1; x += skipFactor) {
            const idx = getIndex(x, y, z);
            if (idx === -1) continue;

            if (data[idx] > threshold) {
              // Add cube vertices
              const v0 = addVertex(x, y, z);
              const v1 = addVertex(x + skipFactor, y, z);
              const v2 = addVertex(x, y + skipFactor, z);
              const v3 = addVertex(x + skipFactor, y + skipFactor, z);
              const v4 = addVertex(x, y, z + skipFactor);
              const v5 = addVertex(x + skipFactor, y, z + skipFactor);
              const v6 = addVertex(x, y + skipFactor, z + skipFactor);
              const v7 = addVertex(x + skipFactor, y + skipFactor, z + skipFactor);

              // Add faces (triangles)
              indices.push(
                v0, v1, v2, v2, v1, v3, // front
                v4, v6, v5, v5, v6, v7, // back
                v0, v4, v1, v1, v4, v5, // bottom
                v2, v3, v6, v6, v3, v7, // top
                v0, v2, v4, v4, v2, v6, // left
                v1, v5, v3, v3, v5, v7  // right
              );
            }
          }
        }
      }

      const geometry = new THREE.BufferGeometry();
      
      if (vertices.length === 0) {
        // Add a small invisible cube if no data points meet the threshold
        vertices.push(0,0,0, 0.1,0,0, 0,0.1,0, 0,0,0.1);
        indices.push(0,1,2, 1,2,3);
        normals.push(0,0,1, 0,0,1, 0,0,1, 0,0,1);
      }

      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
      
      return geometry;
    } catch (error) {
      console.error('Error creating geometry:', error);
      // Return a minimal geometry in case of error
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute([0,0,0, 0.1,0,0, 0,0.1,0], 3));
      geometry.setAttribute('normal', new THREE.Float32BufferAttribute([0,0,1, 0,0,1, 0,0,1], 3));
      geometry.setIndex([0,1,2]);
      return geometry;
    }
  }, [data, dimensions, threshold]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial 
        color="#1e40af"
        side={THREE.DoubleSide}
        roughness={0.5}
        metalness={0.1}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
};

export default MriModel;