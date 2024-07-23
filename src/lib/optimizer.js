import { optimize } from 'svgo/dist/svgo.browser.js';

const pluginSettings = [
  {
    "id": "removeDoctype",
    "name": "Remove doctype",
    "enabled": false,
    "enabledByDefault": true
  },
  {
    "id": "removeXMLProcInst",
    "name": "Remove XML instructions",
    "enabled": false,
    "enabledByDefault": true
  },
  {
    "id": "removeComments",
    "name": "Remove comments",
    "enabled": true,
    "enabledByDefault": true
  },
  {
    "id": "removeMetadata",
    "name": "Remove <metadata>",
    "enabled": true,
    "enabledByDefault": true
  },
  {
    "id": "removeXMLNS",
    "name": "Remove xmlns",
    "enabled": false,
    "enabledByDefault": false
  },
  {
    "id": "removeEditorsNSData",
    "enabled": true,
    "name": "Remove editor data",
    "enabledByDefault": true
  },
  {
    "id": "cleanupAttrs",
    "enabled": true,
    "name": "Clean up attribute whitespace",
    "enabledByDefault": true
  },
  {
    "id": "mergeStyles",
    "enabled": true,
    "name": "Merge styles",
    "enabledByDefault": true
  },
  {
    "id": "inlineStyles",
    "enabled": true,
    "name": "Inline styles",
    "enabledByDefault": true
  },
  {
    "id": "minifyStyles",
    "enabled": true,
    "name": "Minify styles",
    "enabledByDefault": true
  },
  {
    "id": "convertStyleToAttrs",
    "enabled": true,
    "name": "Style to attributes",
    "enabledByDefault": false
  },
  {
    "id": "cleanupIDs",
    "enabled": true,
    "name": "Clean up IDs",
    "enabledByDefault": true
  },
  {
    "id": "removeRasterImages",
    "enabled": true,
    "name": "Remove raster images",
    "enabledByDefault": false
  },
  {
    "id": "removeUselessDefs",
    "enabled": true,
    "name": "Remove unused defs",
    "enabledByDefault": true
  },
  {
    "id": "cleanupNumericValues",
    "enabled": true,
    "name": "Round/rewrite numbers",
    "enabledByDefault": true
  },
  {
    "id": "cleanupListOfValues",
    "enabled": true,
    "name": "Round/rewrite number lists",
    "enabledByDefault": false
  },
  {
    "id": "convertColors",
    "enabled": true,
    "name": "Minify colours",
    "enabledByDefault": true
  },
  {
    "id": "removeUnknownsAndDefaults",
    "enabled": true,
    "name": "Remove unknowns & defaults",
    "enabledByDefault": true
  },
  {
    "id": "removeNonInheritableGroupAttrs",
    "enabled": true,
    "name": "Remove unneeded group attrs",
    "enabledByDefault": true
  },
  {
    "id": "removeUselessStrokeAndFill",
    "enabled": true,
    "name": "Remove useless stroke & fill",
    "enabledByDefault": true
  },
  {
    "id": "removeViewBox",
    "enabled": false,
    "name": "Remove viewBox",
    "enabledByDefault": true
  },
  {
    "id": "cleanupEnableBackground",
    "enabled": true,
    "name": "Remove/tidy enable-background",
    "enabledByDefault": true
  },
  {
    "id": "removeHiddenElems",
    "enabled": true,
    "name": "Remove hidden elements",
    "enabledByDefault": true
  },
  {
    "id": "removeEmptyText",
    "enabled": true,
    "name": "Remove empty text",
    "enabledByDefault": true
  },
  {
    "id": "convertShapeToPath",
    "enabled": true,
    "name": "Shapes to (smaller) paths",
    "enabledByDefault": true
  },
  {
    "id": "moveElemsAttrsToGroup",
    "enabled": true,
    "name": "Move attrs to parent group",
    "enabledByDefault": true
  },
  {
    "id": "moveGroupAttrsToElems",
    "enabled": true,
    "name": "Move group attrs to elements",
    "enabledByDefault": true
  },
  {
    "id": "collapseGroups",
    "enabled": true,
    "name": "Collapse useless groups",
    "enabledByDefault": true
  },
  {
    "id": "convertPathData",
    "enabled": false,
    "name": "Round/rewrite paths",
    "enabledByDefault": true
  },
  {
    "id": "convertEllipseToCircle",
    "enabled": true,
    "name": "Convert non-eccentric <ellipse> to <circle>",
    "enabledByDefault": true
  },
  {
    "id": "convertTransform",
    "enabled": true,
    "name": "Round/rewrite transforms",
    "enabledByDefault": true
  },
  {
    "id": "removeEmptyAttrs",
    "enabled": true,
    "name": "Remove empty attrs",
    "enabledByDefault": true
  },
  {
    "id": "removeEmptyContainers",
    "enabled": true,
    "name": "Remove empty containers",
    "enabledByDefault": true
  },
  {
    "id": "mergePaths",
    "enabled": true,
    "name": "Merge paths",
    "enabledByDefault": true
  },
  {
    "id": "removeUnusedNS",
    "enabled": true,
    "name": "Remove unused namespaces",
    "enabledByDefault": true
  },
  {
    "id": "reusePaths",
    "enabled": false,
    "name": "Replace duplicate elements with links",
    "enabledByDefault": false
  },
  {
    "id": "sortAttrs",
    "enabled": true,
    "name": "Sort attrs",
    "enabledByDefault": true
  },
  {
    "id": "sortDefsChildren",
    "enabled": true,
    "name": "Sort children of <defs>",
    "enabledByDefault": true
  },
  {
    "id": "removeTitle",
    "name": "Remove <title>",
    "enabled": false,
    "enabledByDefault": true
  },
  {
    "id": "removeDesc",
    "name": "Remove <desc>",
    "enabled": false,
    "enabledByDefault": true
  },
  {
    "id": "removeDimensions",
    "enabled": true,
    "name": "Prefer viewBox to width/height",
    "enabledByDefault": false
  },
  {
    "id": "removeStyleElement",
    "enabled": true,
    "name": "Remove style elements",
    "enabledByDefault": false
  },
  {
    "id": "removeScriptElement",
    "enabled": true,
    "name": "Remove script elements",
    "enabledByDefault": false
  },
  {
    "id": "removeOffCanvasPaths",
    "enabled": false,
    "name": "Remove out-of-bounds paths",
    "enabledByDefault": false
  }
]

const defaultSettings = {
  floatPrecision: 2,
  transformPrecision: 5,
  multipass: true,
  plugins: pluginSettings,
  pretty: true
}

const createDimensionsExtractor = () => {
  const dimensions = {};
  const plugin = {
    type: 'visitor',
    name: 'extract-dimensions',
    fn() {
      return {
        element: {
          // Node, parentNode
          enter({ name, attributes }, { type }) {
            if (name === 'svg' && type === 'root') {
              if (
                attributes.width !== undefined &&
                attributes.height !== undefined
              ) {
                dimensions.width = Number.parseFloat(attributes.width);
                dimensions.height = Number.parseFloat(attributes.height);
              } else if (attributes.viewBox !== undefined) {
                const viewBox = attributes.viewBox.split(/,\s*|\s+/);
                dimensions.width = Number.parseFloat(viewBox[2]);
                dimensions.height = Number.parseFloat(viewBox[3]);
              }
            }
          },
        },
      };
    },
  };

  return [dimensions, plugin];
};

function compress(svgInput, settings = defaultSettings) {
  // setup plugin list
  const floatPrecision = Number(settings.floatPrecision);
  const transformPrecision = Number(settings.transformPrecision);
  const plugins = [];

  for (const [name, enabled] of Object.entries(settings.plugins)) {
    if (!enabled) continue;

    const plugin = {
      name,
      params: {},
    };

    // TODO: revisit this
    // 0 almost always breaks images when used on `cleanupNumericValues`.
    // Better to allow 0 for everything else, but switch to 1 for this plugin.
    plugin.params.floatPrecision =
      plugin.name === 'cleanupNumericValues' && floatPrecision === 0
        ? 1
        : floatPrecision;

    plugin.params.transformPrecision = transformPrecision;

    plugins.push(plugin);
  }

  // multipass optimization
  const [dimensions, extractDimensionsPlugin] = createDimensionsExtractor();
  const { data, error } = optimize(svgInput, {
    multipass: settings.multipass,
    plugins: [...plugins, extractDimensionsPlugin],
    js2svg: {
      indent: 2,
      pretty: settings.pretty,
    },
  });

  if (error) throw new Error(error);

  return { data, dimensions };
}

const actions = {
  wrapOriginal({ data }) {
    const [dimensions, extractDimensionsPlugin] = createDimensionsExtractor();
    const { error } = optimize(data, {
      plugins: [extractDimensionsPlugin],
    });

    if (error) throw new Error(error);

    return dimensions;
  },
  process({ data, settings }) {
    return compress(data, settings);
  },
};


// import actions from './svgo'

// const iterationCallback = async function () {}

// export async function multipassOptimize(svg) {
//   await actions.load({data: svg})
//   let fileResult = await actions.process()
//   let resultFile = {
//     text: fileResult.data,
//     width: fileResult.dimensions.width,
//     height: fileResult.dimensions.height
//   }
//   // eslint-disable-next-line no-cond-assign
//   while (fileResult = await actions.nextPass()) {
//     resultFile = {text: fileResult.data, width: fileResult.dimensions.width, height: fileResult.dimensions.height}
//     await iterationCallback(resultFile);
//   }
//   return resultFile;
// }
