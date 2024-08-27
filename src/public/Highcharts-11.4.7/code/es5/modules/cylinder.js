!/**
 * Highcharts JS v11.4.7 (2024-08-14)
 *
 * Highcharts cylinder module
 *
 * (c) 2010-2024 Kacper Madej
 *
 * License: www.highcharts.com/license
 */function(e){"object"==typeof module&&module.exports?(e.default=e,module.exports=e):"function"==typeof define&&define.amd?define("highcharts/modules/cylinder",["highcharts","highcharts/highcharts-3d"],function(t){return e(t),e.Highcharts=t,e}):e("undefined"!=typeof Highcharts?Highcharts:void 0)}(function(e){"use strict";var t=e?e._modules:{};function r(t,r,n,o){t.hasOwnProperty(r)||(t[r]=o.apply(null,n),"function"==typeof CustomEvent&&e.win.dispatchEvent(new CustomEvent("HighchartsModuleLoaded",{detail:{path:r,module:t[r]}})))}r(t,"Series/Cylinder/SVGElement3DCylinder.js",[t["Core/Color/Color.js"],t["Core/Renderer/RendererRegistry.js"]],function(e,t){var r,n=this&&this.__extends||(r=function(e,t){return(r=Object.setPrototypeOf||({__proto__:[]})instanceof Array&&function(e,t){e.__proto__=t}||function(e,t){for(var r in t)Object.prototype.hasOwnProperty.call(t,r)&&(e[r]=t[r])})(e,t)},function(e,t){if("function"!=typeof t&&null!==t)throw TypeError("Class extends value "+String(t)+" is not a constructor or null");function n(){this.constructor=e}r(e,t),e.prototype=null===t?Object.create(t):(n.prototype=t.prototype,new n)}),o=e.parse;return function(e){function t(){var t=null!==e&&e.apply(this,arguments)||this;return t.parts=["top","bottom","front","back"],t.pathType="cylinder",t}return n(t,e),t.prototype.fillSetter=function(e){return this.singleSetterForParts("fill",null,{front:e,back:e,top:o(e).brighten(.1).get(),bottom:o(e).brighten(-.1).get()}),this.color=this.fill=e,this},t}(t.getRendererType().prototype.Element3D)}),r(t,"Series/Cylinder/CylinderComposition.js",[t["Core/Globals.js"],t["Core/Math3D.js"],t["Series/Cylinder/SVGElement3DCylinder.js"],t["Core/Utilities.js"]],function(e,t,r,n){var o=e.charts,i=e.deg2rad,s=t.perspective,u=n.extend,l=n.pick;function p(e){return!e.some(function(e){return"C"===e[0]})}function c(e){return this.element3d("cylinder",e)}function y(e){var t=o[this.chartIndex],r=this.cuboidPath(e),n=!r.isTop,i=!r.isFront,s=this.getCylinderEnd(t,e),u=this.getCylinderEnd(t,e,!0);return{front:this.getCylinderFront(s,u),back:this.getCylinderBack(s,u),top:s,bottom:u,zIndexes:{top:n?3:0,bottom:n?0:3,front:i?2:1,back:i?1:2,group:r.zIndexes.group}}}function a(e){for(var t=[["M",e[0].x,e[0].y]],r=e.length-2,n=1;n<r;n+=3)t.push(["C",e[n].x,e[n].y,e[n+1].x,e[n+1].y,e[n+2].x,e[n+2].y]);return t}function h(e,t){var r=[];if(p(e)){var n=e[0],o=e[2];"M"===n[0]&&"L"===o[0]&&(r.push(["M",o[1],o[2]]),r.push(e[3]),r.push(["L",n[1],n[2]]))}else"C"===e[2][0]&&r.push(["M",e[2][5],e[2][6]]),r.push(e[3],e[4]);if(p(t)){var n=t[0];"M"===n[0]&&(r.push(["L",n[1],n[2]]),r.push(t[3]),r.push(t[2]))}else{var i=t[2],s=t[3],u=t[4];"C"===i[0]&&"C"===s[0]&&"C"===u[0]&&(r.push(["L",u[5],u[6]]),r.push(["C",u[3],u[4],u[1],u[2],s[5],s[6]]),r.push(["C",s[3],s[4],s[1],s[2],i[5],i[6]]))}return r.push(["Z"]),r}function d(e,t,r){for(var n,o,u=t.width,p=void 0===u?0:u,c=t.height,y=t.alphaCorrection,a=l(t.depth,p,0),h=Math.min(p,a)/2,d=i*(e.options.chart.options3d.beta-90+(void 0===y?0:y)),f=(t.y||0)+(r?void 0===c?0:c:0),C=.5519*h,g=p/2+(t.x||0),v=a/2+(t.z||0),x=[{x:0,y:f,z:h},{x:C,y:f,z:h},{x:h,y:f,z:C},{x:h,y:f,z:0},{x:h,y:f,z:-C},{x:C,y:f,z:-h},{x:0,y:f,z:-h},{x:-C,y:f,z:-h},{x:-h,y:f,z:-C},{x:-h,y:f,z:0},{x:-h,y:f,z:C},{x:-C,y:f,z:h},{x:0,y:f,z:h}],j=Math.cos(d),m=Math.sin(d),_=0;_<x.length;_++){var b=x[_];n=b.x,o=b.z,b.x=n*j-o*m+g,b.z=o*j+n*m+v}var S=s(x,e,!0);return 2.5>Math.abs(S[3].y-S[9].y)&&2.5>Math.abs(S[0].y-S[6].y)?this.toLinePath([S[0],S[3],S[6],S[9]],!0):this.getCurvedPath(S)}function f(e,t){var r=e.slice(0,3);if(p(t)){var n=t[0];"M"===n[0]&&(r.push(t[2]),r.push(t[1]),r.push(["L",n[1],n[2]]))}else{var n=t[0],o=t[1],i=t[2];"M"===n[0]&&"C"===o[0]&&"C"===i[0]&&(r.push(["L",i[5],i[6]]),r.push(["C",i[3],i[4],i[1],i[2],o[5],o[6]]),r.push(["C",o[3],o[4],o[1],o[2],n[1],n[2]]))}return r.push(["Z"]),r}return{compose:function(e){var t=e.prototype;t.cylinder||(t.Element3D.types.cylinder=r,u(t,{cylinder:c,cylinderPath:y,getCurvedPath:a,getCylinderBack:h,getCylinderEnd:d,getCylinderFront:f}))}}}),r(t,"Series/Cylinder/CylinderPoint.js",[t["Core/Series/SeriesRegistry.js"],t["Core/Utilities.js"]],function(e,t){var r,n=this&&this.__extends||(r=function(e,t){return(r=Object.setPrototypeOf||({__proto__:[]})instanceof Array&&function(e,t){e.__proto__=t}||function(e,t){for(var r in t)Object.prototype.hasOwnProperty.call(t,r)&&(e[r]=t[r])})(e,t)},function(e,t){if("function"!=typeof t&&null!==t)throw TypeError("Class extends value "+String(t)+" is not a constructor or null");function n(){this.constructor=e}r(e,t),e.prototype=null===t?Object.create(t):(n.prototype=t.prototype,new n)}),o=e.seriesTypes.column.prototype.pointClass,i=t.extend,s=function(e){function t(){return null!==e&&e.apply(this,arguments)||this}return n(t,e),t}(o);return i(s.prototype,{shapeType:"cylinder"}),s}),r(t,"Series/Cylinder/CylinderSeriesDefaults.js",[],function(){return{}}),r(t,"Series/Cylinder/CylinderSeries.js",[t["Series/Cylinder/CylinderComposition.js"],t["Series/Cylinder/CylinderPoint.js"],t["Series/Cylinder/CylinderSeriesDefaults.js"],t["Core/Series/SeriesRegistry.js"],t["Core/Utilities.js"]],function(e,t,r,n,o){var i,s=this&&this.__extends||(i=function(e,t){return(i=Object.setPrototypeOf||({__proto__:[]})instanceof Array&&function(e,t){e.__proto__=t}||function(e,t){for(var r in t)Object.prototype.hasOwnProperty.call(t,r)&&(e[r]=t[r])})(e,t)},function(e,t){if("function"!=typeof t&&null!==t)throw TypeError("Class extends value "+String(t)+" is not a constructor or null");function r(){this.constructor=e}i(e,t),e.prototype=null===t?Object.create(t):(r.prototype=t.prototype,new r)}),u=n.seriesTypes.column,l=o.extend,p=o.merge,c=function(t){function n(){return null!==t&&t.apply(this,arguments)||this}return s(n,t),n.compose=e.compose,n.defaultOptions=p(u.defaultOptions,r),n}(u);return l(c.prototype,{pointClass:t}),n.registerSeriesType("cylinder",c),c}),r(t,"masters/modules/cylinder.src.js",[t["Core/Globals.js"],t["Series/Cylinder/CylinderSeries.js"],t["Core/Renderer/RendererRegistry.js"]],function(e,t,r){return t.compose(r.getRendererType()),e})});