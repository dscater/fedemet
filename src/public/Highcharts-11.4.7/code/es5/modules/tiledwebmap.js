!/**
 * Highcharts JS v11.4.7 (2024-08-14)
 *
 * (c) 2009-2024
 *
 * License: www.highcharts.com/license
 */function(e){"object"==typeof module&&module.exports?(e.default=e,module.exports=e):"function"==typeof define&&define.amd?define("highcharts/modules/tiledwebmap",["highcharts"],function(t){return e(t),e.Highcharts=t,e}):e("undefined"!=typeof Highcharts?Highcharts:void 0)}(function(e){"use strict";var t=e?e._modules:{};function o(t,o,r,i){t.hasOwnProperty(o)||(t[o]=i.apply(null,r),"function"==typeof CustomEvent&&e.win.dispatchEvent(new CustomEvent("HighchartsModuleLoaded",{detail:{path:o,module:t[o]}})))}o(t,"Maps/TilesProviders/OpenStreetMap.js",[],function(){return function(){this.defaultCredits='Map data &copy2023 <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',this.initialProjectionName="WebMercator",this.subdomains=["a","b","c"],this.themes={Standard:{url:"https://tile.openstreetmap.org/{zoom}/{x}/{y}.png",minZoom:0,maxZoom:19},Hot:{url:"https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",minZoom:0,maxZoom:19},OpenTopoMap:{url:"https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",minZoom:0,maxZoom:17,credits:'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">\n                OpenStreetMap</a> contributors, <a href="https://viewfinderpanoramas.org">SRTM</a> \n                | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> \n                (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'}}}}),o(t,"Maps/TilesProviders/Stamen.js",[],function(){return function(){this.defaultCredits='&copy; Map tiles by <a href="https://stamen.com">Stamen Design</a>, under <a href="https://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="https://openstreetmap.org">OpenStreetMap</a>, under <a href="https://www.openstreetmap.org/copyright">ODbL</a>',this.initialProjectionName="WebMercator",this.subdomains=["a","b","c","d"],this.themes={Toner:{url:"https://stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}.png",minZoom:0,maxZoom:20},TonerBackground:{url:"https://stamen-tiles-{s}.a.ssl.fastly.net/toner-background/{z}/{x}/{y}.png",minZoom:0,maxZoom:20},TonerLite:{url:"https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}.png",minZoom:0,maxZoom:20},Terrain:{url:"https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.png",minZoom:0,maxZoom:18},TerrainBackground:{url:"https://stamen-tiles-{s}.a.ssl.fastly.net/terrain-background/{z}/{x}/{y}.png",minZoom:0,maxZoom:18},Watercolor:{url:"https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.png",minZoom:1,maxZoom:16,credits:'&copy Map tiles by <a href="https://stamen.com">Stamen Design</a>, under <a href="https://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="https://openstreetmap.org">OpenStreetMap</a>, under <a href="https://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>'}}}}),o(t,"Maps/TilesProviders/LimaLabs.js",[],function(){return function(){this.defaultCredits='Map data &copy;2023 <a href="https://maps.lima-labs.com/">LimaLabs</a>',this.initialProjectionName="WebMercator",this.requiresApiKey=!0,this.themes={Standard:{url:"https://cdn.lima-labs.com/{zoom}/{x}/{y}.png?api={apikey}",minZoom:0,maxZoom:20}}}}),o(t,"Maps/TilesProviders/Thunderforest.js",[],function(){return function(){this.defaultCredits='Maps &copy <a href="https://www.thunderforest.com">Thunderforest</a>, Data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',this.initialProjectionName="WebMercator",this.requiresApiKey=!0,this.subdomains=["a","b","c"],this.themes={OpenCycleMap:{url:"https://{s}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png?apikey={apikey}",minZoom:0,maxZoom:22},Transport:{url:"https://{s}.tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey={apikey}",minZoom:0,maxZoom:22},TransportDark:{url:"https://{s}.tile.thunderforest.com/transport-dark/{z}/{x}/{y}.png?apikey={apikey}",minZoom:0,maxZoom:22},SpinalMap:{url:"https://{s}.tile.thunderforest.com/spinal-map/{z}/{x}/{y}.png?apikey={apikey}",minZoom:0,maxZoom:22},Landscape:{url:"https://{s}.tile.thunderforest.com/landscape/{z}/{x}/{y}.png?apikey={apikey}",minZoom:0,maxZoom:22},Outdoors:{url:"https://{s}.tile.thunderforest.com/outdoors/{z}/{x}/{y}.png?apikey={apikey}",minZoom:0,maxZoom:22},Pioneer:{url:"https://{s}.tile.thunderforest.com/pioneer/{z}/{x}/{y}.png?apikey={apikey}",minZoom:0,maxZoom:22},MobileAtlas:{url:"https://{s}.tile.thunderforest.com/mobile-atlas/{z}/{x}/{y}.png?apikey={apikey}",minZoom:0,maxZoom:22},Neighbourhood:{url:"https://{s}.tile.thunderforest.com/neighbourhood/{z}/{x}/{y}.png?apikey={apikey}",minZoom:0,maxZoom:22}}}}),o(t,"Maps/TilesProviders/Esri.js",[],function(){return function(){this.defaultCredits="Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS,  Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012",this.initialProjectionName="WebMercator",this.themes={WorldStreetMap:{url:"https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",minZoom:0,maxZoom:20},DeLorme:{url:"https://server.arcgisonline.com/ArcGIS/rest/services/Specialty/DeLorme_World_Base_Map/MapServer/tile/{z}/{y}/{x}",minZoom:1,maxZoom:11,credits:"Tiles &copy; Esri &mdash; Copyright: &copy;2012 DeLorme"},WorldTopoMap:{url:"https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",minZoom:0,maxZoom:20,credits:"Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community"},WorldImagery:{url:"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",minZoom:0,maxZoom:20,credits:"Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"},WorldTerrain:{url:"https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}",minZoom:0,maxZoom:13,credits:"Tiles &copy; Esri &mdash; Source: USGS, Esri, TANA, DeLorme, and NPS"},WorldShadedRelief:{url:"https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}",minZoom:0,maxZoom:13,credits:"Tiles &copy; Esri &mdash; Source: Esri"},WorldPhysical:{url:"https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}",minZoom:0,maxZoom:8,credits:"Tiles &copy; Esri &mdash; Source: US National Park Service"},NatGeoWorldMap:{url:"https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}",minZoom:0,maxZoom:16,credits:"Tiles &copy; Esri &mdash; National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC"},WorldGrayCanvas:{url:"https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",minZoom:0,maxZoom:16,credits:"Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ"}}}}),o(t,"Maps/TilesProviders/USGS.js",[],function(){return function(){this.defaultCredits='Tiles courtesy of the <a href="https://usgs.gov/">U.S. GeologicalSurvey</a>',this.initialProjectionName="WebMercator",this.themes={USTopo:{url:"https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}",minZoom:0,maxZoom:20},USImagery:{url:"https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}",minZoom:0,maxZoom:20},USImageryTopo:{url:"https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryTopo/MapServer/tile/{z}/{y}/{x}",minZoom:0,maxZoom:20}}}}),o(t,"Maps/TilesProviders/TilesProviderRegistry.js",[t["Maps/TilesProviders/OpenStreetMap.js"],t["Maps/TilesProviders/Stamen.js"],t["Maps/TilesProviders/LimaLabs.js"],t["Maps/TilesProviders/Thunderforest.js"],t["Maps/TilesProviders/Esri.js"],t["Maps/TilesProviders/USGS.js"]],function(e,t,o,r,i,a){return{Esri:i,LimaLabs:o,OpenStreetMap:e,Stamen:t,Thunderforest:r,USGS:a}}),o(t,"Series/TiledWebMap/TiledWebMapSeriesDefaults.js",[],function(){return{states:{inactive:{enabled:!1}}}}),o(t,"Series/TiledWebMap/TiledWebMapSeries.js",[t["Core/Globals.js"],t["Core/Series/SeriesRegistry.js"],t["Maps/TilesProviders/TilesProviderRegistry.js"],t["Series/TiledWebMap/TiledWebMapSeriesDefaults.js"],t["Core/Utilities.js"]],function(e,t,o,r,i){var a,s=this&&this.__extends||(a=function(e,t){return(a=Object.setPrototypeOf||({__proto__:[]})instanceof Array&&function(e,t){e.__proto__=t}||function(e,t){for(var o in t)Object.prototype.hasOwnProperty.call(t,o)&&(e[o]=t[o])})(e,t)},function(e,t){if("function"!=typeof t&&null!==t)throw TypeError("Class extends value "+String(t)+" is not a constructor or null");function o(){this.constructor=e}a(e,t),e.prototype=null===t?Object.create(t):(o.prototype=t.prototype,new o)}),n=e.composed,p=t.seriesTypes.map,l=i.addEvent,m=i.defined,c=i.error,d=i.merge,h=i.pick,u=i.pushUnique;function y(e){var t=e.geoBounds,r=(e.chart.options.series||[]).filter(function(e){return"tiledwebmap"===e.type})[0];if(r&&r.provider&&r.provider.type&&!r.provider.url){var i=o[r.provider.type];if(m(i)){var a=new i().initialProjectionName;if(t){var s=t.x1,n=t.y1,p=t.x2,l=t.y2;this.recommendedMapView={projection:{name:a,parallels:[n,l],rotation:[-(s+p)/2]}}}else this.recommendedMapView={projection:{name:a},minZoom:0};return!1}c("Highcharts warning: Tiles Provider not defined in the Provider Registry.",!1)}return!0}var f=function(e){function t(){var t=null!==e&&e.apply(this,arguments)||this;return t.redrawTiles=!1,t.isAnimating=!1,t}return s(t,e),t.compose=function(e){u(n,"TiledWebMapSeries")&&l(e,"onRecommendMapView",y)},t.prototype.lonLatToTile=function(e,t){var o=e.lon,r=e.lat;return{x:Math.floor((o+180)/360*Math.pow(2,t)),y:Math.floor((1-Math.log(Math.tan(r*Math.PI/180)+1/Math.cos(r*Math.PI/180))/Math.PI)/2*Math.pow(2,t))}},t.prototype.tileToLonLat=function(e,t,o){var r=e/Math.pow(2,o)*360-180,i=Math.PI-2*Math.PI*t/Math.pow(2,o);return{lon:r,lat:180/Math.PI*Math.atan(.5*(Math.exp(i)-Math.exp(-i)))}},t.prototype.drawPoints=function(){var e,t=this.chart,r=t.mapView;if(r){var i=this.tiles=this.tiles||{},a=this.transformGroups=this.transformGroups||[],s=this,n=this.options.provider,p=r.zoom,l=h(r.projection.options.rotation&&r.projection.options.rotation[0],0),d=t.renderer.forExport?0:200,u=function(e){for(var t=function(t){parseFloat(t)===(r.zoom<0?0:Math.floor(r.zoom))||s.minZoom&&(r.zoom<0?0:Math.floor(r.zoom))<s.minZoom&&parseFloat(t)===s.minZoom||s.maxZoom&&(r.zoom<0?0:Math.floor(r.zoom))>s.maxZoom&&parseFloat(t)===s.maxZoom?Object.keys(i[t].tiles).forEach(function(o,r){i[t].tiles[o].animate({opacity:1},{duration:e},function(){r===Object.keys(i[t].tiles).length-1&&(i[t].isActive=!0)})}):Object.keys(i[t].tiles).forEach(function(o,r){i[t].tiles[o].animate({opacity:0},{duration:e,defer:e/2},function(){i[t].tiles[o].destroy(),delete i[t].tiles[o],r===Object.keys(i[t].tiles).length-1&&(i[t].isActive=!1,i[t].loaded=!1)})})},o=0,a=Object.keys(i);o<a.length;o++)t(a[o])},y=p<0?0:Math.floor(p),f=Math.pow(2,y),g=.638436911716859*Math.pow(2,p)/(.638436911716859*Math.pow(2,y)),v=256*g;if(n&&(n.type||n.url)){if(n.type&&!n.url){var M=o[n.type];if(!m(M)){c("Highcharts warning: Tiles Provider '"+n.type+"' not defined in the ProviderRegistry.",!1);return}var T=new M,x=T.initialProjectionName,S=void 0,b="";if(n.theme&&m(T.themes[n.theme]))S=T.themes[n.theme];else{var Z=Object.keys(T.themes)[0];S=T.themes[Z],c("Highcharts warning: The Tiles Provider's Theme '"+n.theme+"' is not defined in the Provider definition - falling back to '"+Z+"'.",!1)}n.subdomain&&T.subdomains&&-1!==T.subdomains.indexOf(n.subdomain)?b=n.subdomain:m(T.subdomains)&&-1!==S.url.indexOf("{s}")&&(b=h(T.subdomains&&T.subdomains[0],""),c("Highcharts warning: The Tiles Provider's Subdomain '"+n.subdomain+"' is not defined in the Provider definition - falling back to '"+b+"'.",!1)),T.requiresApiKey&&(n.apiKey?S.url=S.url.replace("{apikey}",n.apiKey):(c("Highcharts warning: The Tiles Provider requires API Key to use tiles, use provider.apiKey to provide a token.",!1),S.url=S.url.replace("?apikey={apikey}",""))),n.url=S.url.replace("{s}",b),this.minZoom=S.minZoom,this.maxZoom=S.maxZoom;var w=h(t.userOptions.credits&&t.userOptions.credits.text,"Highcharts.com "+h(S.credits,T.defaultCredits));t.credits?t.credits.update({text:w}):t.addCredits({text:w,style:h(null===(e=t.options.credits)||void 0===e?void 0:e.style,{})}),r.projection.options.name!==x&&c("Highcharts warning: The set projection is different than supported by Tiles Provider.",!1)}else r.projection.options.name||c("Highcharts warning: The set projection is different than supported by Tiles Provider.",!1);if(m(this.minZoom)&&y<this.minZoom?(f=Math.pow(2,y=this.minZoom),v=256*(g=.638436911716859*Math.pow(2,p)/(.638436911716859*Math.pow(2,y)))):m(this.maxZoom)&&y>this.maxZoom&&(f=Math.pow(2,y=this.maxZoom),v=256*(g=.638436911716859*Math.pow(2,p)/(.638436911716859*Math.pow(2,y)))),r.projection&&r.projection.def){r.projection.hasCoordinates=!0,a[y]||(a[y]=t.renderer.g().add(this.group));var j=function(e,o,p,l,m){var c=e%f,h=o%f,y=c<0?c+f:c,g=h<0?h+f:h;if(!i["".concat(p)].tiles["".concat(e,",").concat(o)]&&n.url){var M=n.url.replace("{x}",y.toString()).replace("{y}",g.toString()).replace("{zoom}",p.toString()).replace("{z}",p.toString());i[p].loaded=!1,i["".concat(p)].tiles["".concat(e,",").concat(o)]=t.renderer.image(M,e*v-l,o*v-m,v,v).attr({zIndex:2,opacity:0}).on("load",function(){n.onload&&n.onload.apply(this),(p===(r.zoom<0?0:Math.floor(r.zoom))||p===s.minZoom)&&(i["".concat(p)].actualTilesCount++,i["".concat(p)].howManyTiles===i["".concat(p)].actualTilesCount&&(i[p].loaded=!0,s.isAnimating?s.redrawTiles=!0:(s.redrawTiles=!1,u(d)),i["".concat(p)].actualTilesCount=0))}).add(a[p]),i["".concat(p)].tiles["".concat(e,",").concat(o)].posX=e,i["".concat(p)].tiles["".concat(e,",").concat(o)].posY=o,i["".concat(p)].tiles["".concat(e,",").concat(o)].originalURL=M}},P=r.pixelsToProjectedUnits({x:0,y:0}),C=r.projection.def.inverse([P.x,P.y]),E={lon:C[0]-l,lat:C[1]},k=r.pixelsToProjectedUnits({x:t.plotWidth,y:t.plotHeight}),A=r.projection.def.inverse([k.x,k.y]),z={lon:A[0]-l,lat:A[1]};(E.lat>r.projection.maxLatitude||z.lat<-1*r.projection.maxLatitude)&&(E.lat=r.projection.maxLatitude,z.lat=-1*r.projection.maxLatitude);var O=this.lonLatToTile(E,y),G=this.lonLatToTile(z,y),L=this.tileToLonLat(O.x,O.y,y),N=r.projection.def.forward([L.lon+l,L.lat]),W=r.projectedUnitsToPixels({x:N[0],y:N[1]}),I=O.x*v-W.x,_=O.y*v-W.y;i["".concat(y)]||(i["".concat(y)]={tiles:{},isActive:!1,howManyTiles:0,actualTilesCount:0,loaded:!1}),i["".concat(y)].howManyTiles=(G.x-O.x+1)*(G.y-O.y+1),i["".concat(y)].actualTilesCount=0;for(var U=O.x;U<=G.x;U++)for(var R=O.y;R<=G.y;R++)j(U,R,y,I,_)}for(var D=function(e){for(var o=function(o){if(r.projection&&r.projection.def){var a=256*(.638436911716859*Math.pow(2,p)/(.638436911716859*Math.pow(2,parseFloat(e)))),n=i[e].tiles[Object.keys(i[e].tiles)[0]],c=i[e].tiles[o],h=c.posX,f=c.posY;if(m(h)&&m(f)&&m(n.posX)&&m(n.posY)){var g=H.tileToLonLat(n.posX,n.posY,parseFloat(e)),v=r.projection.def.forward([g.lon+l,g.lat]),M=r.projectedUnitsToPixels({x:v[0],y:v[1]}),T=n.posX*a-M.x,x=n.posY*a-M.y;if(t.renderer.globalAnimation&&t.hasRendered){var S=Number(i[e].tiles[o].attr("x")),b=Number(i[e].tiles[o].attr("y")),Z=Number(i[e].tiles[o].attr("width")),w=Number(i[e].tiles[o].attr("height"));s.isAnimating=!0,i[e].tiles[o].attr({animator:0}).animate({animator:1},{step:function(t,r){i[e].tiles[o].attr({x:S+(h*a-T-S)*r.pos,y:b+(f*a-x-b)*r.pos,width:Z+(Math.ceil(a)+1-Z)*r.pos,height:w+(Math.ceil(a)+1-w)*r.pos})}},function(){s.isAnimating=!1,s.redrawTiles&&(s.redrawTiles=!1,u(d))})}else(s.redrawTiles||parseFloat(e)!==y||(i[e].isActive||parseFloat(e)===y)&&Object.keys(i[e].tiles).map(function(t){return i[e].tiles[t]}).some(function(e){return 0===e.opacity}))&&(s.redrawTiles=!1,u(d)),i[e].tiles[o].attr({x:h*a-T,y:f*a-x,width:Math.ceil(a)+1,height:Math.ceil(a)+1})}}},a=0,n=Object.keys(i[e].tiles);a<n.length;a++)o(n[a])},H=this,B=0,V=Object.keys(i);B<V.length;B++)D(V[B])}else c("Highcharts warning: Tiles Provider not defined in the Provider Registry.",!1)}},t.prototype.update=function(){var t,r=this.transformGroups,i=this.chart,a=i.mapView,s=arguments[0],n=s.provider;if(r&&(r.forEach(function(e){0!==Object.keys(e).length&&e.destroy()}),this.transformGroups=[]),a&&!m(null===(t=i.userOptions.mapView)||void 0===t?void 0:t.projection)&&n&&n.type){var p=o[n.type];if(p){var l=new p().initialProjectionName;a.update({projection:{name:l}})}}e.prototype.update.apply(this,arguments)},t.defaultOptions=d(p.defaultOptions,r),t}(p);return t.registerSeriesType("tiledwebmap",f),f}),o(t,"masters/modules/tiledwebmap.src.js",[t["Core/Globals.js"],t["Maps/TilesProviders/TilesProviderRegistry.js"],t["Series/TiledWebMap/TiledWebMapSeries.js"]],function(e,t,o){return e.TilesProviderRegistry=e.TilesProviderRegistry||t,o.compose(e.MapView),e})});