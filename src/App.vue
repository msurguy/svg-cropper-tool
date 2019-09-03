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
                    <select-field label="Cropper type" v-model="cropper.type"
                                  :options="cropper.options"></select-field>

                    <toggle v-if="cropper.type === 'file' || cropper.type === 'custom'" label="Closed Path" v-model="cropper.closedPath"></toggle>
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
            <div class="sketch">
                <div ref="cropper" id="cropper"></div>
                <Moveable
                        class="moveable"
                        v-bind="moveable"
                        @drag="handleDrag"
                        @resize="handleResize"
                        @rotate="handleRotate"
                >
                </Moveable>
                <img v-if="source.svg" :src="source.svg" alt="Source SVG File Preview">
            </div>
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

  import {eventBus} from '@/main'
  import Toggle from "@/components/Toggle";
  import SelectField from "@/components/SelectField";
  import actions from '@/svgo'
  import * as SVG from 'svg.js'
  import Moveable from 'vue-moveable';

  export default {
    name: 'App',
    components: {
      Toggle,
      SelectField,
      Moveable
    },
    mounted() {
      bsCustomFileInput.init()
      const cropperEl = document.getElementById('cropper')
      this.cropper.svg.element = SVG(cropperEl)
      // draw.rect(100, 100).move(100, 50).fill('#f06')
      // let draw = SVG(canvas).size(150, 200)
    },
    data() {
      return {
        moveable: {
          draggable: true,
          throttleDrag: 0,
          resizable: true,
          throttleResize: 1,
          keepRatio: false,
          scalable: false,
          throttleScale: 0,
          rotatable: true,
          throttleRotate: 0,
          pinchable: false // ["draggable", "resizable", "scalable", "rotatable"]
        },
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
          x: 0,
          y: 0,
          width: 200,
          height: 200,
          closedPath: false,
          type: 'square',
          options: [
            {text: 'Square', value: 'square'},
            {text: 'Rectangle', value: 'rectangle'},
            {text: 'Circle', value: 'circle'},
            {text: 'Polygon', value: 'polygon'},
            {text: 'Custom Shape', value: 'custom'},
            {text: 'SVG File', value: 'file'}
          ],
          square: {
            size: [200, 200],
          },
          rectangle: {
            size: [100, 200],
          },
          circle: {
            size: [200],
          },
          polygon: {
            size: [200],
            sides: 5,
          },
          custom: {
            points: []
          },
          svg: {
            element: null,
            text: '',
            file: null,
            width: 0,
            height: 0
          }
        },
        cropperOptions: {
          square: [0, 0],
          circle: [0, 3, 4, 5]
        },
        result: {
          svg: ''
        }
      }
    },
    methods: {
      download() {
        eventBus.$emit('download')
      },
      onFileChange(e) {
        // this.cropper.svg.width =
        this.source.optimized = {}
        this.source.svg = null

        let files = e.target.files || e.dataTransfer.files;
        if (!files.length)
          return;
        this.createImage(files[0]);
      },
      async multipass(svg) {
        await actions.load({data: svg})
        let fileResult = await actions.process()
        const iterationCallback = async function () {}

        this.cropper.svg.width = fileResult.dimensions.width
        this.cropper.svg.height= fileResult.dimensions.height

        let resultFile = {
          text: fileResult.data,
          width: fileResult.dimensions.width,
          height: fileResult.dimensions.height
        }
        // eslint-disable-next-line no-cond-assign
        while (fileResult = await actions.nextPass()) {
          resultFile = {text: fileResult.data, width: fileResult.dimensions.width, height: fileResult.dimensions.height}
          await iterationCallback(resultFile);
        }
        return resultFile;
      },
      stringToImage (string) {
        return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(string)
      },
      createImage(file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          this.source.optimized = await this.multipass(e.target.result)
          this.source.svg = this.stringToImage(this.source.optimized.text)
          this.cropper.svg.element.clear().size(this.source.optimized.width, this.source.optimized.height)
        };
        reader.readAsText(file);
      },
      crop () {

      },
      handleDrag({target, left, top }) {
        console.log('onDrag left, top', left, top)
        target.style.left = `${left}px`;
        target.style.top = `${top}px`;
        this.cropper.x = left;
        this.cropper.y = top;
      },
      handleResize({
                     target, width, height, delta,
                   }) {
        console.log('onResize', width, height);
        delta[0] && (target.style.width = `${width}px`);
        delta[1] && (target.style.height = `${height}px`);
        this.cropper.width = width;
        this.cropper.height = height;
      },
      handleRotate({ target, dist, transform}) {
        console.log('onRotate', dist);
        target.style.transform = transform;
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
