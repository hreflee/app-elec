let markers = [];
let markerIndex = 0;
let markerMap = {};

let getMarker = function (id) {
  if (markerMap[id] === undefined) {
    markerMap[id] = markers[markerIndex++];
  }
  return markerMap[id];
};

getMarker.__proto__ = {
  init (symbols, colors) {
    markers = [];
    markerIndex = 0;
    markerMap = {};

    symbols.forEach(symbol => {
      colors.forEach(color => {
        markers.push({
          symbol,
          fillColor: color
        })
      });
    });
  }
};

export default getMarker;
