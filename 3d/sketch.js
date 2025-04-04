// Machine Learning for Creative Coding
// https://github.com/shiffman/ML-for-Creative-Coding

let points3D = [];
let images = [];
let photos;
let totalImages = 2000;
let scaleSlider;

async function setup() {
  createCanvas(1024, 1024, WEBGL);
  scaleSlider = createSlider(1, 1000, 100);

  // Load data
  photos = await loadJSON('/data/photo.json');
  const rawData = await loadBytes('/data/embeddings.bin');
  const rawFloats = new Float32Array(rawData.buffer, rawData.byteOffset, rawData.byteLength / 4);

  // Process embeddings
  const embeddingLength = 512;
  let embeddings = [];
  for (let i = 0; i < rawFloats.length / embeddingLength; i++) {
    let start = i * embeddingLength;
    embeddings.push(rawFloats.slice(start, start + embeddingLength));
  }

  // Run UMAP on first N embeddings
  console.log('Running UMAP...');
  const umap = new UMAP({ nComponents: 3, nNeighbors: 15, minDist: 0.1 });
  let umapResult = umap.fit(embeddings.slice(0, totalImages));

  // Find min and max values
  let [minX, minY, minZ] = umapResult[0];
  let [maxX, maxY, maxZ] = umapResult[0];

  for (let i = 0; i < umapResult.length; i++) {
    let [x, y, z] = umapResult[i];

    if (x < minX) minX = x;
    if (x > maxX) maxX = x;

    if (y < minY) minY = y;
    if (y > maxY) maxY = y;

    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  }

  // Calculate center
  let centerX = (minX + maxX) / 2;
  let centerY = (minY + maxY) / 2;
  let centerZ = (minZ + maxZ) / 2;

  // Center and convert points to p5.Vectors
  for (let i = 0; i < umapResult.length; i++) {
    let x = umapResult[i][0] - centerX;
    let y = umapResult[i][1] - centerY;
    let z = umapResult[i][2] - centerZ;
    points3D.push(createVector(x, y, z));
  }

  // Initialize image array
  for (let i = 0; i < totalImages; i++) {
    images[i] = null;
  }

  // Load images asynchronously
  loadImages();
}

async function loadImages() {
  console.log('Loading images...');
  for (let i = 0; i < totalImages; i++) {
    images[i] = await loadImage(`${photos[i].url}?w=50&h=50&fit=max&q=90`);
    console.log(`Loaded image ${i + 1}/${totalImages}`);
  }
}

function draw() {
  background(0);
  orbitControl();
  let sfactor = scaleSlider.value();
  for (let i = 0; i < points3D.length; i++) {
    push();
    let pos = points3D[i];
    translate(pos.x * sfactor, pos.y * sfactor, pos.z * sfactor);
    noStroke();
    if (images[i]) {
      image(images[i], 0, 0, 50, 50);
    } else {
      fill(255, 50);
      square(0, 0, 50);
    }
    pop();
  }
}
