export const calculateBoundsAndCenter = (geojson) => {
  if (!geojson || geojson.type !== "FeatureCollection") {
    throw new Error("Input must be a GeoJSON FeatureCollection");
  }

  let minX = Infinity,
    minY = Infinity;
  let maxX = -Infinity,
    maxY = -Infinity;

  let hasCoords = false;

  const updateBounds = (x, y) => {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
    hasCoords = true;
  };

  const processCoords = (geometry) => {
    if (!geometry) return;

    const { type, coordinates, geometries } = geometry;

    switch (type) {
      case "Point":
        // [lng, lat]
        {
          const [x, y] = coordinates;
          updateBounds(x, y);
        }
        break;

      case "MultiPoint":
      case "LineString":
        // [ [lng, lat], ... ]
        coordinates.forEach(([x, y]) => {
          updateBounds(x, y);
        });
        break;

      case "MultiLineString":
      case "Polygon":
        // [ [ [lng, lat], ... ], ... ]
        coordinates.forEach((lineOrRing) => {
          lineOrRing.forEach(([x, y]) => {
            updateBounds(x, y);
          });
        });
        break;

      case "MultiPolygon":
        // [ [ [ [lng, lat], ... ] ], ... ]
        coordinates.forEach((polygon) => {
          polygon.forEach((ring) => {
            ring.forEach(([x, y]) => {
              updateBounds(x, y);
            });
          });
        });
        break;

      case "GeometryCollection":
        // Phòng trường hợp có GeometryCollection
        geometries?.forEach((geom) => processCoords(geom));
        break;

      default:
        // Các type khác không xử lý
        break;
    }
  };

  geojson.features.forEach((feature) => {
    if (!feature.geometry) return;
    processCoords(feature.geometry);
  });

  if (!hasCoords) {
    throw new Error("No valid coordinates (Point/Line/Polygon) found");
  }

  const center = [
    (minX + maxX) / 2, // lng
    (minY + maxY) / 2, // lat
  ];

  return {
    minLng: minX,
    minLat: minY,
    maxLng: maxX,
    maxLat: maxY,
    boundsArray: [
      [minX, minY],
      [maxX, maxY],
    ],
    center, // [lng, lat]
  };
};
