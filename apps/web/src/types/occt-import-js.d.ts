declare module 'occt-import-js' {
  export interface OcctMesh {
    attributes: {
      position: { array: number[] | Float32Array };
      normal?: { array: number[] | Float32Array };
    };
    index?: { array: number[] | Uint32Array };
    color?: number[];
  }

  export interface OcctResult {
    success: boolean;
    meshes: OcctMesh[];
  }

  export interface OcctInstance {
    ReadStepFile: (buffer: Uint8Array, params: any) => OcctResult;
  }

  export default function initOpenCascade(options?: {
    locateFile?: (path: string) => string;
  }): Promise<OcctInstance>;
}

