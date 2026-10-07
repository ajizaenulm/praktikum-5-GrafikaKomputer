/**
 * math3d.js - Helper Matrix 4x4, Normal Matrix 3x3, dan fungsi matematika 3D
 */

// Konversi nilai sudut dari derajat ke radian
export function degToRad(deg) {
  return (deg * Math.PI) / 180.0;
}

export const Mat4 = {
  // Membuat matriks identitas 4x4
  identity() {
    return new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ]);
  },

  // Matriks rotasi mengelilingi sumbu X
  rotationX(rad) {
    const c = Math.cos(rad);
    const s = Math.sin(rad);
    return new Float32Array([
      1,  0, 0, 0,
      0,  c, s, 0,
      0, -s, c, 0,
      0,  0, 0, 1
    ]);
  },

  // Matriks rotasi mengelilingi sumbu Y
  rotationY(rad) {
    const c = Math.cos(rad);
    const s = Math.sin(rad);
    return new Float32Array([
      c, 0, -s, 0,
      0, 1,  0, 0,
      s, 0,  c, 0,
      0, 0,  0, 1
    ]);
  },

  // Matriks penskalaan 3D (scale X, Y, Z)
  scaling(sx, sy, sz) {
    return new Float32Array([
      sx,  0,  0, 0,
       0, sy,  0, 0,
       0,  0, sz, 0,
       0,  0,  0, 1
    ]);
  },

  // Perkalian dua matriks 4x4: out = a * b (urutan kolom)
  multiply(a, b) {
    const out = new Float32Array(16);
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        out[c * 4 + r] =
          a[0 * 4 + r] * b[c * 4 + 0] +
          a[1 * 4 + r] * b[c * 4 + 1] +
          a[2 * 4 + r] * b[c * 4 + 2] +
          a[3 * 4 + r] * b[c * 4 + 3];
      }
    }
    return out;
  },

  // Matriks View kamera (posisi kamera, titik target, arah atas)
  lookAt(eye, center, up) {
    const eyex = eye[0], eyey = eye[1], eyez = eye[2];
    const upx = up[0], upy = up[1], upz = up[2];
    const targetx = center[0], targety = center[1], targetz = center[2];

    // Vektor arah maju/z (dari target ke mata)
    let z0 = eyex - targetx;
    let z1 = eyey - targety;
    let z2 = eyez - targetz;
    let len = Math.hypot(z0, z1, z2);
    if (len === 0) { z2 = 1; len = 1; }
    z0 /= len; z1 /= len; z2 /= len;

    // Vektor kanan/x (cross product up x z)
    let x0 = upy * z2 - upz * z1;
    let x1 = upz * z0 - upx * z2;
    let x2 = upx * z1 - upy * z0;
    len = Math.hypot(x0, x1, x2);
    if (len === 0) { x0 = 1; len = 1; }
    x0 /= len; x1 /= len; x2 /= len;

    // Vektor atas sebenarnya/y (cross product z x x)
    let y0 = z1 * x2 - z2 * x1;
    let y1 = z2 * x0 - z0 * x2;
    let y2 = z0 * x1 - z1 * x0;

    return new Float32Array([
      x0, y0, z0, 0,
      x1, y1, z1, 0,
      x2, y2, z2, 0,
      -(x0 * eyex + x1 * eyey + x2 * eyez),
      -(y0 * eyex + y1 * eyey + y2 * eyez),
      -(z0 * eyex + z1 * eyey + z2 * eyez),
      1
    ]);
  },

  // Matriks Proyeksi Perspektif (sudut pandang vertikal, rasio aspek, near, far)
  perspective(fovy, aspect, near, far) {
    const f = 1.0 / Math.tan(fovy / 2.0);
    const nf = 1.0 / (near - far);
    return new Float32Array([
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near) * nf, -1,
      0, 0, (2.0 * far * near) * nf, 0
    ]);
  }
};

/**
 * Normal Matrix 3x3 = inverse-transpose dari bagian linier 3x3 Model Matrix.
 * Menjaga vektor normal tetap tegak lurus bidang saat terjadi non-uniform scaling.
 */
export function normalMatrixFromMat4(m) {
  // Ambil elemen submatriks 3x3 teratas dari model matrix
  const a00 = m[0], a01 = m[1], a02 = m[2];
  const a10 = m[4], a11 = m[5], a12 = m[6];
  const a20 = m[8], a21 = m[9], a22 = m[10];

  // Hitung kofaktor untuk determinan dan invers
  const b01 = a22 * a11 - a12 * a21;
  const b11 = -a22 * a10 + a12 * a20;
  const b21 = a21 * a10 - a11 * a20;

  let det = a00 * b01 + a01 * b11 + a02 * b21;

  // Jika matriks tidak dapat diinvers (det mendekati 0), kembalikan matriks identitas 3x3
  if (Math.abs(det) < 0.000001) {
    return new Float32Array([
      1, 0, 0,
      0, 1, 0,
      0, 0, 1
    ]);
  }

  det = 1.0 / det;

  // Hitung elemen invers
  const inv00 = b01 * det;
  const inv01 = (-a22 * a01 + a02 * a21) * det;
  const inv02 = ( a12 * a01 - a02 * a11) * det;

  const inv10 = b11 * det;
  const inv11 = ( a22 * a00 - a02 * a20) * det;
  const inv12 = (-a12 * a00 + a02 * a10) * det;

  const inv20 = b21 * det;
  const inv21 = (-a21 * a00 + a01 * a20) * det;
  const inv22 = ( a11 * a00 - a01 * a10) * det;

  // Return hasil transpose dari matriks inverse (Normal Matrix)
  return new Float32Array([
    inv00, inv10, inv20,
    inv01, inv11, inv21,
    inv02, inv12, inv22
  ]);
}
