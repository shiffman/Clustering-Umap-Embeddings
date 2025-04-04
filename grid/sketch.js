// Machine Learning for Creative Coding
// https://github.com/shiffman/ML-for-Creative-Coding

// Array of images
let images = [];
// Array of photo metadata
let photos;

// Make a grid
let cols = 24;
let rows = 24;

// Only process this many images
let totalImages = cols * rows;
let imageSize;
let gridPoints = [];

async function setup() {
  createCanvas(1024, 1024);
  imageSize = width / cols;

  photos = await loadJSON('/data/photo.json');

  // Load and chop up embeddings
  let rawData = await loadBytes('/data/embeddings.bin');
  let rawFloats = new Float32Array(rawData.buffer, rawData.byteOffset, rawData.byteLength / 4);
  let embeddingLength = 512;
  let embeddings = [];
  for (let i = 0; i < rawFloats.length / embeddingLength; i++) {
    let start = i * embeddingLength;
    embeddings.push(rawFloats.slice(start, start + embeddingLength));
  }

  // Run UMAP for 2D projection
  let umap = new UMAP({ nComponents: 2, nNeighbors: 15, minDist: 0.1 });
  let points2D = umap.fit(embeddings.slice(0, totalImages));

  // Normalize and arrange points on grid
  points2D = normalizePoints(points2D, width, height);
  gridPoints = calculateGrid(points2D, cols, rows);
  loadImages();
}

async function loadImages() {
  for (let i = 0; i < totalImages; i++) {
    images[i] = await loadImage(`${photos[i].url}?w=100&h=100&fit=max&q=90`);
    if ((i + 1) % 20 === 0) {
      console.log(`Loaded ${i + 1}/${totalImages} images`);
    }
  }
}

function draw() {
  background(20);
  // Draw images arranged in the grid positions
  for (let pt of gridPoints) {
    let img = images[pt.imageIndex];
    if (img) {
      image(img, pt.position.x, pt.position.y, imageSize, imageSize);
    }
  }
}

function normalizePoints(points, width, height) {
  // Start by assuming the first point has both the min and max values
  let minX = points[0][0];
  let maxX = points[0][0];
  let minY = points[0][1];
  let maxY = points[0][1];

  // Find the actual min and max for X and Y across all points
  for (let i = 0; i < points.length; i++) {
    let x = points[i][0];
    let y = points[i][1];

    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  // Now, map all points to the canvas size and store as p5.Vector objects
  let normalized = [];
  for (let i = 0; i < points.length; i++) {
    let x = map(points[i][0], minX, maxX, 0, width);
    let y = map(points[i][1], minY, maxY, 0, height);
    normalized.push(createVector(x, y));
  }

  return normalized;
}
function calculateGrid(points2D, cols, rows) {
  let grid = [];
  let alreadyPlaced = [];

  // Loop through rows and columns to set each grid position
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      let gridX = col * imageSize;
      let gridY = row * imageSize;

      let closestIndex = -1;
      let closestDist = Infinity;

      // Find the closest unused point
      for (let i = 0; i < points2D.length; i++) {
        // Skip already-used points
        if (alreadyPlaced.includes(i)) {
          continue;
        }

        let p = points2D[i];
        let d = dist(gridX, gridY, p.x, p.y);

        if (d < closestDist) {
          closestDist = d;
          closestIndex = i;
        }
      }

      // Mark this point as used
      alreadyPlaced.push(closestIndex);
      grid.push({
        position: createVector(gridX, gridY),
        imageIndex: closestIndex,
      });
    }
  }
  return grid;
}
