# Laporan Praktikum Grafika Komputer — Pertemuan 5
## Lighting, Shading & Texture pada WebGL
### Textured and Lit Cube Playground

---

## 1. Identitas Mahasiswa

- **Nama:** Aji Zaenul Musthofa
- **NRP:** 5020241065
- **Mata Kuliah:** EF234504 — Grafika Komputer
- **Pertemuan:** 5 (Lighting, Shading & Texture pada WebGL)
- **Dosen Pengampu:** Dr. Darlis Herumurti
- **Departemen:** Teknik Informatika, Institut Teknologi Sepuluh Nopember

---

## 2. Deskripsi Aplikasi

Aplikasi **Textured and Lit Cube Playground** adalah aplikasi grafika 3D interaktif berbasis WebGL2 murni (vanilla JavaScript tanpa library pihak ketiga) yang mendemonstrasikan implementasi pencahayaan (*lighting*), bayangan permukaan (*shading*), dan pemetaan tekstur (*texture mapping*).

Aplikasi ini menggunakan kubus 3D (36 vertex / 12 segitiga) dengan pipeline rendering modern:
1. **Model-View-Projection (MVP) Pipeline**: Mengubah koordinat objek 3D dari Object Space ke World Space, View Space, hingga Clip Space.
2. **Normal Transformation**: Menggunakan **Normal Matrix** ($3 \times 3$ inverse-transpose dari bagian linear model matrix) untuk menjamin vektor normal tetap tegak lurus permukaan bahkan saat mengalami *non-uniform scaling*.
3. **Lighting Model (Phong Reflection Model)**:
   - **Ambient Lighting**: Pencahayaan dasar menyeluruh agar sisi yang membelakangi cahaya tetap terlihat.
   - **Diffuse Lighting (Lambertian)**: Menghitung intensitas cahaya berdasarkan sudut datang menggunakan perkalian titik (*dot product*) $\max(\mathbf{N} \cdot \mathbf{L}, 0.0)$.
   - **Specular Lighting (Phong Highlight)**: Menghasilkan kilau pantulan tajam berdasarkan arah pandang kamera $\mathbf{V}$, arah pantulan $\mathbf{R} = \text{reflect}(-\mathbf{L}, \mathbf{N})$, dan eksponen *shininess*.
4. **Shading Comparison**:
   - **Flat Shading**: Setiap permukaan (face) memiliki normal konstan seragam (transisi tegas antar-sisi).
   - **Smooth Shading**: Setiap vertex memiliki normal terinterpolasi ke arah luar/sudut (transisi halus membulat).
5. **Procedural Checkerboard Texture & UV Mapping**: Tekstur papan catur resolusi $64 \times 64$ yang dibuat secara programatik via HTML5 2D Canvas (bebas kendala CORS).
6. **Texture Sampling Control**:
   - **Filtering**: Perbandingan mode interpolasi `LINEAR` (halus) dan `NEAREST` (tajam/pikselasi).
   - **Wrapping**: Perbandingan penanganan koordinat UV di luar $[0, 1]$ (`REPEAT`, `CLAMP_TO_EDGE`, `MIRRORED_REPEAT`) yang dapat diuji dengan menaikkan `u_uvScale`.

---

## 3. Kontrol Keyboard

| Tombol | Fungsi | Kategori |
|---|---|---|
| `Arrow Left` / `Arrow Right` | Menggeser posisi cahaya pada sumbu X | Kontrol Cahaya |
| `Arrow Up` / `Arrow Down` | Menggeser posisi cahaya pada sumbu Y | Kontrol Cahaya |
| `W` / `S` | Menggeser posisi cahaya maju/mundur pada sumbu Z | Kontrol Cahaya |
| `F` | Toggle antara **Flat Shading** dan **Smooth Shading** | Shading |
| `T` | Toggle antara Texture Filtering **LINEAR** dan **NEAREST** | Tekstur |
| `G` | Siklus Texture Wrapping: **REPEAT** &rarr; **CLAMP_TO_EDGE** &rarr; **MIRRORED_REPEAT** | Tekstur |
| `[` / `]` | Memperkecil / memperbesar **UV Scale** (rentang 0.25 s.d. 5.0) | Tekstur |
| `-` / `+` (atau `=`) | Mengurangi / menambah nilai **Shininess** (rentang 2.0 s.d. 128.0) | Lighting |
| `R` | Mereset seluruh parameter scene ke nilai awal | Utilitas |
| **`A` / `Z`** | **[Challenge B]** Menambah / mengurangi **Ambient Strength** ($0.0 \sim 1.0$) | Challenge |
| **`N`** | **[Challenge D]** Toggle antara **Uniform Scale** $(1, 1, 1)$ dan **Non-Uniform Scale** $(1.8, 0.6, 1.0)$ | Challenge |
| **`1`** | **[Challenge F]** Toggle komponen **Ambient Lighting** (ON/OFF) | Challenge |
| **`2`** | **[Challenge F]** Toggle komponen **Diffuse Lighting** (ON/OFF) | Challenge |
| **`3`** | **[Challenge F]** Toggle komponen **Specular Lighting** (ON/OFF) | Challenge |

---

## 4. Parameter & Spesifikasi Teknis

- **Jenis Shading:** Flat Shading (Face Normals) dan Smooth Shading (Vertex Normals).
- **Tekstur yang Digunakan:** Tekstur prosedural checkerboard $64 \times 64$ piksel (warna biru `#0ea5e9` dan putih `#f8fafc`), di-generate secara langsung di memori GPU melalui Canvas 2D dan `gl.generateMipmap()`.
- **Filtering yang Tersedia:**
  - `LINEAR` (`gl.LINEAR`)
  - `NEAREST` (`gl.NEAREST`)
- **Wrapping yang Tersedia:**
  - `REPEAT` (`gl.REPEAT`)
  - `CLAMP_TO_EDGE` (`gl.CLAMP_TO_EDGE`)
  - `MIRRORED_REPEAT` (`gl.MIRRORED_REPEAT`)
- **Nilai Ambient Default:** `0.18`
- **Nilai Shininess Default:** `32.0`
- **Posisi Default Light:** `(2.0, 2.0, 2.0)`
- **Posisi Default Camera:** `(0.0, 1.4, 4.0)` menghadap ke `(0.0, 0.0, 0.0)`

---

## 5. Tiga (3) Challenge yang Dikerjakan

Sesuai instruksi, berikut adalah 3 challenge yang diimplementasikan secara murni, rapi, dan terintegrasi penuh:

### 1. Challenge B — Ambient Control
- **Implementasi:** Pengguna dapat menekan tombol `A` untuk meningkatkan dan `Z` untuk menurunkan nilai `ambientStrength` secara kontinu dan halus (dibatasi antara `0.00` hingga `1.00`).
- **Tampilan HUD:** HUD menyajikan nilai `Ambient Str` secara real-time.
- **Tujuan Pembelajaran:** Mengamati pengaruh pencahayaan ambien terhadap sisi objek yang tidak terpapar sinar langsung (sisi gelap/bayangan diri). Pada nilai `0.0`, sisi belakang kubus menjadi hitam total.

### 2. Challenge D — Non-Uniform Scale Mode (Pembuktian Normal Matrix)
- **Implementasi:** Pengguna dapat menekan tombol `N` untuk beralih antara skala seragam (*Uniform Scale* $[1.0, 1.0, 1.0]$) dan skala tidak seragam (*Non-Uniform Scale* $[1.8, 0.6, 1.0]$).
- **Tampilan HUD:** HUD menampilkan status `Scale Mode: UNIFORM` atau `Scale Mode: NON-UNIFORM`.
- **Tujuan Pembelajaran:** Membuktikan keabsahan perhitungan **Normal Matrix** ($3 \times 3$ inverse-transpose). Jika hanya menggunakan transformasi model biasa pada non-uniform scale, arah normal akan miring dan merusak orientasi pencahayaan. Dengan Normal Matrix, arah pantulan cahaya tetap tegak lurus fisik permukaan.

### 3. Challenge F — Lighting Components Toggle
- **Implementasi:** Tombol angka `1`, `2`, dan `3` dapat ditekan untuk mematikan atau menghidupkan masing-masing komponen pencahayaan secara independen:
  - Tombol `1`: Toggle **Ambient Light** (ON/OFF).
  - Tombol `2`: Toggle **Diffuse Light** (ON/OFF).
  - Tombol `3`: Toggle **Specular Light** (ON/OFF).
- **Tampilan HUD:** HUD menampilkan status `Components: A:ON D:ON S:ON` secara interaktif.
- **Tujuan Pembelajaran:** Mahasiswa dapat mengisolasi dan mengamati kontribusi visual murni dari masing-masing komponen Phong Lighting (misal: melihat pantulan kilau spekular murni di latar belakang gelap saat Ambient dan Diffuse dimatikan).

---

## 6. Cara Menjalankan

Karena aplikasi menggunakan modul ES6 (`import` / `export`), browser modern memerlukan HTTP server lokal (bukan membukanya langsung via protokol `file://`):

### Opsi 1: Menggunakan Node.js
Jalankan perintah berikut di direktori proyek:
```bash
npx serve .
# atau
npx http-server .
```
Buka URL yang ditampilkan (misalnya: `http://localhost:3000` atau `http://localhost:8080`).

### Opsi 2: Menggunakan Python
```bash
# Python 3
python -m http.server 8000
```
Buka browser pada `http://localhost:8000`.

### Opsi 3: Menggunakan VS Code Live Server
Klik kanan pada file `index.html` lalu pilih **"Open with Live Server"**.

---

## 7. Catatan Debugging

1. **Penanganan Orientasi Vektor Normal**:
   Ketika menghitung perkalian titik $\mathbf{N} \cdot \mathbf{L}$, penting untuk melakukan normalisasi ulang vektor normal pada *Fragment Shader* (`normalize(v_normal)`), karena interpolasi linear selama rasterisasi dapat memperpendek panjang vektor normal sehingga $|\mathbf{N}| < 1$.
2. **Kondisi Specular Negatif**:
   Kalkulasi specular hanya dihitung jika sisi tersebut menerima cahaya langsung, yaitu saat $\text{diff} > 0.0$. Hal ini mencegah fenomena artefak di mana highlight specular muncul di sisi belakang objek yang membelakangi sumber cahaya.
3. **Observasi Wrapping Mode**:
   Efek wrapping (`REPEAT`, `CLAMP_TO_EDGE`, `MIRRORED_REPEAT`) hanya terlihat apabila nilai koordinat UV melebihi rentang default $[0, 1]$. Oleh karena itu, disediakan kontrol `[` dan `]` untuk menaikkan nilai `u_uvScale` (misal menjadi $2.0 \sim 3.0$).
4. **Tidak Mengalami Masalah CORS**:
   Dengan digunakannya tekstur prosedural berbasis Canvas 2D (`document.createElement('canvas')`), aplikasi dapat dimuat dengan andal tanpa kendala kegagalan *Cross-Origin Resource Sharing* (CORS) image loading.

---

## 8. Jawaban Pertanyaan Pemahaman (Bagian 90 Modul)

1. **Apa fungsi normal dalam lighting?**  
   Normal menentukan arah orientasi permukaan bidang geometris sehingga shader dapat menghitung sudut antara permukaan dengan arah datangnya cahaya serta arah pandang mata/kamera.
2. **Apa perbedaan face normal dan vertex normal?**  
   Face normal adalah vektor tegak lurus yang berlaku sama untuk seluruh bidang poligon (satu face), sedangkan vertex normal adalah normal yang didefinisikan pada masing-masing titik sudut (vertex) dan akan diinterpolasi ke seluruh permukaan poligon saat rasterisasi.
3. **Apa perbedaan flat shading dan smooth shading?**  
   Flat shading menggunakan face normal sehingga setiap sisi poligon memiliki warna/pencahayaan tegas seragam. Smooth shading menginterpolasi vertex normal sehingga menghasilkan gradasi warna halus di sepanjang permukaan poligon.
4. **Mengapa normal harus dinormalisasi?**  
   Perhitungan lighting mengandalkan hukum kosinus Lambert via *dot product* $\mathbf{A} \cdot \mathbf{B} = |\mathbf{A}||\mathbf{B}|\cos\theta$. Jika panjang vektor tidak sama dengan 1 ($|\mathbf{N}| \neq 1$), hasil perkalian titik tidak merepresentasikan $\cos\theta$ yang sebenarnya dan intensitas cahaya akan menjadi redup atau terlalu terang secara tidak valid.
5. **Mengapa normal perlu ikut ditransformasikan?**  
   Ketika objek berputar atau berpindah posisi di dunia 3D, arah hadap permukaannya ikut berubah. Normal harus mengikuti orientasi objek agar pencahayaan tetap akurat terhadap rotasi objek.
6. **Mengapa normal tidak selalu cukup dikalikan Model Matrix biasa?**  
   Jika Model Matrix memuat penskalaan yang tidak seragam (*non-uniform scaling*, misalnya skala sumbu X berbeda dengan Y), perkalian dengan Model Matrix biasa akan mendistorsi arah normal sehingga tidak lagi tegak lurus dengan permukaan bidang.
7. **Apa fungsi Normal Matrix?**  
   Normal Matrix mengoreksi distorsi non-uniform scaling pada normal dengan cara mengambil matriks *transpose* dari invers bagian $3 \times 3$ Model Matrix.
8. **Apa yang dimaksud inverse-transpose secara konseptual?**  
   Secara matematis, jika vektor singgung permukaan $\mathbf{t}$ ditransformasikan oleh matriks $\mathbf{M}$ ($\mathbf{t}' = \mathbf{M}\mathbf{t}$), maka vektor normal $\mathbf{n}$ yang harus tetap tegak lurus ($\mathbf{n}'^T \mathbf{t}' = 0$) harus ditransformasikan dengan $(\mathbf{M}^{-1})^T$.
9. **Apa fungsi ambient lighting?**  
   Memberikan pencahayaan dasar konstan pada seluruh objek sehingga bagian objek yang membelakangi sumber cahaya tidak menjadi hitam pekat (mensimulasikan pantulan cahaya tidak langsung dari lingkungan).
10. **Mengapa ambient sederhana bukan global illumination?**  
    Karena ambient sederhana hanya mengalikan warna objek dengan konstanta skalar tanpa memperhitungkan geometri lingkungan, pantulan cahaya antar-objek (*bouncing*), oklusi, maupun radiosity.
11. **Apa fungsi diffuse lighting?**  
    Mensimulasikan pantulan cahaya baur (Lambertian) yang tersebar merata ke segala arah saat cahaya mengenai permukaan kasar/matte.
12. **Apa arti `dot(N, L)`?**  
    Merepresentasikan nilai kosinus sudut antara vektor normal $\mathbf{N}$ dan vektor arah cahaya $\mathbf{L}$. Bernilai 1 jika cahaya datang tegak lurus tepat di atas permukaan, dan bernilai 0 jika cahaya datang sejajar permukaan (sudut $90^\circ$).
13. **Mengapa digunakan `max(dot(N, L), 0.0)`?**  
    Untuk mencegah nilai intensitas cahaya negatif ketika cahaya berada di belakang permukaan bidang (sudut $> 90^\circ$).
14. **Apa fungsi light direction?**  
    Menunjukkan arah dari titik pada permukaan objek menuju posisi sumber cahaya ($\mathbf{L} = \text{normalize}(\text{LightPos} - \text{SurfacePos})$).
15. **Apa fungsi view direction?**  
    Menunjukkan arah dari titik permukaan objek menuju posisi mata/kamera ($\mathbf{V} = \text{normalize}(\text{CamPos} - \text{SurfacePos})$).
16. **Apa fungsi reflection direction?**  
    Menunjukkan arah pantulan sinar cahaya sempurna dari permukaan berdasarkan hukum pemantulan cermin ($\mathbf{R} = \text{reflect}(-\mathbf{L}, \mathbf{N})$).
17. **Apa fungsi specular lighting?**  
    Mensimulasikan kilau cahaya (*highlight*) mengkilap pada permukaan licin/halus ketika arah pandang mata sejajar dengan arah pantulan cahaya.
18. **Apa pengaruh shininess?**  
    Menentukan konsentrasi kilau: nilai kecil menghasilkan highlight lebar dan menyebar (permukaan semi-matte), sedangkan nilai besar menghasilkan highlight kecil, tajam, dan pekat (permukaan sangat licin/mengkilap).
19. **Apa yang dimaksud Phong Reflection Model sederhana?**  
    Model pencahayaan empiris yang menggabungkan tiga komponen cahaya: $\text{Color} = \text{Ambient} + \text{Diffuse} + \text{Specular}$.
20. **Apa perbedaan per-vertex dan per-fragment lighting?**  
    Per-vertex lighting (Gouraud shading) menghitung warna di vertex shader lalu menginterpolasikan warna ke piksel, menghasilkan highlight yang terdistorsi pada poligon besar. Per-fragment lighting (Phong shading) menginterpolasikan vektor normal ke fragment shader dan menghitung pencahayaan per-piksel, menghasilkan highlight specular yang bulat dan presisi.
21. **Apa fungsi UV coordinate?**  
    Memetakan koordinat ruang 2D pada citra tekstur ($U$ horizontal, $V$ vertikal dalam rentang $0 \sim 1$) ke setiap titik vertex pada model 3D.
22. **Apa fungsi texture sampler?**  
    Menghubungkan shader (`sampler2D`) dengan texture unit WebGL pada GPU untuk membaca data warna piksel tekstur.
23. **Apa yang dimaksud texture sampling?**  
    Proses pembacaan dan penghitungan nilai warna dari tekstur pada koordinat $(u, v)$ tertentu menggunakan algoritma interpolasi GPU.
24. **Apa perbedaan pixel dan texel?**  
    Pixel (*picture element*) adalah titik elemen warna pada layar/framebuffer, sedangkan texel (*texture element*) adalah titik elemen warna pada citra tekstur sumber.
25. **Apa perbedaan `NEAREST` dan `LINEAR`?**  
    `NEAREST` mengambil warna dari texel yang paling dekat secara diskrit (menghasilkan efek piksel kotak-kotak/retro), sedangkan `LINEAR` menghitung rata-rata bobot bilinear dari 4 texel terdekat (menghasilkan gradasi halus/buram).
26. **Apa fungsi wrapping?**  
    Menentukan aturan bagaimana GPU mengisi warna saat koordinat tekstur $(u, v)$ bernilai di luar rentang standar $[0.0, 1.0]$.
27. **Apa perbedaan `REPEAT` dan `CLAMP_TO_EDGE`?**  
    `REPEAT` mengulang pola tekstur secara berkala (ubin berulang), sedangkan `CLAMP_TO_EDGE` menarik dan memperpanjang warna piksel di batas tepi tekstur hingga ke ujung.
28. **Mengapa UV scale diperlukan untuk mudah melihat wrapping?**  
    Karena jika UV hanya bernilai $0.0 \sim 1.0$, semua mode wrapping menghasilkan visual yang sama (karena tidak ada koordinat yang keluar dari rentang batas). Menaikkan UV scale memaksa koordinat keluar dari rentang sehingga efek pengulangan atau clamping terlihat jelas.
29. **Mengapa texture dapat digunakan sebagai base color?**  
    Karena tekstur menyediakan warna intrinsik permukaan albedo ($K_d$), menggantikan penggunaan warna solid tunggal per vertex.
30. **Bagaimana lighting dan texture digabungkan?**  
    Warna texel dari pembacaan tekstur dikalikan dengan kontribusi ambient dan diffuse, kemudian ditambahkan dengan kontribusi specular:  
    $\text{FinalColor} = (\text{Ambient} \times \text{TexColor}) + (\text{Diffuse} \times \text{TexColor}) + \text{Specular}$.

---

## 9. Jawaban Pertanyaan Analisis (Bagian 91 Modul)

### A — Normal
> **Pertanyaan:** Geometry cube sama tetapi normal diubah dari face normal menjadi smooth normal. Mengapa hasil shading berubah?  
> **Jawaban:** Walaupun posisi geometris kubus tidak berubah sedikit pun, pada smooth normal setiap titik sudut memiliki vektor normal yang mengarah diagonal keluar (menjauhi pusat kubus). Saat rasterisasi, normal diinterpolasi secara kontinu di seluruh permukaan wajah kubus, menyebabkan sudut datang cahaya $\mathbf{N} \cdot \mathbf{L}$ dan arah pantulan specular $\mathbf{R}$ berubah halus per-piksel layaknya permukaan bola melengkung. Akibatnya, kubus tampak memiliki permukaan membulat semu.

### B — Diffuse
> **Pertanyaan:** Jika $\mathbf{N} \cdot \mathbf{L} = 1$, apa artinya secara geometris?  
> **Jawaban:** Secara geometris, sudut antara vektor normal permukaan $\mathbf{N}$ dan arah datang cahaya $\mathbf{L}$ adalah $0^\circ$ ($\cos 0^\circ = 1$). Artinya sinar cahaya datang tepat tegak lurus membentur permukaan objek, sehingga permukaan menerima intensitas energi radiasi foton maksimum (permukaan berada pada tingkat kecerahan tertinggi).

### C — Specular
> **Pertanyaan:** Mengapa highlight dapat berubah ketika camera bergerak walaupun light position tetap?  
> **Jawaban:** Karena formula specular Phong mengikutsertakan arah pandang mata/kamera $\mathbf{V} = \text{normalize}(\text{CameraPos} - \text{SurfacePos})$. Intensitas highlight ditentukan oleh $\mathbf{R} \cdot \mathbf{V}$ (sudut antara pantulan cermin dan mata pengamat). Ketika kamera bergeser, sudut pandang $\mathbf{V}$ berubah sehingga mata tidak lagi menangkap berkas sinar pantulan specular langsung, menyebabkan highlight bergeser atau menghilang.

### D — Texture
> **Pertanyaan:** Mengapa texture memberi detail visual tanpa menambah triangle?  
> **Jawaban:** Karena kompleksitas visual disimpan dalam bentuk data matriks warna (texel) 2D yang dipetakan ke permukaan, bukan melalui penambahan poligon/vertex fisik. GPU hanya perlu melakukan sampling warna per-fragment pada segitiga yang sama, menghemat komputasi geometri rasterisasi secara signifikan.

### E — Normal Matrix
> **Pertanyaan:** Mengapa non-uniform scaling menjadi kasus penting untuk transformasi normal?  
> **Jawaban:** Ketika objek diskalakan secara tidak seragam (misal sumbu X diperpanjang $2\times$ sedangkan Y tetap), kemiringan lereng permukaan berubah. Jika vektor normal dikalikan dengan matriks model biasa, vektor tersebut akan memanjang ke arah yang salah dan tidak lagi membentuk sudut siku-siku $90^\circ$ terhadap permukaan bidang. Dengan menggunakan Normal Matrix ($(\mathbf{M}^{-1})^T$), komponen skala non-uniform dibalik secara proporsional sehingga vektor normal tetap tegak lurus sempurna secara fisik.

---

## 10. Refleksi Praktikum (Bagian 94 Modul)

1. **Perbedaan Flat dan Smooth Shading:** Flat shading mempertahankan ketegasan batas setiap poligon geometris dengan satu normal seragam per-face, sedangkan smooth shading menginterpolasi normal antar-vertex sehingga menyamarkan tepian segitiga dan menghasilkan persepsi permukaan melengkung halus.
2. **Komponen Lighting Paling Mudah Dipahami:** Komponen diffuse adalah yang paling intuitif secara fisik karena secara langsung memodelkan bagaimana permukaan tampak semakin terang saat dihadapkan tegak lurus ke arah sumber cahaya.
3. **Fungsi Dot Product:** Perkalian titik unit vector ($\mathbf{N} \cdot \mathbf{L}$ dan $\mathbf{R} \cdot \mathbf{V}$) berfungsi sebagai pengukur keselarasan sudut secara sangat efisien di GPU tanpa perlu memanggil fungsi trigonometri invers ($\arccos$) yang mahal.
4. **Pengaruh Shininess:** Eksponen shininess secara dramatis menentukan persepsi material objek; nilai rendah memberi kesan permukaan plastik matte atau karet, sedangkan nilai tinggi menghasilkan kilau logam atau kaca yang mengkilat.
5. **Perbedaan Filtering:** `NEAREST` mempertahankan batas piksel tajam dengan sedikit aliasing yang cocok untuk grafis berpiksel, sementara `LINEAR` membaurkan texel menjadi gradasi mulus yang alami untuk tekstur realistis.
6. **Kesalahan yang Ditemukan:** Kesalahan yang sering terjadi pada awal implementasi adalah lupa menormalisasi ulang $\mathbf{N}$ di fragment shader setelah interpolasi rasterisasi, serta melewatkan perhitungan Normal Matrix saat objek diskalakan non-uniform.
