const SATELLITE_STYLE = {
  version: 8,
  sources: {
    esri_sat: {
      type: 'raster',
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
      tileSize: 256,
      maxzoom: 19,
      attribution: '© Esri',
    },
  },
  layers: [{ id: 'esri-sat', type: 'raster', source: 'esri_sat' }],
}

const ESRITOPO_STYLE = {
  version: 8,
  sources: {
    esri_topo: {
      type: 'raster',
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}'],
      tileSize: 256,
      maxzoom: 19,
      attribution: '© Esri',
    },
  },
  layers: [{ id: 'esri-topo', type: 'raster', source: 'esri_topo' }],
}

export const MAP_STYLES = {
  liberty:   { label: 'Standart',  url: 'https://tiles.openfreemap.org/styles/liberty' },
  bright:    { label: 'Açık',      url: 'https://tiles.openfreemap.org/styles/bright' },
  topo:      { label: 'Topo',      url: 'https://tiles.openfreemap.org/styles/positron' },
  dark:      { label: 'Koyu',      url: 'https://tiles.openfreemap.org/styles/dark' },
  satellite: { label: 'Uydu',      url: SATELLITE_STYLE },
  voyager:   { label: 'Voyager',   url: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json' },
  esritopo:  { label: 'Topo+',     url: ESRITOPO_STYLE },
  cartodark: { label: 'Koyu+',     url: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json' },
  threed:    { label: '3D',        url: 'https://tiles.openfreemap.org/styles/liberty', pitch: 45 },
}

export const PIN_COLORS = [
  '#4d8ef5', '#34d9a0', '#f5834d',
  '#c97cf5', '#f5d94d', '#f55f9a', '#5ff5c4',
]

export const PIN_NAMES = [
  'Alfa', 'Beta', 'Gama', 'Delta', 'Epsilon',
  'Zeta', 'Eta', 'Teta', 'İota', 'Kappa',
]

export const TURKEY_CENTER = [35.0, 39.0]
export const TURKEY_ZOOM   = 5.5

export const DRAW_LAYER_ID   = 'draw-layer'
export const DRAW_SOURCE_ID  = 'draw-src'
export const MEASURE_LAYER_ID  = 'measure-layer'
export const MEASURE_SOURCE_ID = 'measure-src'
export const POLYGON_SOURCE_ID  = 'polygon-src'
export const POLYGON_FILL_ID    = 'polygon-fill'
export const POLYGON_OUTLINE_ID = 'polygon-outline'
