<template>
  <div class="page">
    <!-- Sidebar -->
    <div class="sidebar">
      <div class="controls-wrapper">
        <div class="controls">
          <p class="mt-3 lead text-center text-white"> Source </p>
          <button class="btn btn-secondary btn-block">Upload SVG</button>
          <toggle label="Closed Path" v-model="source.closedPath"></toggle>

          <p class="mt-3 lead text-center text-white"> Cropper  </p>
          <button class="btn btn-secondary btn-block">Upload SVG</button>
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
  import {eventBus} from '@/main'
  import Toggle from "@/components/Toggle";
  export default {
    name: 'App',
    components: {
      Toggle
    },
    data() {
      return {
        source: {
          svg: null,
          closedPath: false,
          position: [0, 0]
        },
        cropper: {
          svg: null,
          closedPath: false,
          currentShape: 'square',
          position: [0, 0]
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
    background-color: #dedede;
    position: relative;
    max-height: 100vh;
    width: calc(100% - 300px);
    overflow: scroll;
    z-index: 1;
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
