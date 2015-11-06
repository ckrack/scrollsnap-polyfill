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
     * but the current distance is less than 1-0.15 (read: 15 percent),
     * the snap-will go back to the closer snap-point.
     */
  var CONSTRAINT = 1-0.18,
      FIRST_CONSTRAINT = 1-0.05,
      /**
       * when scrolling for more than SNAP_CONSTRAINT snap points,
       * a constraint is applied for scrolling to snap points in the distance.
       * @type {Number}
       */
      SNAP_CONSTRAINT = 2,
      /**
       * time after which scrolling is considered finished.
       * the scroll timeouts are timed with this.
       * whenever a new scroll event is triggered, the previous timeout is deleted.
       * @type {Number}
       */
      SCROLL_TIMEOUT = 45,

      /**
       * time for the smooth scrolling
       * @type {Number}
       */
      SCROLL_TIME = 768,
      /**
       * turn debugging on/off
       * @type {Boolean}
       */
      DEBUG = true;

  /**
   * Feature detect scroll-snap-type, if it exists then do nothing (return)
   */
  if ('scrollSnapType' in doc.documentElement.style ||
      'webkitScrollSnapType' in doc.documentElement.style) {
    if (DEBUG) console.log('[Scrollsnap] native support.');
    return;
  }

  /**
   * doMatched is a callback for Polyfill to fill in the desired behaviour.
   * @param  {array} rules rules found for the polyfill
   */
  function doMatched(rules) {

    rules.each(function(rule) {
      var elements = doc.querySelectorAll(rule.getSelectors()),
          declaration = rule.getDeclaration();
      [].forEach.call(elements, function(obj) {
        setUpElement(obj, declaration);
      });
    });
  }

  /**
   * unDomatched is a callback for polyfill to undo any polyfilled behaviour
   * @param  {[type]} rules [description]
   */
  function undoUnmatched(rules) {

    rules.each(function(rule) {
      var elements = doc.querySelectorAll(rule.getSelectors());
      [].forEach.call(elements, function(item) {
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
    if (DEBUG) console.log('[Scrollsnap] setting up object: '+obj, declaration);
    // if the scroll snap attributes are applied on the body/html tag, use the doc for scroll events.
    var tag = obj.tagName;
    if (tag.toLowerCase() == "body" ||
        tag.toLowerCase() == "html") {
      obj = doc;
    }

    obj.addEventListener('scroll', handler, false);
    // save declaration
    obj._scsnp_declaration = declaration;
  }

  function tearDownElement(obj) {
    if (DEBUG) console.log('[Scrollsnap] tearing down object: '+obj, declaration);
    // if the scroll snap attributes are applied on the body/html tag, use the doc for scroll events.
    var tag = obj.tagName;
    if (tag.toLowerCase() == "body" ||
        tag.toLowerCase() == "html") {
      obj = doc;
    }
    obj.removeEventListener('scroll', handler, false);
    delete obj._scsnp_declaration;
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
   * scroll handler
   * this is the callback for scroll events.
   */
  var handler = function(evt) {
    // use evt.target as target-element
    var obj = evt.target,
        scrollObj = getScrollObj(obj);

    if (DEBUG) console.log('[Scrollsnap] scroll event on '+evt.target+'. start:'+scrollStart+' end:'+scrollObj.scrollTop);


    // if a previous timeout exists, clear it.
    if (timeOutId) {
      // we only want to call a timeout once after scrolling..
      clearTimeout(timeOutId);

      timeOutId = null;
    } else {
      // save new scroll start
      scrollStart = scrollObj.scrollTop;
      if (DEBUG) console.log('[Scrollsnap] saving new scroll start: '+scrollStart);
    }

    // set a 30ms timeout for every scroll event.
    // if we have new scroll events in that time, the previous timeouts are cleared.
    // thus we can be sure that the timeout will be called 50ms after the last scroll event.
    timeOutId = setTimeout(function(){
      // if we don't move a thing, we can ignore the timeout: if we did, there'd be another timeout added for scrollStart+1.
      if(scrollStart == scrollObj.scrollTop) {
        if (DEBUG) console.log('[Scrollsnap] ignore scroll timeout because not actually moving.');
        return;
      }

      // detect direction of scroll. negative is up, positive is down.
      var direction = (scrollStart - scrollObj.scrollTop > 0) ? -1 : 1,
          // get the next snap-point to snap-to
          snapPoint = getNextSnapPoint(scrollObj, obj, obj._scsnp_declaration, direction);

      // before doing the move, unbind the event handler
      obj.removeEventListener('scroll', handler, false);

      if (DEBUG) console.log('[Scrollsnap] called scroll timeout. direction: '+direction+' - snap point: '+snapPoint+'. removed event listener. now smooth scrolling.');

      // smoothly move to the snap point
      smoothScroll(scrollObj, snapPoint, null, function() {
        // after moving to the snap point, rebind the scroll event handler
        obj.addEventListener('scroll', handler, false);
        if (DEBUG) console.log('[Scrollsnap] re-adding event listener on '+obj);
      });

      // we just jumped to the snapPoint, so this will be our next scrollStart
      scrollStart = snapPoint;
      if (DEBUG) console.log('[Scrollsnap] saving scroll start: '+scrollStart);
    }, SCROLL_TIMEOUT);
  };

  /**
   * calculator for next snap-point
   * @param  {Object} obj       HTML element
   * @param  {integer} direction signed integer indicating the scroll direction
   * @return {[type]}           [description]
   */
  function getNextSnapPoint(scrollObj, obj, declaration, direction) {
    // parse length and unit from declaration
    var snapLengthUnit = parseSnapPointValue(declaration),
    snapLength = calcSnapLength(snapLengthUnit, obj);

    // calc current and initial snappoint
    var currentPoint = scrollObj.scrollTop / snapLength,
        initialPoint = scrollStart / snapLength,
        nextPoint;

    // set target and bounds by direction
    if (direction === -1) {
      // when we go up, we floor the number to jump to the next snap-point in scroll direction
      nextPoint = Math.floor(currentPoint);
    } else {
      // go down, we ceil the number to jump to the next in view.
      nextPoint = Math.ceil(currentPoint);
    }

    if ((Math.abs(initialPoint - currentPoint) >= SNAP_CONSTRAINT) &&
         Math.abs(nextPoint - currentPoint) > CONSTRAINT) {
      // constrain jumping to a point too high/low when scrolling for more than SNAP_CONSTRAINT points.
      // (if the point is 85% further than we are, don't jump..)
      nextPoint = Math.round(currentPoint);
    } else if ((Math.abs(scrollStart-scrollObj.scrollTop)<10) &&
	       (Math.abs(initialPoint - currentPoint) < SNAP_CONSTRAINT) &&
	       (Math.abs(nextPoint - currentPoint) > FIRST_CONSTRAINT)) {
      // constrain jumping to a point too high/low when scrolling just for a few pixels (less than 10 pixels) and (5% of scrollable length)
      nextPoint = Math.round(currentPoint);
      if (DEBUG) console.log('[Scrollsnap] round because of first constraint: ', scrollObj.scrollTop, scrollStart);
    }

    // calculate where to scroll
    var scrollTo = nextPoint * snapLength;
    if (DEBUG) console.log('[Scrollsnap] should scroll to:'+scrollTo);

    // stay in bounds (minimum: 0, maxmimum: absolute height)
    return Math.max(Math.min(scrollTo, getScrollHeight(scrollObj)), 0);
  }

  /**
   * parse snap point value from declaration.
   * this uses regexp..
   * @param  {Object} declaration
   * @return {Object} returns an Object with the value and unit of the snap-point-y declaration
   */
  function parseSnapPointValue(declaration) {
    if (DEBUG) console.log('[Scrollsnap] parse declaration:', declaration);

    // run a regex to parse lengths
    var regex = /repeat\((\d+)(px|vh|vw|%)\)/g,
    result = regex.exec(declaration['scroll-snap-points-y']);

    // if regexp fails, value is null
    if (result === null) {
      return null;
    }

    // return calling the function to calculate actual length of one snap.
    return {value: result[1], unit: result[2]};
  }

  /**
   * calc length of one snap
   * @param  {Object} snapLengthUnit [description]
   * @param  {Object} obj
   * @return {Object}                [description]
   */
  function calcSnapLength(snapLengthUnit, obj) {
    if (snapLengthUnit.unit == 'vh') {
      // when using vh, one snap is the length of vh / 100 * value
      return Math.max(doc.documentElement.clientHeight, w.innerHeight || 0) / 100 * snapLengthUnit.value;
    } else if (snapLengthUnit.unit == '%') {
      // when using %, one snap is the length of element height / 100 * value
      return getHeight(obj) / 100 * snapLengthUnit.value;
    } else {
      // when using px, one snap is the length of element height / value
      return getHeight(obj) / snapLengthUnit.value;
    }

    return 1;
  }

  /**
   * get an elements scrollHeight
   * @param  {Object} obj
   * @return {Number}
   */
  function getScrollHeight(obj) {
    if (DEBUG) console.log('[Scrollsnap] scrollheight:'+obj.scrollHeight);
    return obj.scrollHeight;
  }

  function getHeight(obj) {
    return obj.offsetHeight;
  }

  /**
   * return the element scrolling values are applied to.
   * when receiving window.onscroll events, the actual scrolling is on the body.
   * @param  {Object} obj
   * @return {Object}
   */
  function getScrollObj(obj) {
    if (obj == doc || obj == w) {
      return doc.querySelector('body');
    }
    return obj;
  }


  /**
   * ease in out function thanks to:
   * http://blog.greweb.fr/2012/02/bezier-curve-based-easing-functions-from-concept-to-implementation/
   * @param  {Number} t timing
   * @return {Number}   easing factor
   */
    var easeInOutCubic = function(t) {
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    };


  /**
   * calculate the scroll position we should be in
   * @param  {Number} start    the start point of the scroll
   * @param  {Number} end      the end point of the scroll
   * @param  {Number} elapsed  the time elapsed from the beginning of the scroll
   * @param  {Number} duration the total duration of the scroll (default 500ms)
   * @return {Number}          [description]
   */
  var position = function(start, end, elapsed, duration) {
      if (elapsed > duration) return end;
      return start + (end - start) * easeInOutCubic(elapsed / duration); // <-- you can change the easing funtion there
      // return start + (end - start) * (elapsed / duration); // <-- this would give a linear scroll
  };


  /**
   * smoothScroll plugin by Alice Lietieur.
   * @see https://github.com/alicelieutier/smoothScroll
   * we use requestAnimationFrame to be called by the browser before every repaint
   * @param  {Object}   obj      the scroll context
   * @param  {Number}  end      where to scroll to
   * @param  {Number}   duration scroll duration
   * @param  {Function} callback called when the scrolling is finished
   */
  var smoothScroll = function(obj, end, duration, callback){
      // TODO calculate duration based on max-distance/distance
      duration = duration || SCROLL_TIME;
      var start = obj.scrollTop;

      var clock = Date.now();
      var requestAnimationFrame = window.requestAnimationFrame ||
          window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame ||
          function(fn){window.setTimeout(fn, 15);};

      var step = function(){
          var elapsed = Date.now() - clock;
          obj.scrollTop = position(start, end, elapsed, duration);

          if (elapsed > duration) {
              if (typeof callback === 'function') {
                  callback(end);
              }
          } else {
              requestAnimationFrame(step);
          }
      };
      step();
  };

  /**
   * Polyfill object
   * @type Polyfill
   * @see https://github.com/philipwalton/polyfill
   */
  var pf = new Polyfill({
    declarations:["*scroll-snap-type:*", "*scroll-snap-point-y:*"]
  })
  .doMatched(doMatched)
  .undoUnmatched(undoUnmatched);

}(window, document));
