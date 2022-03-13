# Leaflet.Canvas-Markers-with-Title

!DEVELOPPING!

This is an altered version of [Leaflet.Canvas-Markers](https://github.com/eJuke/Leaflet.Canvas-Markers),
with **addible custom title** and fix some known bugs.
 

## Install

```shell
npm i --save leaflet-canvas-markers-with-title
```

```js
import 'leaflet-canvas-markers-with-title';
```

## Add a Title

```ts
markerLayer.addMarker(
  marker: L.Marker,
  title: string,
  titleOpt: MarkerTitleOpt,
  additional?: any
)

interface MarkerTitleOpt {
  normal: MarkerTitleStyle;
  hover?: MarkerTitleStyle;
  active?: MarkerTitleStyle;
}

interface MarkerTitleStyle {
  font?: string;
  color?: string;
  borderColor?: string;
  borderWidth?: number;
}
```
## Typescript

Create `@types\leaflet-canvas-markers-with-title\` folder under `src` and put `index.d.ts` in it, with contents: 
```ts
import 'leaflet';

export interface MarkerTitleStyle {
  font?: string;
  color?: string;
  borderColor?: string;
  borderWidth?: number;
}

export interface MarkerTitleOpt {
  normal: MarkerTitleStyle;
  hover?: MarkerTitleStyle;
  active?: MarkerTitleStyle;
}

declare module 'leaflet' {
  export class CanvasIconLayer extends Layer {
    addTo(map: Map | LayerGroup): this;
    addMarker(marker: Marker, title: string, titleOpt: MarkerTitleOpt, additional?: any): void;
    addMarkers(markers: Array<Marker>, title: string, titleOpt: MarkerTitleOpt, additional?: any): void;
    getBounds(): LatLngBounds;
    redraw(): void;
    clear(): void;
    removeMarker(marker: Marker): void;
    addOnClickListener: (eventHandler: (listener: any, ret: any) => void) => void;
    addOnHoverListener: (eventHandler: (listener: any, ret: any) => void) => void;
  }
  function canvasIconLayer(): CanvasIconLayer;
}

```
