!/**
 * Highstock JS v11.4.7 (2024-08-14)
 *
 * Indicator series type for Highcharts Stock
 *
 * (c) 2010-2024 Rafał Sebestjański
 *
 * License: www.highcharts.com/license
 */function(t){"object"==typeof module&&module.exports?(t.default=t,module.exports=t):"function"==typeof define&&define.amd?define("highcharts/indicators/dema",["highcharts","highcharts/modules/stock"],function(e){return t(e),t.Highcharts=e,t}):t("undefined"!=typeof Highcharts?Highcharts:void 0)}(function(t){"use strict";var e=t?t._modules:{};function o(e,o,r,n){e.hasOwnProperty(o)||(e[o]=n.apply(null,r),"function"==typeof CustomEvent&&t.win.dispatchEvent(new CustomEvent("HighchartsModuleLoaded",{detail:{path:o,module:e[o]}})))}o(e,"Stock/Indicators/DEMA/DEMAIndicator.js",[e["Core/Series/SeriesRegistry.js"],e["Core/Utilities.js"]],function(t,e){var o,r=this&&this.__extends||(o=function(t,e){return(o=Object.setPrototypeOf||({__proto__:[]})instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var o in e)Object.prototype.hasOwnProperty.call(e,o)&&(t[o]=e[o])})(t,e)},function(t,e){if("function"!=typeof e&&null!==e)throw TypeError("Class extends value "+String(e)+" is not a constructor or null");function r(){this.constructor=t}o(t,e),t.prototype=null===e?Object.create(e):(r.prototype=e.prototype,new r)}),n=t.seriesTypes.ema,i=e.correctFloat,s=e.isArray,a=e.merge,u=function(t){function e(){return null!==t&&t.apply(this,arguments)||this}return r(e,t),e.prototype.getEMA=function(e,o,r,n,i,s){return t.prototype.calculateEma.call(this,s||[],e,void 0===i?1:i,this.EMApercent,o,void 0===n?-1:n,r)},e.prototype.getValues=function(e,o){var r,n,a,u,c,p=o.period,l=[],h=2*p,d=e.xData,f=e.yData,y=f?f.length:0,m=[],g=[],v=[],E=0,_=0,j=-1,A=0;if(this.EMApercent=2/(p+1),!(y<2*p-1)){for(s(f[0])&&(j=o.index?o.index:0),A=(E=t.prototype.accumulatePeriodPoints.call(this,p,j,f))/p,E=0,u=p;u<y+2;u++)u<y+1&&(_=this.getEMA(f,n,A,j,u)[1],l.push(_)),n=_,u<h?E+=_:(u===h&&(A=E/p),_=l[u-p-1],r=this.getEMA([_],a,A)[1],c=[d[u-2],i(2*_-r)],m.push(c),g.push(c[0]),v.push(c[1]),a=r);return{values:m,xData:g,yData:v}}},e.defaultOptions=a(n.defaultOptions),e}(n);return t.registerSeriesType("dema",u),u}),o(e,"masters/indicators/dema.src.js",[e["Core/Globals.js"]],function(t){return t})});