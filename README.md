# Leaflet.Canvas-Markers-with-Title

!DEVELOPPING!

This is an altered version of [Leaflet.Canvas-Markers](https://github.com/eJuke/Leaflet.Canvas-Markers),
with **addible custom title** and fix some known bugs.

## Installation

```shell
npm i --save leaflet-canvas-markers-with-title
```

```js
import L from "leaflet";
import "leaflet-canvas-markers-with-title";
```

## Initialization

```ts
const map = L.Map( ... );

const markerLayer = L.canvasIconLayer().addTo(map);
```

## Add a Title

```ts
const marker = L.marker( ... );

markerLayer.addMarker(
  marker,
  'I am a marker',
  {
    normal: {
      font: '20px serif',
      color: '#114514',
      borderColor: 'black',
      borderWidth: 1
    }
  },
  'marker1'
);
```

## Add Events

```ts
const onMarkerLayerClick = (
  listener: any,
  ret: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    data: any;
    title: string;
    titleOpt: string;
    additional: any;
  }
) => {
  // ...
};

const onMarkerLayerHover = (
  listener: any,
  ret: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    data: any;
    title: string;
    titleOpt: string;
    additional: any;
  }
) => {
  // ...
};

markerLayer.addOnClickListener(onMarkerLayerClick);
markerLayer.addOnHoverListener(onMarkerLayerHover);
```

## Structure of options:

```ts
markerLayer.addMarker(
  marker: L.Marker,
  title: string,
  titleOpt: MarkerTitleOpt,
  additional?: any,         // Unique data that can be used as a primary id, I'll be returned when click/hover event is called
)

interface MarkerTitleOpt {
  normal: MarkerTitleStyle;
  hover?: MarkerTitleStyle;   // unavailable by now, but show an underline while hovering
  active?: MarkerTitleStyle;  // unavailable by now
}

interface MarkerTitleStyle {
  font?: string;        // Same as 'font' parameter in canvas (or css?)
  color?: string;
  borderColor?: string;
  borderWidth?: number;
}
```

## Typescript

Create `@types\leaflet-canvas-markers-with-title\` folder under `src` and put `index.d.ts` in it, with contents:

```ts
import "leaflet";

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

declare module "leaflet" {
  export class CanvasIconLayer extends Layer {
    addTo(map: Map | LayerGroup): this;
    addMarker(
      marker: Marker,
      title: string,
      titleOpt: MarkerTitleOpt,
      additional?: any
    ): void;
    addMarkers(
      markers: Array<Marker>,
      title: string,
      titleOpt: MarkerTitleOpt,
      additional?: any
    ): void;
    getBounds(): LatLngBounds;
    redraw(): void;
    clear(): void;
    clearLayers(): void;
    removeMarker(marker: Marker): void;
    addOnClickListener: (
      eventHandler: (
        listener: any,
        ret: {
          minX: number;
          minY: number;
          maxX: number;
          maxY: number;
          data: any;
          title: string;
          titleOpt: string;
          additional: any;
        }
      ) => void
    ) => void;
    addOnHoverListener: (
      eventHandler: (
        listener: any,
        ret: {
          minX: number;
          minY: number;
          maxX: number;
          maxY: number;
          data: any;
          title: string;
          titleOpt: string;
          additional: any;
        }
      ) => void
    ) => void;
  }
  function canvasIconLayer(): CanvasIconLayer;
}
```
