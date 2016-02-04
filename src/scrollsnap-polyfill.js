(function(w, doc, undefined) {
  // Enable strict mode
  'use strict';

  /*
   * alias
   * w: window global object
   * doc: document
   * undefined: undefined
   */

    /**
     * constraint to jumping to the next snap-point.
     * when scrolling further than SNAP_CONSTRAINT snap-points,
     * but the current distance is less than 1-0.18 (read: 18 percent),
     * the snap-will go back to the closer snap-point.
     */
  var CONSTRAINT = 1-0.18,
      /*
       * if scrolling for one snap-point only,
       * the scroll distance must be at least 5% of the scroll-width.
       */
      FIRST_CONSTRAINT = 1-0.05,

      /*
       * minimum scroll distance in pixel
       */
      MIN_PX_CONSTRAINT = 5,

      /**
       * when scrolling for more than SNAP_CONSTRAINT snap points,
       * a constraint is applied for scrolling to snap points in the distance.
       * @type {Number}
       */
      SNAP_CONSTRAINT = 2,

      /**
       * time in ms after which scrolling is considered finished.
       * the scroll timeouts are timed with this.
       * whenever a new scroll event is triggered, the previous timeout is deleted.
       * @type {Number}
       */
      SCROLL_TIMEOUT = 45,

      /**
       * time for the smooth scrolling
       * @type {Number}
       */
      SCROLL_TIME = 768;

  /**
   * Feature detect scroll-snap-type, if it exists then do nothing (return)
   */
  if ('scrollSnapType' in doc.documentElement.style ||
      'webkitScrollSnapType' in doc.documentElement.style ||
      'msScrollSnapType' in doc.documentElement.style) {
    // just return void to stop executing the polyfill.
    return;
  }

  /**
   * doMatched is a callback for Polyfill to fill in the desired behaviour.
   * @param  {array} rules rules found for the polyfill
   */
  function doMatched(rules) {
    // iterate over rules
    rules.each(function(rule) {

      var elements = doc.querySelectorAll(rule.getSelectors()),
          declaration = rule.getDeclaration();

      // iterate over elements
      [].forEach.call(elements, function(obj) {
        // set up the behaviour
        setUpElement(obj, declaration);
      });
    });
  }

  /**
   * unDomatched is a callback for polyfill to undo any polyfilled behaviour
   * @param  {Object} rules
   */
  function undoUnmatched(rules) {
    // iterate over rules
    rules.each(function(rule) {
      var elements = doc.querySelectorAll(rule.getSelectors());

      // iterate over elements
      [].forEach.call(elements, function(item) {
        // tear down the behaviour
        tearDownElement(item);
      });
    });
  }

  /**
   * set up an element for scroll-snap behaviour
   * @param {Object} obj         HTML element
   * @param {Object} declaration CSS declarations
   */
  function setUpElement(obj, declaration) {
    // if this is a scroll-snap element in a scroll snap container, attach to the container only.
    if (typeof declaration['scroll-snap-coordinate'] !== 'undefined') {
      // save declaration
      obj.snapLengthUnit = parseSnapCoordValue(declaration);

      return attachToScrollParent(obj);
    }

    // if the scroll snap attributes are applied on the body/html tag, use the doc for scroll events.
    var tag = obj.tagName;
    if (tag.toLowerCase() == "body" ||
        tag.toLowerCase() == "html") {
      obj = doc;
    }

    // add the event listener
    obj.addEventListener('scroll', handler, false);

    // save declaration
    if (typeof declaration['scroll-snap-destination'] !== 'undefined') {
      obj.snapLengthUnit = parseSnapCoordValue(declaration);
    } else {
      obj.snapLengthUnit = parseSnapPointValue(declaration);
    }

    // init possible elements
    obj.snapElements = [];
  }

  /**
   * tear down an element. remove all added behaviour.
   * @param  {Object} obj DomElement
   */
  function tearDownElement(obj) {
    // if the scroll snap attributes are applied on the body/html tag, use the doc for scroll events.
    var tag = obj.tagName;

    if (tag.toLowerCase() == "body" ||
        tag.toLowerCase() == "html") {
      obj = doc;
    }

    obj.removeEventListener('scroll', handler, false);

    obj.snapLengthUnit = null;
    obj.snapElements = [];
  }

  /**
   * attach a child-element onto a scroll-container
   * @param  {Object} obj
   */
  function attachToScrollParent(obj) {
    var attach = obj;
    // iterate over parent elements
    for ( ; obj && obj !== document; obj = obj.parentNode ) {
      if (typeof obj.snapElements !== 'undefined') {
        obj.snapElements.push(attach);
      }
    }
  }

  /**
   * the last created timeOutId for scroll event timeouts.
   * @type int
   */
  var timeOutId = null;

  /**
   * starting point for current scroll
   * @type length
   */
  var scrollStart = null;

  /**
   * the last object receiving a scroll event
   */
  var lastObj, lastScrollObj;

  /**
   * scroll handler
   * this is the callback for scroll events.
   */
  var handler = function(evt) {

    // use evt.target as target-element
    lastObj = evt.target;
    lastScrollObj = getScrollObj(lastObj);

    // if currently animating, stop it. this prevents flickering.
    if (animationFrame) {
      // cross browser
      if (!cancelAnimationFrame(animationFrame)) {
        clearTimeout(animationFrame);
      }
    }

    // if a previous timeout exists, clear it.
    if (timeOutId) {
      // we only want to call a timeout once after scrolling..
      clearTimeout(timeOutId);
    } else {
      // save new scroll start
      scrollStart = {y: lastScrollObj.scrollTop,
                     x: lastScrollObj.scrollLeft};
    }

    /* set a timeout for every scroll event.
     * if we have new scroll events in that time, the previous timeouts are cleared.
     * thus we can be sure that the timeout will be called 50ms after the last scroll event.
     * this means a huge improvement in speed, as we just assign a timeout in the scroll event, which will be called only once (after scrolling is finished)
     */
    timeOutId = setTimeout(handlerDelayed, SCROLL_TIMEOUT);
  };

  /**
   * a delayed handler for scrolling.
   * this will be called by setTimeout once, after scrolling is finished.
   */
  var handlerDelayed = function() {
    // if we don't move a thing, we can ignore the timeout: if we did, there'd be another timeout added for scrollStart+1.
    if(scrollStart.y == lastScrollObj.scrollTop && scrollStart.x == lastScrollObj.scrollLeft) {
      // ignore timeout
      return;
    }

    // detect direction of scroll. negative is up, positive is down.
    var direction = {y: (scrollStart.y - lastScrollObj.scrollTop > 0) ? -1 : 1,
                     x: (scrollStart.x - lastScrollObj.scrollLeft > 0) ? -1 : 1},
        snapPoint;

    if (typeof lastScrollObj.snapElements !== 'undefined' && lastScrollObj.snapElements.length > 0) {
      snapPoint = getNextElementSnapPoint(lastScrollObj, lastObj, direction);
    } else {
      // get the next snap-point to snap-to
      snapPoint = getNextSnapPoint(lastScrollObj, lastObj, direction);
    }

    // before doing the move, unbind the event handler (otherwise it calls itself kinda)
    lastObj.removeEventListener('scroll', handler, false);

    // smoothly move to the snap point
    smoothScroll(lastScrollObj, snapPoint, function() {
      // after moving to the snap point, rebind the scroll event handler
      lastObj.addEventListener('scroll', handler, false);
    });

    // we just jumped to the snapPoint, so this will be our next scrollStart
    if (!isNaN(snapPoint.x || !isNaN(snapPoint.y))) {
      scrollStart = snapPoint;
    }
  };

  /**
   * calculator for next snap-point
   * @param  {Object} obj       HTML element
   * @param  {integer} direction signed integer indicating the scroll direction
   * @return {Object}
   */
  function getNextSnapPoint(scrollObj, obj, direction) {
    // get snap length
    var snapLength = {y: getYSnapLength(obj, obj.snapLengthUnit.y),
                      x: getXSnapLength(obj, obj.snapLengthUnit.x)},
        top = scrollObj.scrollTop,
        left = scrollObj.scrollLeft;

    // calc current and initial snappoint
    var currentPoint = {y: top / snapLength.y,
                        x: left / snapLength.x},
        initialPoint = {y: scrollStart.y / snapLength.y,
                        x: scrollStart.x / snapLength.x},
        nextPoint = {y: 0, x: 0};

    // set target and bounds by direction
    nextPoint.y = roundByDirection(direction.y, currentPoint.y);
    nextPoint.x = roundByDirection(direction.x, currentPoint.x);

    // constrain by distance
    nextPoint.y = constrainByDistance(initialPoint.y, currentPoint.y, nextPoint.y, scrollStart.y, top);
    nextPoint.x = constrainByDistance(initialPoint.x, currentPoint.x, nextPoint.x, scrollStart.x, left);

    // calculate where to scroll
    var scrollTo = {y: nextPoint.y * snapLength.y,
                    x: nextPoint.x * snapLength.x};

    // stay in bounds (minimum: 0, maxmimum: absolute height)
    scrollTo.y = stayInBounds(0, getScrollHeight(scrollObj), scrollTo.y);
    scrollTo.x = stayInBounds(0, getScrollWidth(scrollObj), scrollTo.x);

    return scrollTo;
  }


  var currentIteratedObj = null,
      currentIteration = 0;

  function getNextElementSnapPoint(scrollObj, obj, direction) {
    var l = obj.snapElements.length,
        top = scrollObj.scrollTop,
        left = scrollObj.scrollLeft,
        // decide upon an iteration direction (favor -1, as 1 is default and will be applied when there is no direction on an axis)
        primaryDirection = Math.min(direction.y, direction.x),
        // get scrollable snap destination as offset
        snapDest = {y: getYSnapLength(obj, obj.snapLengthUnit.y),
                    x: getXSnapLength(obj, obj.snapLengthUnit.x)},
        snapCoords = {y: 0, x: 0};


    for(var i = currentIteration + primaryDirection; i<l && i >= 0; i = i+primaryDirection) {
      currentIteratedObj = obj.snapElements[i];

      // get objects snap coords by adding obj.top + obj.snaplength.y
      snapCoords = {y: (currentIteratedObj.offsetTop - scrollObj.offsetTop) + getYSnapLength(currentIteratedObj, currentIteratedObj.snapLengthUnit.y),
                    // & obj.left + obj.snaplength.x
                    x: (currentIteratedObj.offsetLeft - scrollObj.offsetLeft) + getXSnapLength(currentIteratedObj, currentIteratedObj.snapLengthUnit.x)};

      currentIteratedObj.snapCoords = snapCoords;
      // check if object snappoint is "close" enough to scrollable snappoint

      // not scrolled past element snap coords
      if ((left <= snapCoords.x && left + getWidth(scrollObj) >= snapCoords.x &&
           top <= snapCoords.y && top + getHeight(scrollObj) >= snapCoords.y)) {
        // ok, we found a snap point.
        currentIteration = i;
        // stay in bounds (minimum: 0, maxmimum: absolute height)
        return {y: stayInBounds(0, getScrollHeight(scrollObj), snapCoords.y - snapDest.y),
                x: stayInBounds(0, getScrollWidth(scrollObj), snapCoords.x - snapDest.x)};
      }
    }
    // no snap found, use first or last?
    if (primaryDirection == 1 && i === l-1) {
      currentIteration = l-1;
      // the for loop stopped at the last element
      return {y: stayInBounds(0, getScrollHeight(scrollObj), snapCoords.y - snapDest.y),
              x: stayInBounds(0, getScrollWidth(scrollObj), snapCoords.x - snapDest.x)};
    } else if (primaryDirection == -1 && i === 0) {
      currentIteration = 0;
      // the for loop stopped at the first element
      return {y: stayInBounds(0, getScrollHeight(scrollObj), snapCoords.y - snapDest.y),
              x: stayInBounds(0, getScrollWidth(scrollObj), snapCoords.x - snapDest.x)};
    }
    // stay in the same place
    return {y: stayInBounds(0, getScrollHeight(scrollObj), obj.snapElements[currentIteration].snapCoords.y - snapDest.y),
            x: stayInBounds(0, getScrollWidth(scrollObj), obj.snapElements[currentIteration].snapCoords.x - snapDest.x)};
  }

  /**
   * ceil or floor a number based on direction
   * @param  {Number} direction
   * @param  {Number} currentPoint
   * @return {Number}
   */
  function roundByDirection(direction, currentPoint) {
    if (direction === -1) {
      // when we go up, we floor the number to jump to the next snap-point in scroll direction
      return Math.floor(currentPoint);
    }
    // go down, we ceil the number to jump to the next in view.
    return Math.ceil(currentPoint);
  }

  /**
   * constrain jumping
   * @param  {Number} initialPoint
   * @param  {Number} currentPoint
   * @param  {Number} nextPoint
   * @return {Number}
   */
  function constrainByDistance(initialPoint, currentPoint, nextPoint, scrollStart, currentScrollValue) {
    if ((Math.abs(initialPoint - currentPoint) >= SNAP_CONSTRAINT) &&
         Math.abs(nextPoint - currentPoint) > CONSTRAINT) {

      // constrain jumping to a point too high/low when scrolling for more than SNAP_CONSTRAINT points.
      // (if the point is 85% further than we are, don't jump..)
      return Math.round(currentPoint);

    }
    if ((Math.abs(scrollStart-currentScrollValue) < MIN_PX_CONSTRAINT) &&
        (Math.abs(initialPoint - currentPoint) < SNAP_CONSTRAINT) &&
        (Math.abs(nextPoint - currentPoint) > FIRST_CONSTRAINT)) {
      // constrain jumping to a point too high/low when scrolling just for a few pixels (less than 10 pixels) and (5% of scrollable length)
      return Math.round(currentPoint);
    }
    return nextPoint;
  }

  /**
   * keep scrolling in bounds
   * @param  {Number} min
   * @param  {Number} max
   * @param  {Number} destined
   * @return {Number}
   */
  function stayInBounds(min, max, destined) {
    return Math.max(Math.min(destined, max), min);
  }

  /**
   * parse snap point value from declaration.
   * this uses regexp..
   * @param  {Object} declaration
   * @return {Object} returns an Object with the value and unit of the snap-point-y declaration
   */
  function parseSnapPointValue(declaration) {
    // regex to parse lengths
    var regex = /repeat\((\d+)(px|vh|vw|%)\)/g,
        // defaults
        parsed = {y: {value: 0, unit: 'px'},
                  x: {value: 0, unit: 'px'}},
        result;

    // parse y value and unit
    if (declaration['scroll-snap-points-y'] !== 'undefined') {
      result = regex.exec(declaration['scroll-snap-points-y']);
      // if regexp fails, value is null
      if (result !== null) {
        parsed.y = {value: result[1], unit: result[2]};
      }
    }

    // parse x value and unit
    if (declaration['scroll-snap-points-x'] !== 'undefined') {
      result = regex.exec(declaration['scroll-snap-points-x']);
      // if regexp fails, value is null
      if (result !== null) {
        parsed.x = {value: result[1], unit: result[2]};
      }
    }
    return parsed;
  }

  /**
   * parse snap destination/coordinate values.
   * @param  {Object} declaration
   * @return {Object}
   */
  function parseSnapCoordValue(declaration) {
    // regex to parse lengths
    var regex = /(\d+)(px|%) (\d+)(px|%)/g,
        // defaults
        parsed = {y: {value: 0, unit: 'px'},
                  x: {value: 0, unit: 'px'}},
        parsable,
        result;

    if(typeof declaration['scroll-snap-coordinate'] !== 'undefined') {
      parsable = 'scroll-snap-coordinate';
    } else if (typeof declaration['scroll-snap-destination'] !== 'undefined') {
      parsable = 'scroll-snap-destination';
    }

    // parse value and unit
    if (parsable !== null) {
      result = regex.exec(declaration[parsable]);
      // if regexp fails, value is null
      if (result !== null) {
        parsed.y = {value: result[1], unit: result[2]};
        parsed.x = {value: result[3], unit: result[4]};
      }
    }
    return parsed;
  }

  /**
   * calc length of one snap on y-axis
   * @param  {Object} declaration the parsed declaration
   * @return {Number}
   */
  function getYSnapLength(obj, declaration) {
    if (declaration.unit == 'vh') {
      // when using vh, one snap is the length of vh / 100 * value
      return Math.max(doc.documentElement.clientHeight, w.innerHeight || 1) / 100 * declaration.value;
    } else if (declaration.unit == '%') {
      // when using %, one snap is the length of element height / 100 * value
      return getHeight(obj) / 100 * declaration.value;
    } else {
      // when using px, one snap is the length of element height / value
      return getHeight(obj) / declaration.value;
    }

    return 0;
  }

  /**
   * calc length of one snap on x-axis
   * @param  {Object} declaration the parsed declaration
   * @return {Number}
   */
  function getXSnapLength(obj, declaration) {
    if (declaration.unit == 'vw') {
      // when using vw, one snap is the length of vw / 100 * value
      return Math.max(doc.documentElement.clientWidth, w.innerWidth || 1) / 100 * declaration.value;
    } else if (declaration.unit == '%') {
      // when using %, one snap is the length of element width / 100 * value
      return getWidth(obj) / 100 * declaration.value;
    } else {
      // when using px, one snap is the length of element width / value
      return getWidth(obj) / declaration.value;
    }

    return 0;
  }

  /**
   * get an elements scrollable height
   * @param  {Object} obj
   * @return {Number}
   */
  function getScrollHeight(obj) {
    return obj.scrollHeight;
  }

  /**
   * get an elements scrollable width
   * @param  {Object} obj
   * @return {Number}
   */
  function getScrollWidth(obj) {
    return obj.scrollWidth;
  }

  /**
   * get an elements height
   * @param  {Object} obj
   * @return {Number}
   */
  function getHeight(obj) {
    return obj.offsetHeight;
  }

  /**
   * get an elements width
   * @param  {Object} obj
   * @return {Number}
   */
  function getWidth(obj) {
    return obj.offsetWidth;
  }

  /**
   * return the element scrolling values are applied to.
   * when receiving window.onscroll events, the actual scrolling is on the body.
   * @param  {Object} obj
   * @return {Object}
   */
  function getScrollObj(obj) {
    // if the scroll container is body, the scrolling is invoked on window/doc.
    if (obj == doc || obj == w) {
      // firefox scrolls on doc.documentElement
      if (doc.documentElement.scrollTop > 0 || doc.documentElement.scrollLeft > 0) {
        return doc.documentElement;
      }
      // chrome scrolls on body
      return doc.querySelector('body');
    }

    return obj;
  }

  /**
   * calc the duration of the animation proportional to the distance travelled
   * @param  {Number} start
   * @param  {Number} end
   * @return {Number}       scroll time in ms
   */
  function getDuration(start, end) {
    var distance = Math.abs(start - end),
        procDist = 100 / Math.max(doc.documentElement.clientHeight, w.innerHeight || 1) * distance,
        duration = 100 / SCROLL_TIME * procDist;

    if (isNaN(duration)) {
      return 0;
    }

    return Math.max(SCROLL_TIME / 1.5, Math.min(duration, SCROLL_TIME));
  }

  /**
   * ease in out function thanks to:
   * http://blog.greweb.fr/2012/02/bezier-curve-based-easing-functions-from-concept-to-implementation/
   * @param  {Number} t timing
   * @return {Number}   easing factor
   */
  var easeInCubic = function(t) {
    return t*t*t;
  };


  /**
   * calculate the scroll position we should be in
   * @param  {Number} start    the start point of the scroll
   * @param  {Number} end      the end point of the scroll
   * @param  {Number} elapsed  the time elapsed from the beginning of the scroll
   * @param  {Number} duration the total duration of the scroll (default 500ms)
   * @return {Number}          the next position
   */
  var position = function(start, end, elapsed, duration) {
      if (elapsed > duration) {
        return end;
      }
      return start + (end - start) * easeInCubic(elapsed / duration);
  };

  // a current animation frame
  var animationFrame = null;

  /**
   * smoothScroll function by Alice Lietieur.
   * @see https://github.com/alicelieutier/smoothScroll
   * we use requestAnimationFrame to be called by the browser before every repaint
   * @param  {Object}   obj      the scroll context
   * @param  {Number}  end      where to scroll to
   * @param  {Number}   duration scroll duration
   * @param  {Function} callback called when the scrolling is finished
   */
  var smoothScroll = function(obj, end, callback) {
    var start = {y: obj.scrollTop, x: obj.scrollLeft},

        clock = Date.now(),

        // get animation frame or a fallback
        requestAnimationFrame = w.requestAnimationFrame ||
                                w.mozRequestAnimationFrame ||
                                w.webkitRequestAnimationFrame ||
                                function(fn){w.setTimeout(fn, 15);},
        duration = Math.max(getDuration(start.y, end.y), getDuration(start.x, end.x));

      // setup the stepping function
      var step = function() {

        // calculate timings
        var elapsed = Date.now() - clock;

        // change position on y-axis if result is a number.
        if (!isNaN(end.y)) {
          obj.scrollTop = position(start.y, end.y, elapsed, duration);
        }

        // change position on x-axis if result is a number.
        if (!isNaN(end.x)) {
          obj.scrollLeft = position(start.x, end.x, elapsed, duration);
        }

        // check if we are over due
        if (elapsed > duration) {
          // is there a callback?
          if (typeof callback === 'function') {
            // stop execution and run the callback
            return callback(end);
          }

          // stop execution
          return;
        }

        // use a new animation frame
        animationFrame = requestAnimationFrame(step);
      };

      // start the first step
      step();
  };

  /**
   * Polyfill object
   * @type Polyfill
   * @see https://github.com/philipwalton/polyfill
   */
  var pf = new Polyfill({
    declarations:["scroll-snap-type:*", "scroll-snap-point-y:*", "scroll-snap-coordinate:*", "scroll-snap-destination:*"]
  })
  .doMatched(doMatched)
  .undoUnmatched(undoUnmatched);

}(window, document));
