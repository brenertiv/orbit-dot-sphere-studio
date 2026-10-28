export const ranges = {
  "shapeRadius": {
    "label": "Outer radius",
    "min": 0.4,
    "max": 1.0,
    "step": 0.01
  },
  "shapeWidth": {
    "label": "Width \u00b7 X",
    "min": 0.25,
    "max": 1.5,
    "step": 0.05
  },
  "shapeHeight": {
    "label": "Height \u00b7 Y",
    "min": 0.25,
    "max": 1.5,
    "step": 0.05
  },
  "shapeDepth": {
    "label": "Depth \u00b7 Z",
    "min": 0.25,
    "max": 1.5,
    "step": 0.05
  },
  "tubeThickness": {
    "label": "Tube thickness",
    "min": 0.1,
    "max": 0.7,
    "step": 0.01
  },
  "tubeDepth": {
    "label": "Tube depth",
    "min": 0.25,
    "max": 1.0,
    "step": 0.05
  },
  "count": {
    "label": "Dots",
    "min": 100.0,
    "max": 1200.0,
    "step": 20.0
  },
  "size": {
    "label": "Dot size",
    "min": 0.7,
    "max": 4.0,
    "step": 0.1
  },
  "sizeVariation": {
    "label": "Size variation",
    "min": 0.0,
    "max": 1.0,
    "step": 0.05
  },
  "connections": {
    "label": "Connections",
    "min": 0.0,
    "max": 3.0,
    "step": 1.0
  },
  "lineOpacity": {
    "label": "Line opacity",
    "min": 0.0,
    "max": 0.45,
    "step": 0.01
  },
  "speed": {
    "label": "Rotation",
    "min": 0.0,
    "max": 0.8,
    "step": 0.01
  },
  "deformation": {
    "label": "Drift",
    "min": 0.0,
    "max": 0.3,
    "step": 0.01
  },
  "pulse": {
    "label": "Shimmer",
    "min": 0.0,
    "max": 0.5,
    "step": 0.01
  },
  "driftSpeed": {
    "label": "Drift speed",
    "min": 0.0,
    "max": 2.0,
    "step": 0.05
  },
  "pulseSpeed": {
    "label": "Shimmer speed",
    "min": 0.0,
    "max": 4.0,
    "step": 0.1
  },
  "breathing": {
    "label": "Breathing",
    "min": 0.0,
    "max": 0.2,
    "step": 0.01
  },
  "breathSpeed": {
    "label": "Breathing speed",
    "min": 0.0,
    "max": 2.0,
    "step": 0.05
  },
  "waveHeight": {
    "label": "Wave height",
    "min": 0.0,
    "max": 0.3,
    "step": 0.01
  },
  "waveFrequency": {
    "label": "Wave frequency",
    "min": 0.5,
    "max": 6.0,
    "step": 0.1
  },
  "waveSpeed": {
    "label": "Wave travel",
    "min": -2.0,
    "max": 2.0,
    "step": 0.05
  },
  "twist": {
    "label": "Twist",
    "min": -2.0,
    "max": 2.0,
    "step": 0.05
  },
  "depth": {
    "label": "Depth fade",
    "min": 0.0,
    "max": 1.0,
    "step": 0.01
  }
};
export const selects = {
  "shape": {
    "label": "Shape",
    "options": [
      [
        "sphere",
        "Sphere"
      ],
      [
        "ellipsoid",
        "Ellipsoid"
      ],
      [
        "torus",
        "Torus"
      ]
    ]
  },
  "distribution": {
    "label": "Arrangement",
    "options": [
      [
        "layered",
        "Layered constellation"
      ],
      [
        "shell",
        "Surface shell"
      ],
      [
        "cloud",
        "Filled volume"
      ]
    ]
  },
  "pattern": {
    "label": "Point pattern",
    "options": [
      [
        "random",
        "Random scatter"
      ],
      [
        "even",
        "Evenly spaced"
      ],
      [
        "rings",
        "Surface rings"
      ],
      [
        "spiral",
        "Spiral rows"
      ]
    ]
  },
  "axis": {
    "label": "Rotation axis",
    "options": [
      [
        "y",
        "Vertical \u00b7 Y axis"
      ],
      [
        "x",
        "Horizontal \u00b7 X axis"
      ],
      [
        "z",
        "Facing you \u00b7 Z axis"
      ],
      [
        "tumble",
        "Tumble \u00b7 X + Y"
      ]
    ]
  },
  "direction": {
    "label": "Direction",
    "options": [
      [
        "1",
        "Forward"
      ],
      [
        "-1",
        "Reverse"
      ]
    ]
  },
  "colorMode": {
    "label": "Color mode",
    "options": [
      [
        "palette",
        "Color palette"
      ],
      [
        "single",
        "Single color per theme"
      ]
    ]
  }
};
