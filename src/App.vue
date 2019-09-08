<template>
    <div class="page">
        <!-- Sidebar -->
        <div class="sidebar">
            <div class="controls-wrapper">
                <div class="controls">
                    <p class="mt-3 lead text-center text-white"> Source </p>
                    <div class="sidebar-control">
                        <div class="control-header">
                            <div></div>
                            <div class="control-label">
                                Upload File
                            </div>
                            <div></div>
                        </div>
                        <div class="custom-file">
                            <input @change="onFileChange" type="file" accept="image/svg+xml" class="custom-file-input"
                                   id="sourcefile">
                            <label class="custom-file-label" for="sourcefile">Choose file</label>
                        </div>
                    </div>

                    <div class="progress" v-if="source.loading">
                        <div class="progress-bar" role="progressbar"
                             aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" style="width: 100%">Loading SVG</div>
                    </div>
                    <transition name="slide">
                        <div v-if="source.svg">
                            <toggle label="Closed Path" v-model="source.closedPath"></toggle>
                            <p class="mt-3 lead text-center text-white"> Cropper </p>
<!--                            <toggle v-if="cropper.type === 'file' || cropper.type === 'custom'" label="Closed Path"-->
<!--                                    v-model="cropper.closedPath"></toggle>-->
                            <select-field label="Cropper type" v-model="cropper.type"
                                          :options="cropper.options"></select-field>
                            <simple-button v-if="cropper.type === 'custom'" @click="clearCustomCropper">Clear Shape</simple-button>
                            <slider v-if="cropper.type === 'polygon'" :min="3" :max="10" :step="1" label="Sides"
                                    v-model.number="cropper.polygon.sides"></slider>
                            <slider v-if="cropper.type === 'polygon'" :min="0" :max="360" :step="1" label="Angle"
                                    v-model.number="cropper.polygon.startingAngle"></slider>
                            <slider :min="30" :max="1000" label="Quality" v-model.number="cropper.scale"></slider>
                            <toggle label="Clean Path" v-model="cropper.clean"></toggle>
                            <slider v-if="cropper.clean" :min="0.1" :max="2" :step="0.1" label="Clean Amount"
                                    v-model.number="cropper.cleanAmount"></slider>
                            <toggle label="Lighten Path" v-model="cropper.lighten"></toggle>
                            <slider v-if="cropper.lighten" :min="0.1" :max="2" :step="0.1" label="Lighten Amount"
                                    v-model.number="cropper.lightenAmount"></slider>
                            <toggle label="Simplify Path" v-model="cropper.simplify"></toggle>
                            <button @click="crop" :disabled="cropper.loading" class="btn btn-block btn-secondary">Crop</button>

                        </div>
                    </transition>

                </div>
            </div>

            <div class="button">
                <div class="reveal"></div>
                <button class="btn btn-primary btn-block" @click.prevent="download">
                    Download SVG
                </button>
            </div>
        </div>

        <!-- Page Content -->
        <div class="paper">
            <div id="sketch" class="sketch">
                <div ref="cropper" id="cropper" @click="cropperClicked"></div>
                <Moveable v-if="cropper.set"
                          ref="moveable"
                          class="moveable-frame"
                          v-bind="moveable"
                          @drag="handleDrag"
                          @resize="handleResize"
                >
                </Moveable>
                <img v-if="source.svg" :src="source.svg" :width="source.optimized.width" :height="source.optimized.height"
                     alt="Source SVG File Preview">
            </div>
            <div ref="croppedSVG" id="croppedSVG"></div>
        </div>
        <div class="footer-wrapper">
            <div class="footer">
                <h1>SVG Cropper</h1>
                <p>Project by <a target="_blank" href="http://twitter.com/msurguy">@msurguy</a> (<a target="_blank"
                                                                                                    href="http://github.com/msurguy/svg-cropper">Source</a>)
                </p>
            </div>
        </div>
    </div>
</template>

<script>
  /* eslint-disable no-console */
  import bsCustomFileInput from 'bs-custom-file-input'

  // import {eventBus} from '@/main'
  import Toggle from "@/components/Toggle";
  import SelectField from "@/components/SelectField";
  import Slider from "@/components/Slider";
  import SimpleButton from "@/components/SimpleButton";
  import {downloadSVG, pointsToPath, stringToInlineSVG} from "@/lib/utils";
  import Moveable from 'vue-moveable';
  import * as SVG from 'svg.js'
  import * as ClipperLib from 'clipper-lib'
  import {flattenSVG} from 'flatten-svg';
  import {multipassOptimize} from '@/lib/optimizer'

  const CROPPER_PATH_STYLE = {
    fill: 'none',
    stroke: '#f06',
    'stroke-width': '3px'
  }

  function createPolygon(x, y, numOfSides, radius, minAngle) {
    let points = ''
    let xo
    let yo
    for (let i = 0; i < numOfSides; i++) {
      let t = (Math.PI*2 / numOfSides * i) + minAngle * (Math.PI / 180)
      xo = x + radius * Math.sin(t)
      yo = y + radius * Math.cos(t)
      points += xo + ',' + yo + ' '
    }
    return points
  }


  export default {
    name: 'App',
    components: {
      Toggle,
      SelectField,
      Slider,
      SimpleButton,
      Moveable
    },
    watch: {
      'cropper.type' (type, previousType) {
        if (type === 'custom' && previousType !== 'custom') {
          this.cropper.set = false
        }

        if (previousType === 'custom' && type !== 'custom') {
          this.positionCropper()
          this.cropper.set = true
        }

        this.switchCropperShape(type)
      },
      'cropper.polygon.sides' () {
        this.switchCropperShape(this.cropper.type)
      },
      'cropper.polygon.startingAngle'() {
        this.switchCropperShape(this.cropper.type)
      },
      'cropper.custom.points' (points) {
        this.cropper.custom.el.plot(points)
      }
    },
    mounted() {
      bsCustomFileInput.init()
      const cropperEl = document.getElementById('cropper')
      this.cropper.svg.element = SVG(cropperEl)
      this.moveable = {
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
        container: document.getElementById('sketch')
      }
    },
    created: function () {
      window.addEventListener('keydown', this.onKeyDown)
      window.addEventListener('keyup', this.onKeyUp)
    },
    beforeDestroy: function () {
      window.removeEventListener('keydown', this.onKeyDown)
      window.removeEventListener('keyup', this.onKeyUp)
    },
    data() {
      return {
        moveable: {},
        source: {
          loading: false,
          svg: null,
          optimized: {
            text: '',
            width: 0,
            height: 0
          },
          closedPath: false,
          position: [0, 0]
        },
        cropper: {
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
            {text: 'Rectangle', value: 'rectangle'},
            {text: 'Circle / Ellipse', value: 'ellipse'},
            {text: 'Polygon', value: 'polygon'},
            {text: 'Custom Shape', value: 'custom'},
            {text: 'SVG File', value: 'file'}
          ],
          rectangle: {
            el: null,
          },
          ellipse: {
            el: null,
          },
          polygon: {
            el: null,
            sides: 4,
            startingAngle: 0
          },
          custom: {
            el: null,
            points: []
          },
          svg: {
            element: null,
            text: '',
            file: null,
            width: 0,
            height: 0
          }
        }
      }
    },
    methods: {
      cropperClicked (e) {
        if (this.cropper.type === 'custom') {
          const x = e.offsetX
          const y = e.offsetY
          this.cropper.custom.points.push([x, y])
        }
      },
      switchCropperShape (type) {
        this.cropper.svg.element.clear()
        let points
        switch (type) {
          case 'rectangle':
            this.cropper.rectangle.el = this.cropper.svg.element.rect().attr(CROPPER_PATH_STYLE)
            this.cropper.rectangle.el.size(this.cropper.width, this.cropper.height)
            this.cropper.rectangle.el.move(this.cropper.x, this.cropper.y)
            break
          case 'ellipse':
            this.cropper.ellipse.el = this.cropper.svg.element.ellipse().attr(CROPPER_PATH_STYLE)
            this.cropper.ellipse.el.size(this.cropper.width, this.cropper.height)
            this.cropper.ellipse.el.center(this.cropper.x + this.cropper.width / 2, this.cropper.y + this.cropper.height / 2)
            break
          case 'polygon':
            points = createPolygon(this.cropper.x + this.cropper.width / 2, this.cropper.y + this.cropper.height / 2, this.cropper.polygon.sides, this.cropper.width/2, this.cropper.polygon.startingAngle )
            this.cropper.polygon.el = this.cropper.svg.element.polygon(points).attr(CROPPER_PATH_STYLE)
            this.cropper.polygon.el.size(this.cropper.width, this.cropper.height)
            this.cropper.polygon.el.center(this.cropper.x + this.cropper.width / 2, this.cropper.y + this.cropper.height / 2)
            break
          case 'custom':
            this.cropper.custom.el = this.cropper.svg.element.polygon().attr(CROPPER_PATH_STYLE)
            break
        }
      },
      clearCustomCropper () {
        this.cropper.custom.points = []
        //this.cropper.svg.element.clear()
      },
      moveCropperShape (x, y) {
        this.cropper[this.cropper.type].el.center(x, y)
      },
      resizeCropperShape (width, height) {
        this.cropper[this.cropper.type].el.size(width, height)
      },
      onKeyDown(e) {
        if (e.key === 'Shift') {
          this.moveable.keepRatio = true
        }
      },
      onKeyUp(e) {
        if (e.key === 'Shift') {
          this.moveable.keepRatio = false
        }
      },
      download () {
        downloadSVG(this.$refs.croppedSVG.firstChild)
      },
      resetCropper () {
        this.source.optimized = {}
        this.source.svg = null
        // TODO: reset other parameters here
      },
      positionCropper() {
        this.cropper.x = 0;
        this.cropper.y = -1;
        this.cropper.width = this.source.optimized.width > 200 ? 200 : this.source.optimized.width
        this.cropper.height = this.source.optimized.height > 200 ? 200 : this.source.optimized.height
      },
      onFileChange(e) {
        this.source.loading = true
        this.resetCropper()

        let files = e.target.files || e.dataTransfer.files;
        if (!files.length)
          return;
        this.readImage(files[0]);
      },
      readImage(file) {
        this.cropper.set = false
        const reader = new FileReader();
        // TODO: get the file name here and save it to be used for later (for download)
        reader.onload = async (e) => {
          this.source.optimized = await multipassOptimize(e.target.result)
          // TODO: convert width and height to pixels?
          this.source.svg = stringToInlineSVG(this.source.optimized.text)
          // TODO: loop over the cropper elements and set dimensions to the same as the original
          this.cropper.svg.element.clear().size(this.source.optimized.width, this.source.optimized.height)

          this.positionCropper()
          this.cropper.set = true

          this.switchCropperShape(this.cropper.type)

          this.source.loading = false
        };
        reader.readAsText(file);
      },
      crop() {
        this.cropper.loading = true
        const parser = new DOMParser();
        const sourceElement = parser.parseFromString(this.source.optimized.text, "image/svg+xml");
        const flattenedSource = flattenSVG(sourceElement.documentElement)
        const flattenedCropper = flattenSVG(this.cropper.svg.element.node)

        let croppedPaths = ''

        flattenedSource.forEach((path) => {
          let combinedShape = []
          let newpath = []
          path.points.forEach((shape) => {
            newpath.push({X: shape[0], Y: shape[1]})
          })

          combinedShape.push(newpath)

          let cuttingShape = []
          let cuttingPath = []
          flattenedCropper[0].points.forEach((shape) => {
            cuttingPath.push({X: shape[0], Y: shape[1]})
          })

          cuttingShape.push(cuttingPath)

          const subj_paths = combinedShape;
          const clip_paths = cuttingShape; //[[{"X": 10, "Y": 0}, {"X":200, "Y": 0}, {"X": 200, "Y": 200}, {"X":10, "Y": 200}]];

          const cpr = new ClipperLib.Clipper();

          ClipperLib.JS.ScaleUpPaths(subj_paths, this.cropper.scale);
          ClipperLib.JS.ScaleUpPaths(clip_paths, this.cropper.scale);

          cpr.AddPaths(subj_paths, ClipperLib.PolyType.ptSubject, this.source.closedPath);
          cpr.AddPaths(clip_paths, ClipperLib.PolyType.ptClip, this.cropper.closedPath);

          const solution_polytree = new ClipperLib.PolyTree();
          // TODO: handle errors if clipping is unsuccessful
          cpr.Execute(ClipperLib.ClipType.ctIntersection, solution_polytree, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);
          let solution_paths = ClipperLib.Clipper.PolyTreeToPaths(solution_polytree);
          if (this.cropper.clean) {
            //solution_paths = ClipperLib.Clipper.CleanPolygons(solution_paths, this.cropper.cleanAmount);
            solution_paths = ClipperLib.JS.Clean(solution_paths, this.cropper.cleanAmount * this.cropper.scale);
          }

          if (this.cropper.simplify) {
            solution_paths = ClipperLib.Clipper.SimplifyPolygons(solution_paths);
          }

          if (this.cropper.lighten) {
            solution_paths = ClipperLib.JS.Lighten(solution_paths, this.cropper.lightenAmount * this.cropper.scale);
          }

          if (solution_paths.length) {
            // TODO: preserve original path width and colors?
            croppedPaths += '<path stroke="black" fill="none" stroke-width="1" d="' + pointsToPath(solution_paths, this.cropper.scale, this.source.closedPath) + '"/>'
          }
        })

        this.$refs.croppedSVG.innerHTML = `<svg style="background-color:#FFF" width="${this.source.optimized.width}" height="${this.source.optimized.height}">${croppedPaths}</svg>`
        this.cropper.loading = false
      },
      handleDrag({target, left, top}) {
        target.style.left = `${left}px`;
        target.style.top = `${top}px`;
        this.cropper.x = left;
        this.cropper.y = top;
        // move the shape
        this.moveCropperShape(left + this.cropper.width / 2, top + this.cropper.height / 2)
      },
      handleResize({
                     target, width, height, delta,
                   }) {
        delta[0] && (target.style.width = `${width}px`);
        delta[1] && (target.style.height = `${height}px`);
        this.cropper.width = width;
        this.cropper.height = height;
        // Move and resize the shape accordingly
        this.moveCropperShape(parseInt(target.style.left.replace('px', '')) + width / 2, parseInt(target.style.top.replace('px', '')) + height / 2)
        this.resizeCropperShape(width, height)
      }
    }
  }
</script>

<style scoped>
    .page {
        position: relative;
        height: 100%;
        display: flex;
    }

    .controls {
        width: 100%;
        margin-bottom: 50px;
    }

    .controls-wrapper {
        max-height: 100vh;
        overflow: scroll;
    }

    .button {
        position: absolute;
        bottom: 0;
        width: 100%;
        text-align: center;
    }

    .reveal {
        display: block;
        height: 15px;
        background: linear-gradient(to bottom, rgba(0, 0, 0, 0) 0%, rgb(47, 47, 47) 100%);
    }

    .paper {
        padding: 10px;
        background-color: #dedede;
        position: relative;
        max-height: 100vh;
        width: calc(100% - 300px);
        overflow: scroll;
        z-index: 1;
    }

    .sketch {
        position: relative;
        overflow: hidden;
    }

    .sketch img {
        border: 1px dashed #000;
    }

    #cropper {
        position: absolute;
        top: 0;
        left: 0;
    }

    #croppedSVG {
        padding-top: 10px;
    }

    .sidebar {
        z-index: 10;
        width: 300px;
        position: relative;
    }

    .footer-wrapper {
        z-index: 1000;
        position: absolute;
        bottom: 0;
        right: 0;
        color: #2D2D2D;
    }

    .footer {
        padding: 15px 15px 0 15px;
        text-align: right;
    }

    .moveable-frame {
        font-family: "Roboto", sans-serif;
        position: absolute;
        top: 0;
        left: 0;
        width: 200px;
        height: 200px;
        z-index: 10000;
    }

    @media (max-width: 767px) {
        .page {
            flex-direction: column;
        }

        .controls-wrapper {
            max-height: none;
        }

        .sidebar {
            width: 100%;
        }

        .paper {
            width: 100%;
            max-height: none;
        }

        .footer-wrapper {
            position: relative;
            background-color: #CCC;
        }
    }

    .slide-enter-active,
    .slide-leave-active {
        transition: all 300ms ease-in-out;
    }

    .slide-enter-to,
    .slide-leave {
        max-height: 200px;
        opacity: 1;
        overflow: hidden;
    }

    .slide-enter,
    .slide-leave-to {
        max-height: 0;
        opacity: 0;
        overflow: hidden;
    }
</style>
