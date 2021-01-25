function getRouteMapbox(map, start, end, route_id) {
    var url = 'https://api.mapbox.com/directions/v5/mapbox/cycling/' + start[0] + ',' + start[1] + ';' + end[0] + ',' + end[1] + '?steps=true&geometries=geojson&access_token=' + settings.mapboxgl_token;

    // make an XHR request https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
    var req = new XMLHttpRequest();
    req.open('GET', url, true);
    req.onload = function () {
        var json = JSON.parse(req.response);
        var data = json.routes[0];
        var route = data.geometry.coordinates;
        var geojson = {
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'LineString',
                coordinates: route
            }
        };
        add_route_to_map(map, geojson, route_id);
    };
    req.send();
}


function getRouteGraphhopper(map, start, end, route_id) {

    var url = 'https://graphhopper.com/api/1/route?point=' + start[1] + ',' + start[0] + '&point=' + end[1] + ',' + end[0] + '&vehicle=car&type=json&points_encoded=false&key=' + settings.graphhopper_key;

    var req = new XMLHttpRequest();
    req.open('GET', url, true);
    req.onload = function () {
        var json = JSON.parse(req.response);
        var geojson = {
            type: 'Feature',
            properties: {},
            geometry: json.paths[0].points
        };
        add_route_to_map(map, geojson, route_id);
    };
    req.send();
}

function add_route_to_map(map, geojson, route_id) {
    if (map.getSource(route_id)) {
        map.getSource(route_id).setData(geojson);
    } else {
        map.addLayer({
            id: route_id,
            type: 'line',
            source: {
                type: 'geojson',
                data: geojson
            },
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-color': '#3887be',
                'line-width': 5,
                'line-opacity': 1
            }
        });
    }
}