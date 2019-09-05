import actions from './svgo'

const iterationCallback = async function () {}

export async function multipassOptimize(svg) {
  await actions.load({data: svg})
  let fileResult = await actions.process()
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
}
