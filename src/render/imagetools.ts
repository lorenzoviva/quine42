// No images any more (step 9, F3): the 2D renderer and the UI still ask for pictures by id until the
// 3D renderer replaces them (F4), and there are none, so everything is drawn procedurally.

export class ImageCache {
  peek(_id: string | undefined): HTMLImageElement | undefined {
    return undefined;
  }
  inkOf(_id: string | undefined): { ink: number; h: number } | undefined {
    return undefined;
  }
  async url(_id: string): Promise<string | undefined> {
    return undefined;
  }
}
