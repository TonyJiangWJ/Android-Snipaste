/*
 * @Author: TonyJiangWJ
 * @Date: 2020-05-11 18:28:23
 * @Last Modified by: TonyJiangWJ
 * @Last Modified time: 2023-08-01 16:27:27
 * @Description: 图片资源监听并自动回收
 */
importClass(java.util.concurrent.ScheduledThreadPoolExecutor)
importClass(java.util.concurrent.TimeUnit)

function isNullOrUndefined (val) {
  return val === null || typeof val === 'undefined'
}

module.exports = function (__runtime__, scope) {
  if (typeof scope.resourceMonitor === 'undefined' || scope.resourceMonitor === null) {
    let _o_images = require('__images__.js')(__runtime__, scope)
    debugInfo(['Is _origin_images null? {}.', isNullOrUndefined(_o_images)])
    let availMem = device.getAvailMem()
    debugInfo(['当前可用内存：{}b {}MB', availMem, (availMem / (1024 * 1024))])
    let imgSize = device.width * device.height * 10 / 8 / 1024 / 1024 / 2
    debugInfo(['预估单张图片大小：{}MB', imgSize])
    availMem = availMem > (imgSize * 100 * 1024 * 1024) ? (imgSize * 100 * 1024 * 1024) : availMem
    let maximumStore = availMem / (imgSize * 1024 * 1024)
    let halfStore = Math.ceil(maximumStore / 2)
    debugInfo(['支持最大图片张数：{} 一半：{}', maximumStore, halfStore])
    let scheduledExecutor = new ScheduledThreadPoolExecutor(1)
    function ResourceMonitor () {
      this.images = []
      // 需要长时间持有的图片，不会自动动态释放
      this.longHoldImages = []
      this.writeLock = threads.lock()
      this.init()
    }

    ResourceMonitor.prototype.releaseAll = function (undelegated) {
      if (this.images !== null) {
        debugInfo('释放图片，总数：' + (this.images.length + this.longHoldImages.length))
        this.writeLock.lock()
        try {
          this.recycleImages(this.images.splice(0), true)
          this.recycleImages(this.longHoldImages.splice(0), true)
          if (undelegated) {
            debugInfo('解除图像资源代理')
            this.images = null
            scope.images = _o_images
            scope.__asGlobal__(_o_images, ['captureScreen'])
            _o_images = null
          }
        } finally {
          this.writeLock.unlock()
        }
      }
    }

    ResourceMonitor.prototype.addLongHoldImage = function (img) {
      this.writeLock.lock()
      try {
        if (this.longHoldImages === null) {
          // this is only happen when engine stoped, just recycle img
          debugInfo('检测到脚本已停止，直接回收图片')
          img.recycle()
          return
        }
        this.longHoldImages.push({
          img: img,
          millis: new Date().getTime()
        })
        //debugInfo('增加图片到长时间持有的监听列表，需要手动recycle，当前总数：' + this.longHoldImages.length)
      } finally {
        this.writeLock.unlock()
      }
    }

    ResourceMonitor.prototype.addImageToList = function (img) {
      //debugInfo('准备获取图片资源锁')
      this.writeLock.lock()
      //debugInfo('获取图片资源锁成功')
      try {
        if (this.images === null) {
          // this is only happen when engine stoped, just recycle img
          debugInfo('检测到脚本已停止，直接回收图片')
          img.recycle()
          return
        }
        this.images.push({
          img: img,
          millis: new Date().getTime()
        })
        //debugInfo('增加图片到监听列表，当前总数：' + this.images.length)
        // 达到一定阈值后回收
        if (this.images.length > halfStore) {
          if (this.images.length > maximumStore) {
            // 大于100张直接回收一半 基本不会触发 除非卡死循环了
            this.recycleImages(this.images.splice(0, halfStore))
          } else {
            let current = new Date().getTime()
            // 回收超过5秒钟的图片
            let forRecycle = this.images.filter(imageInfo => current - imageInfo.millis > 5000)
            this.recycleImages(forRecycle)
            this.images.splice(0, forRecycle.length)
          }
        }
      } finally {
        this.writeLock.unlock()
      }
    }

    /**
     * 
     * @param {ImageWrapper} img 
     * @param {number} delay 
     */
    ResourceMonitor.prototype.delayRecycle = function (img, delay) {
      delay = delay || 5
      scheduledExecutor.schedule(new java.lang.Runnable({
        run: function () {
          //debugInfo(['延迟回收图片 延迟时间：{}s', delay])
          img && img.recycle()
        }
      }), new java.lang.Long(delay), TimeUnit.SECONDS)
    }

    function doRecycleImages (forRecycleList, desc) {
      let start = new Date().getTime()
      let count = 0
      forRecycleList.forEach(imageInfo => {
        try {
          let imgBitmap = imageInfo.img.getBitmap()
          if (imgBitmap && !imgBitmap.isRecycled()) {
            imageInfo.img.recycle()
          } else {
            //debugInfo('图片已回收，不再回收')
            count++
          }
        } catch (e) {
          // console.warn('释放图片异常' + e)
          count++
        }
      })
      debugInfo(['{}，总数：{}，耗时：{}ms {}', desc, forRecycleList.length, (new Date().getTime() - start), (count > 0 ? ', 其中有：' + count + '自动释放了' : '')])
      forRecycleList = null
    }

    ResourceMonitor.prototype.recycleImages = function (forRecycleList, sync) {
      if (forRecycleList && forRecycleList.length > 0) {
        if (sync) {
          doRecycleImages(forRecycleList, '同步释放所有图片')
        } else {
          threads.start(function () {
            // 不太安全，可能没释放完就挂了 脚本结束时最好执行一下releaseAll
            doRecycleImages(forRecycleList, '异步释放图片')
          })
        }
      }
    }

    ResourceMonitor.prototype.init = function () {

      let that = this

      let M_Images = function () {
        _o_images.constructor.call(this)
      }
      M_Images.prototype = Object.create(_o_images.prototype)
      M_Images.prototype.constructor = M_Images

      M_Images.prototype.captureScreen = function () {
        let start = new Date().getTime()
        //debugInfo('准备获取截图')
        let img = _o_images.captureScreen()
        //debugInfo(['获取截图完成，耗时{}ms', (new Date().getTime() - start)])
        // captureScreen的不需要回收
        // that.addImageToList(img)
        return img
      }

      /**
       * @param long_hold {boolean} 是否长期持有，不会被自动recycle，需要在代码中手动释放资源
       */
      M_Images.prototype.copy = function (origialImg, long_hold) {
        let newImg = _o_images.copy(origialImg)
        if (!long_hold) {
          that.addImageToList(newImg)
        } else {
          that.addLongHoldImage(newImg)
        }
        return newImg
      }

      M_Images.prototype.read = function (path) {
        let newImg = _o_images.read(path)
        that.addImageToList(newImg)
        return newImg
      }

      M_Images.prototype.load = function (path) {
        let newImg = _o_images.load(path)
        that.addImageToList(newImg)
        return newImg
      }

      M_Images.prototype.clip = function (img, x, y, w, h) {
        let newImg = _o_images.clip(img, x, y, w, h)
        that.addImageToList(newImg)
        return newImg
      }

      M_Images.prototype.interval = function (img, color, threshold) {
        let intervalImg = _o_images.interval(img, color, threshold)
        that.addImageToList(intervalImg)
        return intervalImg
      }

      M_Images.prototype.grayscale = function (img) {
        let grayImg = _o_images.grayscale(img)
        that.addImageToList(grayImg)
        return grayImg
      }

      M_Images.prototype.threshold = function (img, threshold, maxVal, type) {
        let nImg = _o_images.threshold(img, threshold, maxVal, type)
        that.addImageToList(nImg)
        return nImg
      }

      M_Images.prototype.inRange = function (img, lowerBound, upperBound) {
        let nImg = _o_images.inRange(img, lowerBound, upperBound)
        that.addImageToList(nImg)
        return nImg
      }

      M_Images.prototype.adaptiveThreshold = function (img, maxValue, adaptiveMethod, thresholdType, blockSize, C) {
        let nImg = _o_images.adaptiveThreshold(img, maxValue, adaptiveMethod, thresholdType, blockSize, C)
        that.addImageToList(nImg)
        return nImg
      }

      M_Images.prototype.blur = function (img, size, point, type) {
        let nImg = _o_images.blur(img, size, point, type)
        that.addImageToList(nImg)
        return nImg
      }

      M_Images.prototype.medianBlur = function (img, size) {
        let nImg = _o_images.medianBlur(img, size)
        that.addImageToList(nImg)
        return nImg
      }


      M_Images.prototype.gaussianBlur = function (img, size, sigmaX, sigmaY, type) {
        let nImg = _o_images.gaussianBlur(img, size, sigmaX, sigmaY, type)
        that.addImageToList(nImg)
        return nImg
      }

      M_Images.prototype.cvtColor = function (img, code, dstCn) {
        let nImg = _o_images.cvtColor(img, code, dstCn)
        that.addImageToList(nImg)
        return nImg
      }

      M_Images.prototype.resize = function (img, size, interpolation) {
        let nImg = _o_images.resize(img, size, interpolation)
        that.addImageToList(nImg)
        return nImg
      }

      M_Images.prototype.scale = function (img, fx, fy, interpolation) {
        let nImg = _o_images.scale(img, fx, fy, interpolation)
        that.addImageToList(nImg)
        return nImg
      }

      M_Images.prototype.rotate = function (img, degree, x, y) {
        let nImg = _o_images.rotate(img, degree, x, y)
        that.addImageToList(nImg)
        return nImg
      }

      M_Images.prototype.concat = function (img1, img2, direction) {
        let nImg = _o_images.concat(img1, img2, direction)
        that.addImageToList(nImg)
        return nImg
      }


      M_Images.prototype.fromBase64 = function (base64) {
        let nImg = _o_images.fromBase64(base64)
        that.addImageToList(nImg)
        return nImg
      }

      M_Images.prototype.fromBytes = function (bytes) {
        let nImg = _o_images.fromBytes(bytes)
        that.addImageToList(nImg)
        return nImg
      }


      M_Images.prototype.matToImage = function (img) {
        let nImg = _o_images.matToImage(img)
        that.addImageToList(nImg)
        return nImg
      }

      M_Images.prototype.isDelegated = function () {
        return true
      }

      M_Images.prototype.isValidImg = function (img) {
        try {
          img.ensureNotRecycled()
          return true
        } catch (e) {
          return false
        }
      }
      let mImages = new M_Images()

      let newImages = {}
      let imageFuncs = Object.getOwnPropertyNames(scope.images)
      let newFuncs = Object.getOwnPropertyNames(M_Images.prototype)



      for (let idx in imageFuncs) {
        let func_name = imageFuncs[idx]
        newImages[func_name] = scope.images[func_name]
      }

      for (let idx in newFuncs) {
        let func_name = newFuncs[idx]
        if (func_name !== 'constructor' && func_name !== 'init') {
          // debugInfo('override function: ' + func_name)
          newImages[func_name] = mImages[func_name]
        }
      }
      debugInfo('图片资源代理创建完毕，准备替换scope中的images')
      scope.images = newImages
      scope.__asGlobal__(mImages, ['captureScreen'])
      debugInfo('图片资源代理替换images完毕')
    }

    let resourceMonitor = new ResourceMonitor()

    events.on('exit', function () {
      console.info('脚本执行结束, 释放图片资源')
      resourceMonitor.releaseAll(true)
    })

    scope.resourceMonitor = resourceMonitor


  }

  function debugInfo (content) {
    if (scope.showDebugLog) {
      console.verbose(convertObjectContent(content))
    }
  }
  return scope.resourceMonitor
}


/**
 * 格式化输入参数 eg. `['args: {} {} {}', 'arg1', 'arg2', 'arg3']` => `'args: arg1 arg2 arg3'`
 * @param {array} originContent 输入参数
 */
function convertObjectContent (originContent) {
  if (typeof originContent === 'string') {
    return originContent
  } else if (Array.isArray(originContent)) {
    let marker = originContent[0]
    let args = originContent.slice(1)
    if (Array.isArray(args) && args.length > 0) {
      args = args.map(r => {
        if (typeof r === 'function') {
          return r()
        } else {
          return r
        }
      })
    }
    let regex = /(\{\})/g
    let matchResult = marker.match(regex)
    if (matchResult && args && matchResult.length > 0 && matchResult.length === args.length) {
      args.forEach((item, idx) => {
        marker = marker.replace('{}', item)
      })
      return marker
    } else if (matchResult === null) {
      return marker
    }
  }
  console.error(ENGINE_ID + ' 参数不匹配[' + JSON.stringify(originContent) + ']')
  return originContent
}