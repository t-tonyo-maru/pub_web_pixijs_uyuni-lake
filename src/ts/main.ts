import 'pixi-spine'

import * as PIXI from 'pixi.js'
import { Spine } from 'pixi-spine'
import { ReflectionFilter } from '@pixi/filter-reflection'
import GUI from 'lil-gui'

const assetsUrl =
  process.env.NODE_ENV === 'production'
    ? '/pub_web_pixijs_uyuni-lake/assets'
    : '/assets'

// Links
// - https://www.npmjs.com/package/@pixi/filter-reflection
// - https://filters.pixijs.download/main/demo/index.html?enabled=ReflectionFilter
// - https://filters.pixijs.download/main/docs/index.html
// - https://lil-gui.georgealways.com/#Guide#Folders

window.onload = async () => {
  const pixelRatio = window.devicePixelRatio || 1
  const app = new PIXI.Application({
    antialias: true,
    autoDensity: true,
    background: '#000',
    resizeTo: window,
    resolution: pixelRatio / 1
  })
  const pixiWrapper = document.querySelector('.pixi') as HTMLElement
  pixiWrapper.appendChild(app.view as HTMLCanvasElement)

  let width = window.innerWidth
  let height = window.innerHeight
  let windowAspectRatio = width / height

  // sample texsture and image
  // https://pixijs.com/guides/migrations/v7?_highlight=loader#-replaces-loader-with-assets

  const characterTexsture = await PIXI.Assets.load(
    `${assetsUrl}/images/character.png`
  )
  const backgroundTexsture = await PIXI.Assets.load(
    `${assetsUrl}/images/sky_background.jpg`
  )
  const backgroundImage = PIXI.Sprite.from(backgroundTexsture)
  backgroundImage.anchor.set(0.5, 1)
  backgroundImage.position.set(window.innerWidth / 2, window.innerHeight)
  backgroundImage.scale.set(
    windowAspectRatio >= 1 ? windowAspectRatio : 1 / windowAspectRatio
  )

  const container = new PIXI.Container()
  container.addChild(backgroundImage as PIXI.DisplayObject)

  // filter
  const ReflectionParameter = {
    mirror: true,
    boundary: 0.8,
    amplitude: [0, 20],
    waveLength: [30, 100],
    alpha: [1, 1]
    // time: 1
  }
  const reflectionFilter = new ReflectionFilter(ReflectionParameter)
  container.filters = [reflectionFilter]

  const spineAnimation = await PIXI.Assets.load(`${assetsUrl}/spine-data/model.json`)
    .then((resource) => {
      const animation = new Spine(resource.spineData)

      animation.x = app.screen.width / 2
      animation.y = app.screen.height
      animation.scale.set(1)

      animation.state.setAnimation(0, 'idle', true)

      container.addChild(animation as PIXI.DisplayObject)

      return animation
    })
    .catch((err) => {
      console.log(err)
    })

  // lil-gui
  // https://lil-gui.georgealways.com/
  const gui = new GUI()
  const guiObject = {
    enable: true,
    mirror: ReflectionParameter.mirror,
    boundary: ReflectionParameter.boundary,
    ['amplitude.start']: 0,
    ['amplitude.end']: 20,
    ['waveLength.start']: 30,
    ['waveLength.end']: 100,
    ['alpha.start']: 0.2,
    ['alpha.end']: 1,
    spine: {
      enable: true,
      laughAlpha: 0
    },
    background: {
      isShowBackground: true
    }
  }
  // reflection paramter
  const generalFolder = gui.addFolder('Reflection General')
  generalFolder.add(guiObject, 'enable')
  const parameterFolder = gui.addFolder('Reflection Main Parameter')
  parameterFolder.add(guiObject, 'mirror')
  parameterFolder.add(guiObject, 'boundary', 0, 1, 0.01)
  parameterFolder.add(guiObject, 'amplitude.start', 0, 50, 0.1)
  parameterFolder.add(guiObject, 'amplitude.end', 0, 50, 0.1)
  parameterFolder.add(guiObject, 'amplitude.start', 10, 200, 1)
  parameterFolder.add(guiObject, 'amplitude.end', 10, 200, 1)
  parameterFolder.add(guiObject, 'alpha.start', 0, 1, 0.01)
  parameterFolder.add(guiObject, 'alpha.end', 0, 1, 0.01)
  // spine paramter
  const spineFolder = gui.addFolder('Spine Animatoin Parameter')
  spineFolder.add(guiObject.spine, 'enable')

  const backgroundRect = new PIXI.Graphics()
  backgroundRect.beginFill(0x0091e6)
  backgroundRect.drawRect(0, 0, window.innerWidth, window.innerHeight)
  app.stage.addChild(backgroundRect as PIXI.DisplayObject)

  app.stage.addChild(container as PIXI.DisplayObject)

  app.ticker.add((delta) => {
    // spine animation
    if (spineAnimation) {
      // idle animation
      if (!guiObject.spine.enable) {
        spineAnimation.state.timeScale = 0
      } else {
        if (spineAnimation.state.timeScale !== 1) {
          spineAnimation.state.timeScale = 1
        }
      }
    }

    // background image
    if (guiObject.background.isShowBackground) {
      if (backgroundImage.alpha !== 1) {
        backgroundImage.alpha = 1
      }
    } else {
      if (backgroundImage.alpha !== 0) {
        backgroundImage.alpha = 0
      }
    }

    // reflection filter enable switch
    if (!guiObject.enable) {
      reflectionFilter.boundary = 1
      return
    }

    // reflection filter parameter custom
    reflectionFilter.boundary = guiObject.boundary
    reflectionFilter.mirror = guiObject.mirror
    reflectionFilter.amplitude = [
      guiObject['amplitude.start'],
      guiObject['amplitude.end']
    ]
    reflectionFilter.waveLength = [
      guiObject['waveLength.start'],
      guiObject['waveLength.end']
    ]
    reflectionFilter.alpha = [guiObject['alpha.start'], guiObject['alpha.end']]
    reflectionFilter.time += 0.04
    if (reflectionFilter.time >= 0.04 * 100000) {
      reflectionFilter.time = 0
    }
  })

  // resize
  let timer = 0
  window.addEventListener('resize', () => {
    if (timer > 0) {
      clearTimeout(timer)
    }
    timer = window.setTimeout(() => {
      const width = window.innerWidth
      const height = window.innerHeight

      windowAspectRatio = height / width
      backgroundImage.position.set(width / 2, height)
      backgroundImage.scale.set(
        windowAspectRatio >= 1 ? windowAspectRatio : 1 / windowAspectRatio
      )
      backgroundRect.width = width
      backgroundRect.height = height
    }, 500)
  })
}
