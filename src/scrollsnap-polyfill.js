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
   * Feature detect scroll-snap-type, if it exists then do nothing (return)
   */
  if ('scrollSnapType' in doc.documentElement.style ||
      'webkitScrollSnapType' in doc.documentElement.style) {
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
        obj.removeEventListener('scroll', handler, false);
        delete obj._scsnp_declaration;
      });
    });
  }

  /**
   * set up an element for scroll-snap behaviour
   * @param {Object} obj         HTML element
   * @param {Object} declaration CSS declarations
   */
  function setUpElement(obj, declaration) {
    // if (obj.tagName.toLowerCase === "body") {
    // bind to document.scroll
    // }
    obj.addEventListener('scroll', handler, false);
    obj._scsnp_declaration = declaration;
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
    var obj = evt.target;

    // if a previous timeout exists, clear it.
    if (timeOutId) {
      // we only want to call a timeout once after scrolling..
      clearTimeout(timeOutId);

      timeOutId = null;
    } else {
      // save new scroll start
      scrollStart = evt.target.scrollTop;
    }

    // set a 50ms timeout for every scroll event.
    // if we have new scroll events in that time, the previous timeouts are cleared.
    // thus we can be sure that the timeout will be called 50ms after the last scroll event.
    timeOutId = setTimeout(function(){
        // detect direction of scroll. negative is up, positive is down.
        var direction = (scrollStart - obj.scrollTop > 0) ? -1 : 1,
            // get the next snap-point to snap-to
            snapPoint = getNextSnapPoint(obj, direction);

        // before doing the move, unbind the event handler
        obj.removeEventListener('scroll', handler, false);

        // re-bind the eventlistener after 30ms
        setTimeout(function() {
          // this allows us to jump without throwing scroll events ourselves.
          obj.addEventListener('scroll', handler, false);
        }, 30);
        // ok, really jump. hope this fires between those 30ms
        obj.scrollTop = snapPoint;

        // TODO: implement smooth scrolling here... maybe with a callback to re-bind the scroll event listener

        scrollStart = snapPoint;
    }, 50);
  };

  /**
   * calculator for next snap-point
   * @param  {Object} obj       HTML element
   * @param  {integer} direction signed integer indicating the scroll direction
   * @return {[type]}           [description]
   */
  function getNextSnapPoint(obj, direction) {

    // TODO replace this with a correct calc based on the declaration.

    // this can be Nvh, N%, Npx,
    var vh = Math.max(doc.documentElement.clientHeight, w.innerHeight || 0);

    // calc current and initial snappoint
    var currentPoint = obj.scrollTop / vh,
        initialPoint = scrollStart / vh,
        nextPoint,
        // minimum is top of element
        limit = 0;

    // set target and bounds by direction
    if (direction === -1) {
      // when we go up, we floor the number to jump to the next snap-point in scroll direction
      nextPoint = Math.floor(currentPoint);
    } else {
      // go down, we ceil the number to jump to the next in view.
      nextPoint = Math.ceil(currentPoint);

      // maximum is container height
      limit = obj.offsetHeight;
    }

    // constrain jumping to a point too high/low when scrolling for more than one points. (if the point is 85% further than we are, don't jump..)
    if ((Math.abs(initialPoint - currentPoint) > 2) ||
         Math.abs(nextPoint - currentPoint) > 0.85) {
      // we still need to round...
      nextPoint = Math.round(currentPoint);
    }

    // calculate where to scroll
    var scrollTo = nextPoint * vh;

    // stay in bounds
    return Math.max(scrollTo, limit);
  }

  /**
   * Polyfill object
   * @type Polyfill
   * @see https://github.com/philipwalton/polyfill
   */
  var pf = Polyfill({
    declarations:["*scroll-snap-type:*", "*scroll-snap-point-y:*"]
  })
  .doMatched(doMatched)
  .undoUnmatched(undoUnmatched);

}(window, document));
