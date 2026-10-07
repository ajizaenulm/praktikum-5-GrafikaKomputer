/**
 * main.js - Textured and Lit Cube Playground
 * WebGL2 Lighting, Shading & Texture (Praktikum Grafika Komputer Pertemuan 5)
 */

import { Mat4, degToRad, normalMatrixFromMat4 } from "./math3d.js";

// ==========================================
// 1. Inisialisasi WebGL2 Context & Depth Test
// ==========================================
const canvas = document.getElementById("glCanvas");
const gl = canvas.getContext("webgl2");

if (!gl) {
  throw new Error("WebGL2 tidak tersedia.");
}

// Aktifkan depth buffer agar objek 3D ter-render dengan urutan kedalaman yang benar
gl.enable(gl.DEPTH_TEST);

// ==========================================
// 2. Data Geometri Kubus (36 Vertex / 12 Segitiga)
// ==========================================
// Setiap sisi kubus terdiri dari 2 segitiga (6 vertex)
const positions = new Float32Array([
  // Sisi Depan (Z = +0.5)
  -0.5, -0.5,  0.5,
   0.5, -0.5,  0.5,
   0.5,  0.5,  0.5,
  -0.5, -0.5,  0.5,
   0.5,  0.5,  0.5,
  -0.5,  0.5,  0.5,

  // Sisi Belakang (Z = -0.5)
   0.5, -0.5, -0.5,
  -0.5, -0.5, -0.5,
  -0.5,  0.5, -0.5,
   0.5, -0.5, -0.5,
  -0.5,  0.5, -0.5,
   0.5,  0.5, -0.5,

  // Sisi Kiri (X = -0.5)
  -0.5, -0.5, -0.5,
  -0.5, -0.5,  0.5,
  -0.5,  0.5,  0.5,
  -0.5, -0.5, -0.5,
  -0.5,  0.5,  0.5,
  -0.5,  0.5, -0.5,

  // Sisi Kanan (X = +0.5)
   0.5, -0.5,  0.5,
   0.5, -0.5, -0.5,
   0.5,  0.5, -0.5,
   0.5, -0.5,  0.5,
   0.5,  0.5, -0.5,
   0.5,  0.5,  0.5,

  // Sisi Atas (Y = +0.5)
  -0.5,  0.5,  0.5,
   0.5,  0.5,  0.5,
   0.5,  0.5, -0.5,
  -0.5,  0.5,  0.5,
   0.5,  0.5, -0.5,
  -0.5,  0.5, -0.5,

  // Sisi Bawah (Y = -0.5)
  -0.5, -0.5, -0.5,
   0.5, -0.5, -0.5,
   0.5, -0.5,  0.5,
  -0.5, -0.5, -0.5,
   0.5, -0.5,  0.5,
  -0.5, -0.5,  0.5
]);

// ==========================================
// 3. Normal Data untuk Flat Shading (Face Normals)
// ==========================================
// Tiap face memakai satu arah vektor tegak lurus yang sama
const flatNormals = new Float32Array([
  // Depan: normal menghadap +Z
   0,  0,  1,   0,  0,  1,   0,  0,  1,
   0,  0,  1,   0,  0,  1,   0,  0,  1,
  // Belakang: normal menghadap -Z
   0,  0, -1,   0,  0, -1,   0,  0, -1,
   0,  0, -1,   0,  0, -1,   0,  0, -1,
  // Kiri: normal menghadap -X
  -1,  0,  0,  -1,  0,  0,  -1,  0,  0,
  -1,  0,  0,  -1,  0,  0,  -1,  0,  0,
  // Kanan: normal menghadap +X
   1,  0,  0,   1,  0,  0,   1,  0,  0,
   1,  0,  0,   1,  0,  0,   1,  0,  0,
  // Atas: normal menghadap +Y
   0,  1,  0,   0,  1,  0,   0,  1,  0,
   0,  1,  0,   0,  1,  0,   0,  1,  0,
  // Bawah: normal menghadap -Y
   0, -1,  0,   0, -1,  0,   0, -1,  0,
   0, -1,  0,   0, -1,  0,   0, -1,  0
]);

// ==========================================
// 4. Normal Data untuk Smooth Shading (Vertex Normals)
// ==========================================
// Menghitung vektor dari pusat kubus ke tiap titik sudut untuk efek membulat
function createSmoothNormals(positions) {
  const normals = new Float32Array(positions.length);

  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];
    const length = Math.hypot(x, y, z);

    // Normalisasi vektor ke panjang 1 unit
    normals[i]     = x / length;
    normals[i + 1] = y / length;
    normals[i + 2] = z / length;
  }

  return normals;
}

const smoothNormals = createSmoothNormals(positions);

// ==========================================
// 5. Data Koordinat Tekstur UV
// ==========================================
// Memetakan rentang (0,0) s.d. (1,1) ke kedua segitiga pada tiap sisi kubus
function createCubeUVs() {
  const faceUV = [
    0, 0,
    1, 0,
    1, 1,

    0, 0,
    1, 1,
    0, 1
  ];

  const uv = [];
  for (let face = 0; face < 6; face++) {
    uv.push(...faceUV);
  }

  return new Float32Array(uv);
}

const texCoords = createCubeUVs();

// ==========================================
// 6. Vertex Shader
// ==========================================
// Menghitung posisi dunia, transformasi normal dengan Normal Matrix, dan skala UV
const vertexShaderSource = `#version 300 es

in vec3 a_position;
in vec3 a_normal;
in vec2 a_texCoord;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;
uniform mat3 u_normalMatrix;
uniform float u_uvScale;

out vec3 v_worldPosition;
out vec3 v_normal;
out vec2 v_texCoord;

void main() {
  // Posisi vertex dalam koordinat dunia (World Space)
  vec4 worldPosition = u_model * vec4(a_position, 1.0);
  v_worldPosition = worldPosition.xyz;

  // Transformasi vektor normal dengan Normal Matrix 3x3
  v_normal = u_normalMatrix * a_normal;

  // Kalikan UV dengan faktor skala untuk eksperimen wrapping
  v_texCoord = a_texCoord * u_uvScale;

  // Posisi akhir pada layar (Clip Space)
  gl_Position = u_projection * u_view * worldPosition;
}
`;

// ==========================================
// 7. Fragment Shader — Lighting & Tekstur
// ==========================================
// Mengimplementasikan Phong Reflection Model (Ambient, Diffuse, Specular) + Texture Sampling
const fragmentShaderSource = `#version 300 es

precision highp float;

in vec3 v_worldPosition;
in vec3 v_normal;
in vec2 v_texCoord;

uniform vec3 u_lightPosition;
uniform vec3 u_lightColor;
uniform vec3 u_cameraPosition;

uniform float u_ambientStrength;
uniform float u_shininess;

// Toggle komponen pencahayaan (Challenge F)
uniform float u_ambientOn;
uniform float u_diffuseOn;
uniform float u_specularOn;

uniform sampler2D u_texture;

out vec4 outColor;

void main() {
  // Normalisasi ulang vektor normal hasil interpolasi rasterisasi
  vec3 N = normalize(v_normal);

  // Vektor arah dari permukaan ke sumber cahaya
  vec3 L = normalize(u_lightPosition - v_worldPosition);

  // Vektor arah dari permukaan ke kamera/mata
  vec3 V = normalize(u_cameraPosition - v_worldPosition);

  // Diffuse Lambertian: perkalian titik N dan L
  float diff = max(dot(N, L), 0.0);

  // Vektor pantulan sinar cermin R
  vec3 R = reflect(-L, N);

  // Specular Phong: kilau pantulan tajam jika permukaan menghadap cahaya
  float spec = 0.0;
  if (diff > 0.0) {
    spec = pow(max(dot(R, V), 0.0), u_shininess);
  }

  // Sampling warna dari tekstur 2D sebagai base color
  vec3 texColor = texture(u_texture, v_texCoord).rgb;

  // Gabungan ketiga komponen pencahayaan
  vec3 ambient  = u_ambientOn  * (u_ambientStrength * texColor);
  vec3 diffuse  = u_diffuseOn  * (diff * u_lightColor * texColor);
  vec3 specular = u_specularOn * (spec * u_lightColor);

  vec3 finalColor = ambient + diffuse + specular;
  outColor = vec4(finalColor, 1.0);
}
`;

// ==========================================
// 8. Helper Kompilasi Shader & Linking Program
// ==========================================
// Kompilasi shader sumber GLSL
function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error("Shader compile error:\n" + info);
  }

  return shader;
}

// Menggabungkan Vertex Shader dan Fragment Shader menjadi program WebGL
function createProgram(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error("Program link error:\n" + info);
  }

  return program;
}

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
const program = createProgram(gl, vertexShader, fragmentShader);
gl.useProgram(program);

// ==========================================
// 9. Lokasi Attributes dan Uniforms
// ==========================================
const positionLocation = gl.getAttribLocation(program, "a_position");
const normalLocation   = gl.getAttribLocation(program, "a_normal");
const texCoordLocation = gl.getAttribLocation(program, "a_texCoord");

const modelLocation        = gl.getUniformLocation(program, "u_model");
const viewLocation         = gl.getUniformLocation(program, "u_view");
const projectionLocation   = gl.getUniformLocation(program, "u_projection");
const normalMatrixLocation = gl.getUniformLocation(program, "u_normalMatrix");

const lightPositionLocation   = gl.getUniformLocation(program, "u_lightPosition");
const lightColorLocation      = gl.getUniformLocation(program, "u_lightColor");
const cameraPositionLocation  = gl.getUniformLocation(program, "u_cameraPosition");

const ambientLocation   = gl.getUniformLocation(program, "u_ambientStrength");
const shininessLocation = gl.getUniformLocation(program, "u_shininess");
const textureLocation   = gl.getUniformLocation(program, "u_texture");
const uvScaleLocation   = gl.getUniformLocation(program, "u_uvScale");

// Lokasi uniform toggle komponen lighting (Challenge F)
const ambientOnLocation  = gl.getUniformLocation(program, "u_ambientOn");
const diffuseOnLocation  = gl.getUniformLocation(program, "u_diffuseOn");
const specularOnLocation = gl.getUniformLocation(program, "u_specularOn");

// ==========================================
// 10. Pembuatan Buffer GPU (VBO)
// ==========================================
function createArrayBuffer(data) {
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  return buffer;
}

const positionBuffer     = createArrayBuffer(positions);
const flatNormalBuffer   = createArrayBuffer(flatNormals);
const smoothNormalBuffer = createArrayBuffer(smoothNormals);
const texCoordBuffer     = createArrayBuffer(texCoords);

// Helper untuk mengaktifkan dan mengikat buffer ke attribute shader
function setupAttribute(buffer, location, size) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.enableVertexAttribArray(location);
  gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
}

// Inisialisasi binding posisi dan koordinat tekstur
setupAttribute(positionBuffer, positionLocation, 3);
setupAttribute(texCoordBuffer, texCoordLocation, 2);

// ==========================================
// 11. Pembuatan Tekstur Prosedural Checkerboard
// ==========================================
// Membuat tekstur 64x64 via Canvas 2D agar bebas dari kendala CORS
function createCheckerTexture() {
  const size = 64;
  const source = document.createElement("canvas");
  source.width = size;
  source.height = size;
  const ctx = source.getContext("2d");

  const cells = 8;
  const cellSize = size / cells;

  // Gambar pola kotak papan catur berselang-seling
  for (let y = 0; y < cells; y++) {
    for (let x = 0; x < cells; x++) {
      const even = (x + y) % 2 === 0;
      ctx.fillStyle = even ? "#f8fafc" : "#0ea5e9";
      ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    }
  }

  // Upload canvas ke GPU sebagai tekstur 2D
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    source
  );
  gl.generateMipmap(gl.TEXTURE_2D);

  return texture;
}

// Aktifkan Texture Unit 0
const texture = createCheckerTexture();
gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_2D, texture);
gl.uniform1i(textureLocation, 0);

// ==========================================
// 12. State & Pengaturan Tekstur (Filtering & Wrapping)
// ==========================================
let filterMode = "LINEAR";

// Atur filter minifikasi & magnifikasi (LINEAR vs NEAREST)
function applyFiltering() {
  gl.bindTexture(gl.TEXTURE_2D, texture);

  if (filterMode === "NEAREST") {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  } else {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  }
}

const wrapModes = ["REPEAT", "CLAMP_TO_EDGE", "MIRRORED_REPEAT"];
let wrapIndex = 0;

// Atur mode pembungkusan koordinat UV (S dan T)
function applyWrapping() {
  gl.bindTexture(gl.TEXTURE_2D, texture);

  const modeName = wrapModes[wrapIndex];
  let mode = gl.REPEAT;

  if (modeName === "CLAMP_TO_EDGE") {
    mode = gl.CLAMP_TO_EDGE;
  } else if (modeName === "MIRRORED_REPEAT") {
    mode = gl.MIRRORED_REPEAT;
  }

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, mode);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, mode);
}

// ==========================================
// 13. State Scene (Kubus, Kamera, Lampu)
// ==========================================
const cube = {
  rotationX: 20,
  rotationY: 30,
  scaleX: 1.0,
  scaleY: 1.0,
  scaleZ: 1.0
};

const camera = {
  position: [0.0, 1.4, 4.0],
  target:   [0.0, 0.0, 0.0],
  up:       [0.0, 1.0, 0.0]
};

const light = {
  position: [2.0, 2.0, 2.0],
  color:    [1.0, 1.0, 1.0]
};

let ambientStrength = 0.18;
let shininess = 32.0;
let uvScale = 1.0;
let shadingMode = "FLAT";

// State Challenge
let isNonUniformScale = false; // Challenge D: Non-Uniform Scale
let ambientOn  = 1.0;          // Challenge F: Ambient ON/OFF
let diffuseOn  = 1.0;          // Challenge F: Diffuse ON/OFF
let specularOn = 1.0;          // Challenge F: Specular ON/OFF

// ==========================================
// 14. Pembuatan Matriks Model
// ==========================================
// Menyusun matriks transformasi kubus: Model = S * Rx * Ry
function createModelMatrix() {
  const rx = Mat4.rotationX(degToRad(cube.rotationX));
  const ry = Mat4.rotationY(degToRad(cube.rotationY));
  const s  = Mat4.scaling(cube.scaleX, cube.scaleY, cube.scaleZ);

  let model = Mat4.identity();
  model = Mat4.multiply(model, s);
  model = Mat4.multiply(model, rx);
  model = Mat4.multiply(model, ry);

  return model;
}

// ==========================================
// 15. Penanganan Input Keyboard
// ==========================================
const keys = {};

window.addEventListener("keydown", (event) => {
  keys[event.key.toLowerCase()] = true;

  // Cegah scroll halaman saat tombol panah ditekan
  if (event.key.startsWith("Arrow") || event.key === " ") {
    event.preventDefault();
  }

  // Toggle Flat / Smooth Shading (tombol F)
  if (event.key.toLowerCase() === "f" && !event.repeat) {
    shadingMode = shadingMode === "FLAT" ? "SMOOTH" : "FLAT";
  }

  // Toggle Texture Filtering (tombol T)
  if (event.key.toLowerCase() === "t" && !event.repeat) {
    filterMode = filterMode === "LINEAR" ? "NEAREST" : "LINEAR";
    applyFiltering();
  }

  // Toggle Texture Wrapping (tombol G)
  if (event.key.toLowerCase() === "g" && !event.repeat) {
    wrapIndex = (wrapIndex + 1) % wrapModes.length;
    applyWrapping();
  }

  // Challenge D: Toggle Uniform vs Non-Uniform Scale (tombol N)
  if (event.key.toLowerCase() === "n" && !event.repeat) {
    isNonUniformScale = !isNonUniformScale;
    if (isNonUniformScale) {
      cube.scaleX = 1.8;
      cube.scaleY = 0.6;
      cube.scaleZ = 1.0;
    } else {
      cube.scaleX = 1.0;
      cube.scaleY = 1.0;
      cube.scaleZ = 1.0;
    }
  }

  // Challenge F: Toggle komponen lighting (tombol 1, 2, 3)
  if (event.key === "1" && !event.repeat) {
    ambientOn = ambientOn > 0.5 ? 0.0 : 1.0;
  }
  if (event.key === "2" && !event.repeat) {
    diffuseOn = diffuseOn > 0.5 ? 0.0 : 1.0;
  }
  if (event.key === "3" && !event.repeat) {
    specularOn = specularOn > 0.5 ? 0.0 : 1.0;
  }

  // Reset Scene (tombol R)
  if (event.key.toLowerCase() === "r" && !event.repeat) {
    resetScene();
  }
});

window.addEventListener("keyup", (event) => {
  keys[event.key.toLowerCase()] = false;
});

// ==========================================
// 16. Fungsi Pembaruan Kontrol Kontinu (State-Based)
// ==========================================
const lightSpeed = 2.0;

// Perbarui posisi lampu (Arrow: X/Y, W/S: Z)
function updateLight(dt) {
  if (keys["arrowleft"])  light.position[0] -= lightSpeed * dt;
  if (keys["arrowright"]) light.position[0] += lightSpeed * dt;
  if (keys["arrowup"])    light.position[1] += lightSpeed * dt;
  if (keys["arrowdown"])  light.position[1] -= lightSpeed * dt;
  if (keys["w"])          light.position[2] -= lightSpeed * dt;
  if (keys["s"])          light.position[2] += lightSpeed * dt;
}

const uvScaleSpeed = 1.5;

// Perbarui skala UV (tombol [ dan ])
function updateUVScale(dt) {
  if (keys["["]) uvScale -= uvScaleSpeed * dt;
  if (keys["]"]) uvScale += uvScaleSpeed * dt;
  uvScale = Math.max(0.25, Math.min(5.0, uvScale));
}

const shininessSpeed = 50.0;

// Perbarui nilai shininess (tombol - dan +)
function updateShininess(dt) {
  if (keys["-"] || keys["_"]) shininess -= shininessSpeed * dt;
  if (keys["+"] || keys["="]) shininess += shininessSpeed * dt;
  shininess = Math.max(2.0, Math.min(128.0, shininess));
}

const ambientSpeed = 0.4;

// Challenge B: Perbarui intensitas ambient (tombol A dan Z)
function updateAmbient(dt) {
  if (keys["a"]) ambientStrength += ambientSpeed * dt;
  if (keys["z"]) ambientStrength -= ambientSpeed * dt;
  ambientStrength = Math.max(0.0, Math.min(1.0, ambientStrength));
}

// Reset seluruh parameter scene ke nilai default
function resetScene() {
  light.position[0] = 2.0;
  light.position[1] = 2.0;
  light.position[2] = 2.0;

  shininess = 32.0;
  uvScale = 1.0;
  shadingMode = "FLAT";
  filterMode = "LINEAR";
  wrapIndex = 0;

  isNonUniformScale = false;
  cube.scaleX = 1.0;
  cube.scaleY = 1.0;
  cube.scaleZ = 1.0;

  ambientStrength = 0.18;
  ambientOn  = 1.0;
  diffuseOn  = 1.0;
  specularOn = 1.0;

  cube.rotationX = 20;
  cube.rotationY = 30;

  applyFiltering();
  applyWrapping();
}

// Animasi rotasi kubus otomatis
function updateCube(dt) {
  cube.rotationX += 20.0 * dt;
  cube.rotationY += 35.0 * dt;
}

// ==========================================
// 17. Fungsi Render Frame (Draw Scene)
// ==========================================
function drawScene() {
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.025, 0.04, 0.08, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.useProgram(program);

  // Ikat buffer attribute posisi dan koordinat tekstur
  setupAttribute(positionBuffer, positionLocation, 3);
  setupAttribute(texCoordBuffer, texCoordLocation, 2);

  // Pilih buffer normal aktif sesuai mode Flat atau Smooth
  const activeNormalBuffer =
    shadingMode === "FLAT" ? flatNormalBuffer : smoothNormalBuffer;
  setupAttribute(activeNormalBuffer, normalLocation, 3);

  // Hitung matriks transformasi
  const model = createModelMatrix();
  const view  = Mat4.lookAt(camera.position, camera.target, camera.up);
  const projection = Mat4.perspective(
    degToRad(60),
    canvas.width / canvas.height,
    0.1,
    100.0
  );
  // Hitung Normal Matrix 3x3 dari model matrix
  const normalMatrix = normalMatrixFromMat4(model);

  // Kirim uniform matriks ke shader
  gl.uniformMatrix4fv(modelLocation, false, model);
  gl.uniformMatrix4fv(viewLocation, false, view);
  gl.uniformMatrix4fv(projectionLocation, false, projection);
  gl.uniformMatrix3fv(normalMatrixLocation, false, normalMatrix);

  // Kirim uniform lighting & material
  gl.uniform3fv(lightPositionLocation, light.position);
  gl.uniform3fv(lightColorLocation, light.color);
  gl.uniform3fv(cameraPositionLocation, camera.position);
  gl.uniform1f(ambientLocation, ambientStrength);
  gl.uniform1f(shininessLocation, shininess);
  gl.uniform1f(uvScaleLocation, uvScale);

  // Kirim toggle komponen lighting (Challenge F)
  gl.uniform1f(ambientOnLocation, ambientOn);
  gl.uniform1f(diffuseOnLocation, diffuseOn);
  gl.uniform1f(specularOnLocation, specularOn);

  // Ikat tekstur pada Texture Unit 0
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.uniform1i(textureLocation, 0);

  // Gambar 36 vertex kubus (12 segitiga)
  gl.drawArrays(gl.TRIANGLES, 0, 36);
}

// ==========================================
// 18. Pembaruan Informasi Tampilan (HUD)
// ==========================================
const shadingInfo   = document.getElementById("shadingInfo");
const filterInfo    = document.getElementById("filterInfo");
const wrapInfo      = document.getElementById("wrapInfo");
const uvInfo        = document.getElementById("uvInfo");
const shininessInfo = document.getElementById("shininessInfo");
const lightInfo     = document.getElementById("lightInfo");

function updateHUD() {
  shadingInfo.textContent   = shadingMode;
  filterInfo.textContent    = filterMode;
  wrapInfo.textContent      = wrapModes[wrapIndex];
  uvInfo.textContent        = uvScale.toFixed(2);
  shininessInfo.textContent = shininess.toFixed(1);
  lightInfo.textContent =
    `(${light.position[0].toFixed(2)}, ` +
    `${light.position[1].toFixed(2)}, ` +
    `${light.position[2].toFixed(2)})`;
}

// ==========================================
// 19. Loop Animasi Utama (Render Loop)
// ==========================================
let lastTime = 0;

function render(time) {
  let dt = (time - lastTime) * 0.001;
  lastTime = time;
  dt = Math.min(dt, 0.05); // Batasi delta time maksimal 50ms

  // Perbarui state objek dan kontrol
  updateCube(dt);
  updateLight(dt);
  updateUVScale(dt);
  updateShininess(dt);
  updateAmbient(dt);

  // Gambar frame dan perbarui HUD
  drawScene();
  updateHUD();

  // Panggil frame berikutnya
  requestAnimationFrame(render);
}

// Inisialisasi awal dan mulai rendering
applyFiltering();
applyWrapping();
requestAnimationFrame(render);
