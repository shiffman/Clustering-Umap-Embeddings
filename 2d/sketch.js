// Machine Learning for Creative Coding
// https://github.com/shiffman/ML-for-Creative-Coding

let points2D = [];
let images = [];
let photos;
let totalImages = 2000;
let scaleSlider;

let panX = 0;
let panY = 0;
let zoom = 1;

async function setup() {
  createCanvas(1024, 1024);
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
  const umap = new UMAP({ nComponents: 2, nNeighbors: 15, minDist: 0.1 });
  let umapResult = umap.fit(embeddings.slice(0, totalImages));

  // Find min and max values
  let [minX, minY] = umapResult[0];
  let [maxX, maxY] = umapResult[0];

  for (let i = 0; i < umapResult.length; i++) {
    let [x, y, z] = umapResult[i];

    if (x < minX) minX = x;
    if (x > maxX) maxX = x;

    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  // Calculate center
  let centerX = (minX + maxX) / 2;
  let centerY = (minY + maxY) / 2;

  // Center and convert points to p5.Vectors
  for (let i = 0; i < umapResult.length; i++) {
    let x = umapResult[i][0] - centerX;
    let y = umapResult[i][1] - centerY;
    points2D.push(createVector(x, y));
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
  translate(width / 2 + panX, height / 2 + panY);
  scale(zoom);
  let sfactor = scaleSlider.value();
  for (let i = 0; i < points2D.length; i++) {
    push();
    let pos = points2D[i];
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

function mouseDragged() {
  panX += movedX;
  panY += movedY;
}

function keyPressed() {
  if (key === UP_ARROW) {
    zoom *= 1.1;
  } else if (key === DOWN_ARROW) {
    zoom *= 0.9;
  }
}
