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

          <toggle label="Closed Path" v-model="source.closedPath"></toggle>
          <p class="mt-3 lead text-center text-white"> Cropper  </p>
          <select-field label="Cropper type" v-model="cropper.type"
                        :options="cropper.options"></select-field>

          <toggle label="Closed Path" v-model="cropper.closedPath"></toggle>
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
        <img :src="source.svg" alt="">
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

  export default {
    name: 'App',
    components: {
      Toggle,
      SelectField
    },
    mounted () {
      bsCustomFileInput.init()
    },
    data () {
      return {
        source: {
          svg: null,
          optimized: null,
          closedPath: false,
          position: [0, 0]
        },
        cropper: {
          position: [0, 0],
          closedPath: false,
          type: 'square',
          options: [
            {text: 'Square', value: 'square'},
            {text: 'Rectangle', value: 'rectangle'},
            {text: 'Circle', value: 'circle'},
            {text: 'Polygon', value: 'polygon'},
            {text: 'Custom Shape', value: 'custom'},
            {text: 'SVG', value: 'svg'}
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
            file: null
          }
        },
        cropperOptions: {
          square: [0,0],
          circle: [0,3,4,5]
        }
      }
    },
    methods: {
      download() {
        eventBus.$emit('download')
      },
      onFileChange(e) {
        let files = e.target.files || e.dataTransfer.files;
        if (!files.length)
          return;
        this.createImage(files[0]);
      },
      async multipass (svg) {
        await actions.load({data: svg})
        let fileResult = await actions.process()
        const iterationCallback = async function(){}

        let resultFile = {text: fileResult.data, width: fileResult.dimensions.width, height: fileResult.dimensions.height}
        // eslint-disable-next-line no-cond-assign
        while (resultFile = await actions.nextPass()) {
          await iterationCallback(resultFile);
        }
        // let result = await actions.nextPass()
        // result = await actions.nextPass()
        // result = await actions.nextPass()
        console.log(resultFile)
      },
      createImage(file) {
        const reader = new FileReader();
        const vm = this;

        reader.onload = (e) => {
          vm.source.svg = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(e.target.result)
          this.multipass(e.target.result)
        };
        reader.readAsText(file);
      },
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

  .sketch img{
    border: 1px dashed #000;
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
