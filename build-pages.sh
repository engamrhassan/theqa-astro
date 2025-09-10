#!/bin/bash
# Build script for Cloudflare Pages
# Only build the Astro site, not the worker

echo "Building Astro site for Cloudflare Pages..."

# Install dependencies
npm ci

# Build the Astro site
npm run build

echo "Build completed successfully!"
