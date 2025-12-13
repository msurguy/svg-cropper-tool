/* eslint-disable no-console */
import { useState, useEffect, useRef } from 'react';
import bsCustomFileInput from 'bs-custom-file-input';
import Moveable from 'react-moveable';
import Toggle from './components/Toggle';
import SelectField from './components/SelectField';
import Slider from './components/Slider';
import ButtonGroup from './components/ButtonGroup';
import { downloadSVG, pointsToPath, stringToInlineSVG, createPolygon } from './lib/utils';
import * as SVG from 'svg.js';
import * as ClipperLib from 'clipper-lib';
import { flattenSVG } from 'flatten-svg';
import { multipassOptimize } from './lib/optimizer';
import convertUnits from './lib/unitConverter';
import './sass/bootstrap.scss';
import './App.css';

const CROPPER_PATH_STYLE = {
  fill: 'none',
  stroke: '#f06',
  'stroke-width': '3px',
};

export default function App() {
  const cropperRef = useRef(null);
  const fileCropperRef = useRef(null);
  const croppedSVGRef = useRef(null);
  const moveableRef = useRef(null);
  const targetRef = useRef(null);

  const [source, setSource] = useState({
    originalSVG: '',
    width: { unit: 'px', value: 0 },
    height: { unit: 'px', value: 0 },
    name: '',
    loading: false,
    svg: null,
    optimized: { text: '', width: 0, height: 0 },
    closedPath: false,
    position: [0, 0],
  });

  const [cropper, setCropper] = useState({
    loading: false,
    set: false,
    scale: 100,
    x: 0,
    y: -1,
    width: 200,
    height: 200,
    closedPath: true,
    clean: false,
    cleanAmount: 0.1,
    simplify: false,
    lighten: false,
    lightenAmount: 0.1,
    type: 'rectangle',
    options: [
      { text: 'Rectangle', value: 'rectangle' },
      { text: 'Circle / Ellipse', value: 'ellipse' },
      { text: 'Polygon', value: 'polygon' },
      { text: 'Custom Shape', value: 'custom' },
      { text: 'SVG File', value: 'file' },
    ],
    rectangle: { el: null },
    ellipse: { el: null },
    polygon: { el: null, sides: 4, startingAngle: 0 },
    custom: { el: null, points: [] },
    file: { el: null },
    svg: { element: null, width: 0, height: 0 },
  });

  const [moveable, setMoveable] = useState({});

  useEffect(() => {
    bsCustomFileInput.init();
    const cropperEl = document.getElementById('cropper');
    setCropper((prev) => ({
      ...prev,
      svg: { ...prev.svg, element: SVG(cropperEl) },
      file: { ...prev.file, el: document.getElementById('file-cropper') },
    }));

    setMoveable({
      draggable: true,
      throttleDrag: 0,
      resizable: true,
      throttleResize: 1,
      keepRatio: false,
      scalable: false,
      throttleScale: 0,
      rotatable: false,
      throttleRotate: 0,
      origin: true,
      pinchable: false,
      container: document.getElementById('sketch'),
    });
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Shift') {
        setMoveable((prev) => ({ ...prev, keepRatio: true }));
      }
    };

    const onKeyUp = (e) => {
      if (e.key === 'Shift') {
        setMoveable((prev) => ({ ...prev, keepRatio: false }));
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  useEffect(() => {
    if (cropper.type) {
      switchCropperShape(cropper.type);
    }
  }, [cropper.type, cropper.polygon.sides, cropper.polygon.startingAngle]);

  useEffect(() => {
    if (cropper.custom.el && cropper.custom.points.length > 0) {
      cropper.custom.el.plot(cropper.custom.points);
    }
  }, [cropper.custom.points]);

  const switchCropperShape = (type) => {
    if (!cropper.svg.element) return;

    cropper.svg.element.clear();
    let points;

    switch (type) {
      case 'rectangle':
        setCropper((prev) => ({
          ...prev,
          rectangle: {
            ...prev.rectangle,
            el: prev.svg.element.rect().attr(CROPPER_PATH_STYLE),
          },
        }));
        cropper.rectangle.el?.size(cropper.width, cropper.height);
        cropper.rectangle.el?.move(cropper.x, cropper.y);
        break;
      case 'ellipse':
        setCropper((prev) => ({
          ...prev,
          ellipse: {
            ...prev.ellipse,
            el: prev.svg.element.ellipse().attr(CROPPER_PATH_STYLE),
          },
        }));
        cropper.ellipse.el?.size(cropper.width, cropper.height);
        cropper.ellipse.el?.center(
          cropper.x + cropper.width / 2,
          cropper.y + cropper.height / 2
        );
        break;
      case 'polygon':
        points = createPolygon(
          cropper.x + cropper.width / 2,
          cropper.y + cropper.height / 2,
          cropper.polygon.sides,
          cropper.width / 2,
          cropper.polygon.startingAngle
        );
        setCropper((prev) => ({
          ...prev,
          polygon: {
            ...prev.polygon,
            el: prev.svg.element.polygon(points).attr(CROPPER_PATH_STYLE),
          },
        }));
        cropper.polygon.el?.size(cropper.width, cropper.height);
        cropper.polygon.el?.center(
          cropper.x + cropper.width / 2,
          cropper.y + cropper.height / 2
        );
        break;
      case 'custom':
        setCropper((prev) => ({
          ...prev,
          custom: {
            ...prev.custom,
            el: prev.svg.element.polygon().attr(CROPPER_PATH_STYLE),
          },
        }));
        break;
    }
  };

  const cropperClicked = (e) => {
    if (cropper.type === 'custom') {
      const x = e.nativeEvent.offsetX;
      const y = e.nativeEvent.offsetY;
      setCropper((prev) => ({
        ...prev,
        custom: {
          ...prev.custom,
          points: [...prev.custom.points, [x, y]],
        },
      }));
    }
  };

  const clearCustomCropper = () => {
    setCropper((prev) => ({
      ...prev,
      custom: { ...prev.custom, points: [] },
    }));
  };

  const saveCustomCropper = () => {
    if (!cropper.custom.points.length) return;
    downloadSVG(cropper.svg.element.node, `cropper-shape-${Date.now()}`);
  };

  const moveCropperShape = (x, y) => {
    cropper[cropper.type]?.el?.center(x, y);
  };

  const resizeCropperShape = (width, height) => {
    cropper[cropper.type]?.el?.size(width, height);
  };

  const download = () => {
    downloadSVG(croppedSVGRef.current.firstChild, `cropped-${source.name}-${Date.now()}`);
  };

  const resetCropper = () => {
    setSource((prev) => ({
      ...prev,
      optimized: {},
      svg: null,
    }));
    clearCustomCropper();
  };

  const positionCropper = () => {
    setCropper((prev) => ({
      ...prev,
      x: 0,
      y: -1,
      width: source.optimized.width > 200 ? 200 : source.optimized.width,
      height: source.optimized.height > 200 ? 200 : source.optimized.height,
    }));
  };

  const onCropperFileChange = (e) => {
    setCropper((prev) => ({ ...prev, loading: true }));
    const files = e.target.files || e.dataTransfer.files;
    if (!files.length) return;
    readCropperImage(files[0]);
  };

  const readCropperImage = async (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const optimizedCropperImage = await multipassOptimize(e.target.result);
      cropper.file.el.innerHTML = optimizedCropperImage.text;
      setCropper((prev) => ({ ...prev, loading: false }));
    };
    reader.readAsText(file);
  };

  const onSourceFileChange = (e) => {
    setSource((prev) => ({ ...prev, loading: true }));
    resetCropper();

    const files = e.target.files || e.dataTransfer.files;
    if (!files.length) return;
    readSourceImage(files[0]);
  };

  const readSourceImage = async (file) => {
    setCropper((prev) => ({ ...prev, set: false }));
    const reader = new FileReader();
    reader.onload = async (e) => {
      // Set file name
      const fileName = file.name.substr(0, file.name.lastIndexOf('.'));
      setSource((prev) => ({ ...prev, name: fileName }));

      // try finding "<svg" in the document:
      let fileContents = e.target.result;

      let firstOccurenceOfSVG = fileContents.indexOf('<svg ');

      if (firstOccurenceOfSVG === -1) {
        firstOccurenceOfSVG = fileContents.indexOf('<SVG ');
      }

      // Remove everything that occurs prior to SVG opening tag
      fileContents = fileContents.substring(firstOccurenceOfSVG);

      const originalSVG = new DOMParser().parseFromString(fileContents, 'image/svg+xml')
        .documentElement;
      let originalWidthString;
      let originalHeightString;
      let shouldTransform = false;
      let parsedViewbox;
      let viewBoxDimensions = {
        width: 0,
        height: 0,
      };

      const viewBox = originalSVG.hasAttribute('viewbox')
        ? originalSVG.getAttribute('viewbox')
        : originalSVG.getAttribute('viewBox');
      // if viewbox exists, retrieve dimensions from the two last values of the string
      if (viewBox) {
        const viewBoxDelimeter = viewBox.indexOf(',') > -1 ? ',' : ' ';
        parsedViewbox = viewBox.split(viewBoxDelimeter).map((value) => parseFloat(value));
        viewBoxDimensions.width = parsedViewbox[2];
        viewBoxDimensions.height = parsedViewbox[3];
      }

      if (originalSVG.hasAttribute('width') && originalSVG.hasAttribute('height')) {
        originalWidthString = originalSVG.getAttribute('width');
        originalHeightString = originalSVG.getAttribute('height');
        shouldTransform = ['m', 'mm', 'in', 'pt', 'pc', 'ft'].some((substring) =>
          originalWidthString.includes(substring)
        );

        viewBoxDimensions = {
          width: originalWidthString,
          height: originalHeightString,
        };
      } else {
        originalSVG.setAttribute('width', `${viewBoxDimensions.width}px`);
        originalSVG.setAttribute('height', `${viewBoxDimensions.height}px`);
      }

      if (viewBoxDimensions.width === 0 && viewBoxDimensions.height === 0)
        alert('Cannot retrieve dimensions (width / height) of the SVG file');

      if (shouldTransform) {
        const widthUnit = originalWidthString.match(/[a-zA-Z]+/g)[0];
        const heightUnit = originalHeightString.match(/[a-zA-Z]+/g)[0];

        setSource((prev) => ({
          ...prev,
          width: { unit: widthUnit, value: parseFloat(originalWidthString.slice(0, -widthUnit.length)) },
          height: { unit: heightUnit, value: parseFloat(originalHeightString.slice(0, -heightUnit.length)) },
        }));

        const transformedWidth = convertUnits(
          parseFloat(originalWidthString.slice(0, -widthUnit.length)),
          widthUnit,
          'px'
        );
        const transformedHeight = convertUnits(
          parseFloat(originalHeightString.slice(0, -heightUnit.length)),
          heightUnit,
          'px'
        );

        let totalWidth = transformedWidth;
        let totalHeight = transformedHeight;

        if (
          parseFloat(originalWidthString.slice(0, -widthUnit.length)) <
          viewBoxDimensions.width
        ) {
          totalWidth = convertUnits(viewBoxDimensions.width, widthUnit, 'px');
        }

        if (
          parseFloat(originalHeightString.slice(0, -heightUnit.length)) <
          viewBoxDimensions.height
        ) {
          totalHeight = convertUnits(viewBoxDimensions.height, heightUnit, 'px');
        }

        originalSVG.setAttribute('width', `${totalWidth}px`);
        originalSVG.setAttribute('height', `${totalHeight}px`);

        // Wrap the SVG contents into a group and scale that whole group
        originalSVG.innerHTML = `<g transform="scale(${
          transformedWidth / parseFloat(originalWidthString.slice(0, -widthUnit.length))
        } ${
          transformedHeight / parseFloat(originalHeightString.slice(0, -heightUnit.length))
        })">${originalSVG.innerHTML}</g>`;
      }
      // Get rid of the viewBox since we don't need it anymore, and it's wrong anyway
      originalSVG.removeAttribute('viewBox');

      // Optimize the SVG via SVGO
      const optimized = await multipassOptimize(originalSVG.outerHTML);
      setSource((prev) => ({
        ...prev,
        originalSVG,
        optimized,
        svg: stringToInlineSVG(optimized.text),
        loading: false,
      }));

      // Update cropper SVG dimensions
      cropper.svg.element.clear().size(optimized.width, optimized.height);

      positionCropper();
      setCropper((prev) => ({ ...prev, set: true }));

      switchCropperShape(cropper.type);
    };
    reader.readAsText(file);
  };

  const crop = () => {
    setCropper((prev) => ({ ...prev, loading: true }));
    const parser = new DOMParser();
    const sourceElement = parser.parseFromString(source.optimized.text, 'image/svg+xml');
    const flattenedSource = flattenSVG(sourceElement.documentElement);
    const flattenedCropper =
      cropper.type === 'file'
        ? flattenSVG(cropper.file.el.children[0])
        : flattenSVG(cropper.svg.element.node);

    let croppedPaths = '';

    flattenedSource.forEach((path) => {
      let combinedShape = [];
      let newpath = [];
      path.points.forEach((shape) => {
        newpath.push({ X: shape[0], Y: shape[1] });
      });

      combinedShape.push(newpath);

      let cuttingShape = [];
      let cuttingPath = [];
      flattenedCropper[0].points.forEach((shape) => {
        cuttingPath.push({ X: shape[0], Y: shape[1] });
      });

      cuttingShape.push(cuttingPath);

      const subj_paths = combinedShape;
      const clip_paths = cuttingShape;

      const cpr = new ClipperLib.Clipper();

      ClipperLib.JS.ScaleUpPaths(subj_paths, cropper.scale);
      ClipperLib.JS.ScaleUpPaths(clip_paths, cropper.scale);

      cpr.AddPaths(subj_paths, ClipperLib.PolyType.ptSubject, source.closedPath);
      cpr.AddPaths(clip_paths, ClipperLib.PolyType.ptClip, cropper.closedPath);

      const solution_polytree = new ClipperLib.PolyTree();
      cpr.Execute(
        ClipperLib.ClipType.ctIntersection,
        solution_polytree,
        ClipperLib.PolyFillType.pftNonZero,
        ClipperLib.PolyFillType.pftNonZero
      );
      let solution_paths = ClipperLib.Clipper.PolyTreeToPaths(solution_polytree);

      if (cropper.clean) {
        solution_paths = ClipperLib.JS.Clean(solution_paths, cropper.cleanAmount * cropper.scale);
      }

      if (cropper.simplify) {
        solution_paths = ClipperLib.Clipper.SimplifyPolygons(solution_paths);
      }

      if (cropper.lighten) {
        solution_paths = ClipperLib.JS.Lighten(
          solution_paths,
          cropper.lightenAmount * cropper.scale
        );
      }

      if (solution_paths.length) {
        croppedPaths +=
          '<path stroke="black" fill="none" stroke-width="1" d="' +
          pointsToPath(solution_paths, cropper.scale, source.closedPath) +
          '"/>';
      }
    });

    croppedSVGRef.current.innerHTML = `<svg style="background-color:#FFF" width="${source.optimized.width}" height="${source.optimized.height}">${croppedPaths}</svg>`;
    setCropper((prev) => ({ ...prev, loading: false }));
  };

  const handleDrag = ({ target, left, top, transform }) => {
    target.style.left = `${left}px`;
    target.style.top = `${top}px`;
    target.style.transform = transform;
    setCropper((prev) => ({ ...prev, x: left, y: top }));
    moveCropperShape(left + cropper.width / 2, top + cropper.height / 2);
  };

  const handleResize = ({ target, width, height, delta, drag }) => {
    delta[0] && (target.style.width = `${width}px`);
    delta[1] && (target.style.height = `${height}px`);
    target.style.transform = drag.transform;
    setCropper((prev) => ({ ...prev, width, height }));
    moveCropperShape(
      parseInt(target.style.left.replace('px', '')) + width / 2,
      parseInt(target.style.top.replace('px', '')) + height / 2
    );
    resizeCropperShape(width, height);
  };

  return (
    <div className="page">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="controls-wrapper">
          <div className="controls">
            <p className="mt-3 lead text-center text-white"> Source </p>
            <div className="sidebar-control">
              <div className="control-header">
                <div></div>
                <div className="control-label">Upload File</div>
                <div></div>
              </div>
              <div className="custom-file">
                <input
                  onChange={onSourceFileChange}
                  type="file"
                  accept="image/svg+xml"
                  className="custom-file-input"
                  id="sourcefile"
                />
                <label className="custom-file-label" htmlFor="sourcefile">
                  Choose file
                </label>
              </div>
            </div>

            {source.loading && (
              <div className="progress">
                <div
                  className="progress-bar"
                  role="progressbar"
                  aria-valuenow="100"
                  aria-valuemin="0"
                  aria-valuemax="100"
                  style={{ width: '100%' }}
                >
                  Loading SVG
                </div>
              </div>
            )}

            {source.svg && (
              <div className="slide-enter-to">
                <Toggle
                  label="Closed Path"
                  value={source.closedPath}
                  onChange={(val) =>
                    setSource((prev) => ({ ...prev, closedPath: val }))
                  }
                />
                <p className="mt-3 lead text-center text-white"> Cropper </p>
                <SelectField
                  label="Cropper type"
                  value={cropper.type}
                  options={cropper.options}
                  onChange={(val) => setCropper((prev) => ({ ...prev, type: val }))}
                />
                {cropper.type === 'custom' && (
                  <ButtonGroup
                    onLeftClick={clearCustomCropper}
                    onRightClick={saveCustomCropper}
                  />
                )}
                {cropper.type === 'file' && (
                  <div className="sidebar-control">
                    <div className="custom-file">
                      <input
                        onChange={onCropperFileChange}
                        type="file"
                        accept="image/svg+xml"
                        className="custom-file-input"
                        id="cropperFile"
                      />
                      <label className="custom-file-label" htmlFor="cropperFile">
                        Choose file
                      </label>
                    </div>
                  </div>
                )}
                {cropper.type === 'polygon' && (
                  <>
                    <Slider
                      min={3}
                      max={10}
                      step={1}
                      label="Sides"
                      value={cropper.polygon.sides}
                      onChange={(val) =>
                        setCropper((prev) => ({
                          ...prev,
                          polygon: { ...prev.polygon, sides: val },
                        }))
                      }
                    />
                    <Slider
                      min={0}
                      max={360}
                      step={1}
                      label="Angle"
                      value={cropper.polygon.startingAngle}
                      onChange={(val) =>
                        setCropper((prev) => ({
                          ...prev,
                          polygon: { ...prev.polygon, startingAngle: val },
                        }))
                      }
                    />
                  </>
                )}
                <Slider
                  min={30}
                  max={1000}
                  label="Quality"
                  value={cropper.scale}
                  onChange={(val) => setCropper((prev) => ({ ...prev, scale: val }))}
                />
                <Toggle
                  label="Clean Path"
                  value={cropper.clean}
                  onChange={(val) => setCropper((prev) => ({ ...prev, clean: val }))}
                />
                {cropper.clean && (
                  <Slider
                    min={0.1}
                    max={2}
                    step={0.1}
                    label="Clean Amount"
                    value={cropper.cleanAmount}
                    onChange={(val) =>
                      setCropper((prev) => ({ ...prev, cleanAmount: val }))
                    }
                  />
                )}
                <Toggle
                  label="Lighten Path"
                  value={cropper.lighten}
                  onChange={(val) => setCropper((prev) => ({ ...prev, lighten: val }))}
                />
                {cropper.lighten && (
                  <Slider
                    min={0.1}
                    max={2}
                    step={0.1}
                    label="Lighten Amount"
                    value={cropper.lightenAmount}
                    onChange={(val) =>
                      setCropper((prev) => ({ ...prev, lightenAmount: val }))
                    }
                  />
                )}
                <Toggle
                  label="Simplify Path"
                  value={cropper.simplify}
                  onChange={(val) => setCropper((prev) => ({ ...prev, simplify: val }))}
                />
                <button
                  onClick={crop}
                  disabled={cropper.loading}
                  className="btn btn-block btn-secondary"
                >
                  Crop
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="button">
          <div className="reveal"></div>
          <button className="btn btn-primary btn-block" onClick={download}>
            Download SVG
          </button>
        </div>
      </div>

      {/* Page Content */}
      <div className="paper">
        <div id="sketch" className="sketch">
          <div ref={cropperRef} id="cropper" onClick={cropperClicked}></div>
          <div ref={fileCropperRef} id="file-cropper"></div>
          {cropper.set && (
            <>
              <div ref={targetRef} className="moveable-frame"></div>
              <Moveable
                ref={moveableRef}
                target={targetRef}
                {...moveable}
                onDrag={handleDrag}
                onResize={handleResize}
              />
            </>
          )}
          {source.svg && (
            <img
              src={source.svg}
              width={source.optimized.width}
              height={source.optimized.height}
              alt="Source SVG File Preview"
            />
          )}
        </div>
        <div ref={croppedSVGRef} id="croppedSVG"></div>
      </div>
      <div className="footer-wrapper">
        <div className="footer">
          <h1>SVG Cropper</h1>
          <p>
            Project by{' '}
            <a target="_blank" rel="noreferrer" href="http://twitter.com/msurguy">
              @msurguy
            </a>{' '}
            (
            <a
              target="_blank"
              rel="noreferrer"
              href="http://github.com/msurguy/svg-cropper-tool"
            >
              Source
            </a>
            )
          </p>
        </div>
      </div>
    </div>
  );
}
