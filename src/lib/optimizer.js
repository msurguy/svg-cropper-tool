import { optimize } from 'svgo/dist/svgo.browser.js';

// SVGO configuration based on the original settings
const svgoConfig = {
  multipass: true,
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          removeViewBox: false,
        },
      },
    },
    'removeComments',
    'removeMetadata',
    'removeEditorsNSData',
    'cleanupAttrs',
    'inlineStyles',
    'minifyStyles',
    'convertStyleToAttrs',
    'cleanupIds',
    'removeRasterImages',
    'removeUselessDefs',
    'cleanupNumericValues',
    'cleanupListOfValues',
    'convertColors',
    'removeUnknownsAndDefaults',
    'removeNonInheritableGroupAttrs',
    'removeUselessStrokeAndFill',
    'cleanupEnableBackground',
    'removeHiddenElems',
    'removeEmptyText',
    'convertShapeToPath',
    'moveElemsAttrsToGroup',
    'moveGroupAttrsToElems',
    'collapseGroups',
    'convertPathData',
    'convertTransform',
    'removeEmptyAttrs',
    'removeEmptyContainers',
    'removeUnusedNS',
    'sortAttrs',
    'removeTitle',
    'removeDesc',
    'removeScriptElement',
  ],
  js2svg: {
    indent: 2,
    pretty: true,
  },
};

// Extract dimensions from SVG string
function getDimensions(svgString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');
  const svgEl = doc.documentElement;

  if (!svgEl || svgEl.nodeName !== 'svg') {
    return { width: 0, height: 0 };
  }

  // Try to get width and height from attributes
  if (svgEl.hasAttribute('width') && svgEl.hasAttribute('height')) {
    return {
      width: svgEl.getAttribute('width'),
      height: svgEl.getAttribute('height'),
    };
  }

  // Try to get dimensions from viewBox
  if (svgEl.hasAttribute('viewBox')) {
    const viewBox = svgEl.getAttribute('viewBox').split(/[\s,]+/);
    if (viewBox.length >= 4) {
      return {
        width: viewBox[2],
        height: viewBox[3],
      };
    }
  }

  return { width: 0, height: 0 };
}

export async function multipassOptimize(svg) {
  try {
    // Optimize the SVG using svgo/browser
    const result = optimize(svg, svgoConfig);

    // Extract dimensions from the optimized SVG
    const dimensions = getDimensions(result.data);

    return {
      text: result.data,
      width: dimensions.width,
      height: dimensions.height,
    };
  } catch (error) {
    console.error('SVGO optimization error:', error);
    // Return the original SVG if optimization fails
    const dimensions = getDimensions(svg);
    return {
      text: svg,
      width: dimensions.width,
      height: dimensions.height,
    };
  }
}
