# Clustering-Umap-Embeddings

This repository contains examples of clustering images using UMAP (Uniform Manifold Approximation and Projection) visualization.

The examples use an embeddings database (`embeddings/embeddings.bin`, `embeddings/photos.json`) from this[Create Embeddings Database](https://github.com/shiffman/create-embeddings-database) node.js repo.

## Examples

- **2D**: Visualize images in a 2D UMAP projection
- **3D**: Visualize images in a 3D UMAP projection
- **Grid**: Organize images in a grid based on UMAP projection

## How It Works

The examples use image embeddings (vector representations) created with CLIP (Contrastive Language-Image Pre-training) and visualize them using UMAP to reveal clusters of similar images.

### Creating Embeddings

The embeddings used in these examples were created using the [Create Embeddings Database](https://github.com/shiffman/create-embeddings-database) repository with the following model:

```javascript
const processor = await AutoProcessor.from_pretrained('Xenova/clip-vit-base-patch16');
const vision_model = await CLIPVisionModelWithProjection.from_pretrained(
  'Xenova/clip-vit-base-patch16'
);

// Example of extracting embeddings from an image
const image = await RawImage.read(imageUrl);
const image_inputs = await processor(image);
const { image_embeds } = await vision_model(image_inputs);
const image_embeddings = image_embeds.normalize().tolist();
```

### UMAP Visualization

These examples use [umap-js](https://github.com/PAIR-code/umap-js) for dimensionality reduction and visualization.

## Resources

- [Understanding UMAP](https://pair-code.github.io/understanding-umap/) - A visual explanation of UMAP
- [umap-js](https://github.com/PAIR-code/umap-js) - JavaScript implementation of UMAP
