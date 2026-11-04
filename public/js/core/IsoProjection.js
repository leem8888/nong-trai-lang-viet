// World coordinates remain the server's Cartesian coordinates. Only drawing and hit testing are projected.
export const ISO_X = 0.78;
export const ISO_Y = 0.39;

export function project(x, y, worldHeight) {
  return { x: (x - y + worldHeight) * ISO_X, y: (x + y) * ISO_Y };
}

export function unproject(x, y, worldHeight) {
  const difference = x / ISO_X - worldHeight;
  const sum = y / ISO_Y;
  return { x: (sum + difference) / 2, y: (sum - difference) / 2 };
}
