!function(n,e,t){"use strict";function o(n,t){return(t||e).querySelectorAll(n)}function l(n){var t=new MutationObserver(function(e){e.forEach(function(e){e.addedNodes.length&&n.each(s),[].forEach.call(e.removedNodes,u)})});t.observe(e.body,{subtree:!0,childList:!0}),n.each(s)}function a(n){n.each(function(n){var t=e.querySelectorAll(n.getSelectors());[].forEach.call(t,function(n){u(n)})})}function r(n,t){if("undefined"!=typeof t["scroll-snap-coordinate"])return n.snapLengthUnit=h(t),c(n);var o=n.tagName;"body"!=o.toLowerCase()&&"html"!=o.toLowerCase()||(n=e),n.addEventListener("scroll",k,!1),"undefined"!=typeof t["scroll-snap-destination"]?n.snapLengthUnit=h(t):n.snapLengthUnit=m(t),n.snapElements=[]}function i(n){return function(e){r(e,n)}}function s(n){var t=o(n.getSelectors(),e),l=n.getDeclaration();[].forEach.call(t,i(l))}function u(n){var t=n.tagName;"body"!=t.toLowerCase()&&"html"!=t.toLowerCase()||(n=e),n.removeEventListener("scroll",k,!1),n.snapLengthUnit=null,n.snapElements=[]}function c(n){for(var e=n;n&&n!==document;n=n.parentNode)"undefined"!=typeof n.snapElements&&n.snapElements.push(e)}function f(n,e,t){var o={y:v(e,e.snapLengthUnit.y),x:L(e,e.snapLengthUnit.x)},l=n.scrollTop,a=n.scrollLeft,r={y:l/o.y,x:a/o.x},i={y:D.y/o.y,x:D.x/o.x},s={y:0,x:0};s.y=p(t.y,r.y),s.x=p(t.x,r.x),s.y=x(i.y,r.y,s.y,D.y,l),s.x=x(i.x,r.x,s.x,D.x,a);var u={y:s.y*o.y,x:s.x*o.x};return u.y=d(0,g(n),u.y),u.x=d(0,E(n),u.x),u}function y(n,e,t){for(var o=e.snapElements.length,l=n.scrollTop,a=n.scrollLeft,r=Math.min(t.y,t.x),i={y:v(e,e.snapLengthUnit.y),x:L(e,e.snapLengthUnit.x)},s={y:0,x:0},u=O+r;u<o&&u>=0;u+=r)if(z=e.snapElements[u],s={y:z.offsetTop-n.offsetTop+v(z,z.snapLengthUnit.y),x:z.offsetLeft-n.offsetLeft+L(z,z.snapLengthUnit.x)},z.snapCoords=s,a<=s.x&&a+T(n)>=s.x&&l<=s.y&&l+M(n)>=s.y)return O=u,{y:d(0,g(n),s.y-i.y),x:d(0,E(n),s.x-i.x)};return 1==r&&u===o-1?(O=o-1,{y:d(0,g(n),s.y-i.y),x:d(0,E(n),s.x-i.x)}):r==-1&&0===u?(O=0,{y:d(0,g(n),s.y-i.y),x:d(0,E(n),s.x-i.x)}):{y:d(0,g(n),e.snapElements[O].snapCoords.y-i.y),x:d(0,E(n),e.snapElements[O].snapCoords.x-i.x)}}function p(n,e){return n===-1?Math.floor(e):Math.ceil(e)}function x(n,e,t,o,l){return Math.abs(n-e)>=C&&Math.abs(t-e)>w?Math.round(e):Math.abs(o-l)<S&&Math.abs(n-e)<C&&Math.abs(t-e)>U?Math.round(e):t}function d(n,e,t){return Math.max(Math.min(t,e),n)}function m(n){var e,t=/repeat\((\d+)(px|vh|vw|%)\)/g,o={y:{value:0,unit:"px"},x:{value:0,unit:"px"}};return"undefined"!=typeof n["scroll-snap-points-y"]&&(e=t.exec(n["scroll-snap-points-y"]),null!==e&&(o.y={value:e[1],unit:e[2]})),"undefined"!=typeof n["scroll-snap-points-x"]&&(e=t.exec(n["scroll-snap-points-x"]),null!==e&&(o.x={value:e[1],unit:e[2]})),o}function h(n){var e,t,o=/(\d+)(px|%) (\d+)(px|%)/g,l={y:{value:0,unit:"px"},x:{value:0,unit:"px"}};return"undefined"!=typeof n["scroll-snap-coordinate"]?e="scroll-snap-coordinate":"undefined"!=typeof n["scroll-snap-destination"]&&(e="scroll-snap-destination"),null!==e&&(t=o.exec(n[e]),null!==t&&(l.y={value:t[1],unit:t[2]},l.x={value:t[3],unit:t[4]})),l}function v(t,o){return"vh"==o.unit?Math.max(e.documentElement.clientHeight,n.innerHeight||1)/100*o.value:"%"==o.unit?M(t)/100*o.value:M(t)/o.value}function L(t,o){return"vw"==o.unit?Math.max(e.documentElement.clientWidth,n.innerWidth||1)/100*o.value:"%"==o.unit?T(t)/100*o.value:T(t)/o.value}function g(n){return n.scrollHeight}function E(n){return n.scrollWidth}function M(n){return n.offsetHeight}function T(n){return n.offsetWidth}function b(t){return t==e||t==n?e.documentElement.scrollTop>0||e.documentElement.scrollLeft>0?e.documentElement:e.querySelector("body"):t}function N(t,o){var l=Math.abs(t-o),a=100/Math.max(e.documentElement.clientHeight,n.innerHeight||1)*l,r=100/A*a;return isNaN(r)?0:Math.max(A/1.5,Math.min(r,A))}var w=1-.18,U=.95,S=5,C=2,q=45,A=768;if(!("scrollSnapType"in e.documentElement.style||"webkitScrollSnapType"in e.documentElement.style||"msScrollSnapType"in e.documentElement.style)){var H,F,W=null,D=null,k=function(n){H=n.target,F=b(H),B&&(cancelAnimationFrame(B)||clearTimeout(B)),W?clearTimeout(W):D={y:F.scrollTop,x:F.scrollLeft},W=setTimeout(R,q)},R=function(){if(D.y!=F.scrollTop||D.x!=F.scrollLeft){var n,e={y:D.y-F.scrollTop>0?-1:1,x:D.x-F.scrollLeft>0?-1:1};n="undefined"!=typeof F.snapElements&&F.snapElements.length>0?y(F,H,e):f(F,H,e),H.removeEventListener("scroll",k,!1),G(F,n,function(){H.addEventListener("scroll",k,!1)}),isNaN(n.x||!isNaN(n.y))||(D=n)}},z=null,O=0,P=function(n){return n*n*n},j=function(n,e,t,o){return t>o?e:n+(e-n)*P(t/o)},B=null,G=function(e,t,o){var l={y:e.scrollTop,x:e.scrollLeft},a=Date.now(),r=n.requestAnimationFrame||n.mozRequestAnimationFrame||n.webkitRequestAnimationFrame||function(e){n.setTimeout(e,15)},i=Math.max(N(l.y,t.y),N(l.x,t.x)),s=function(){var n=Date.now()-a;if(isNaN(t.y)||(e.scrollTop=j(l.y,t.y,n,i)),isNaN(t.x)||(e.scrollLeft=j(l.x,t.x,n,i)),n>i){if("function"==typeof o)return o(t)}else B=r(s)};s()};new Polyfill({declarations:["scroll-snap-type:*","scroll-snap-point-y:*","scroll-snap-coordinate:*","scroll-snap-destination:*"]}).doMatched(l).undoUnmatched(a)}}(window,document);