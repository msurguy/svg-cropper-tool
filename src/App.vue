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

                    <div v-if="source.svg">
                        <toggle label="Closed Path" v-model="source.closedPath"></toggle>
                        <p class="mt-3 lead text-center text-white"> Cropper </p>
                        <toggle label="Clean Path" v-model="cropper.clean"></toggle>
                        <slider v-if="cropper.clean" :min="0.1" :max="2" :step="0.1" label="Clean Amount"
                                v-model.number="cropper.cleanAmount"></slider>
                        <toggle label="Lighten Path" v-model="cropper.lighten"></toggle>
                        <slider v-if="cropper.lighten" :min="0.1" :max="2" :step="0.1" label="Lighten Amount"
                                v-model.number="cropper.lightenAmount"></slider>
                        <toggle label="Simplify Path" v-model="cropper.simplify"></toggle>
                        <select-field label="Cropper type" v-model="cropper.type"
                                      :options="cropper.options"></select-field>
                        <toggle v-if="cropper.type === 'file' || cropper.type === 'custom'" label="Closed Path"
                                v-model="cropper.closedPath"></toggle>
                        <slider :min="30" :max="1000" label="Quality" v-model.number="cropper.scale"></slider>
                        <button @click="crop" class="btn btn-block btn-secondary">Crop</button>

                    </div>

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
                <div ref="cropper" id="cropper"></div>
                <Moveable v-if="cropper.set"
                          class="moveable"
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
  import {downloadSVG, pointsToPath, stringToInlineSVG} from "@/lib/utils";
  import Moveable from 'vue-moveable';
  import * as SVG from 'svg.js'
  import * as ClipperLib from 'clipper-lib'
  import {flattenSVG} from 'flatten-svg';
  import {multipassOptimize} from '@/lib/optimizer'

  export default {
    name: 'App',
    components: {
      Toggle,
      SelectField,
      Slider,
      Moveable
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
          set: false,
          scale: 100,
          x: 0,
          y: 0,
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
            {text: 'Circle / Ellipse', value: 'circle'},
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
            sides: 5,
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
      onFileChange(e) {
        this.source.optimized = {}
        this.source.svg = null

        let files = e.target.files || e.dataTransfer.files;
        if (!files.length)
          return;
        this.readImage(files[0]);
      },
      readImage(file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          this.source.optimized = await multipassOptimize(e.target.result)
          // TODO: convert width and height to pixels?
          this.source.svg = stringToInlineSVG(this.source.optimized.text)
          // TODO: loop over the cropper elements and set dimensions to the same as the original
          this.cropper.svg.element.clear().size(this.source.optimized.width, this.source.optimized.height)
          this.cropper.rectangle.el = this.cropper.svg.element.rect().attr({
            fill: 'none',
            stroke: '#f06',
            'stroke-width': '3px'
          })
          this.cropper.rectangle.el.move(0, -1)
          this.cropper.rectangle.el.size(200, 200)

          this.cropper.set = true
        };
        reader.readAsText(file);
      },
      crop() {
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
          croppedPaths += '<path stroke="black" fill="none" stroke-width="1" d="' + pointsToPath(solution_paths, this.cropper.scale, this.source.closedPath) + '"/>'
        })

        let svg = `<svg style="background-color:#FFF" width="${this.source.optimized.width}" height="${this.source.optimized.height}">`;
        svg += croppedPaths;
        svg += '</svg>';
        this.$refs.croppedSVG.innerHTML = svg;
      },
      handleDrag({target, left, top}) {
        target.style.left = `${left}px`;
        target.style.top = `${top}px`;
        this.cropper.x = left;
        this.cropper.y = top;
        this.cropper.rectangle.el.move(left, top)
      },
      handleResize({
                     target, width, height, delta,
                   }) {
        delta[0] && (target.style.width = `${width}px`);
        delta[1] && (target.style.height = `${height}px`);
        this.cropper.width = width;
        this.cropper.height = height;
        this.cropper.rectangle.el.move(parseInt(target.style.left.replace('px', '')), parseInt(target.style.top.replace('px', '')))
        this.cropper.rectangle.el.size(width, height)
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

    .moveable {
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
