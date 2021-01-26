var map = null;
var start = null;
var end = null;
var route_id = 'route';

$(document).ready(function () {
    mapboxgl.accessToken = settings.mapboxgl_token;

    map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/adeelkhalil/ckkea5qqt042417ruetu1p4eq',
        center: [-97.29885, 35.40382],
        zoom: 8
    });

    map.addControl(
        new MapboxGeocoder({
            accessToken: settings.mapboxgl_token,
            mapboxgl: mapboxgl
        })
    );
    map.addControl(new mapboxgl.NavigationControl());

    map.on('load', function () {
        load_geojson_with_custom_icon({
            icon_url: 'assets/img/custom_marker.png',
            point_geojson: point_geojson,
            source_id: 'points',
            layer_id: 'points',
            icon_id: 'source-image'
        });
    });

    map.on('click', function (e) {
        var coords = e.lngLat;

        var is_start_active = $(".route-start-btn").hasClass("active");
        var is_end_active = $(".route-end-btn").hasClass("active");

        if (is_start_active) {
            start = [coords.lng, coords.lat];
            add_route_point(start, true)
        }
        if (is_end_active) {
            end = [coords.lng, coords.lat];
            add_route_point(end, false)
        }

        if (start && end) {
            if ($("#mapbox").hasClass("active")) {
                getRouteMapbox(map, start, end, route_id);
            } else if ($("#graphhopper").hasClass("active")) {
                getRouteGraphhopper(map, start, end, route_id);
            }
        }

        if (is_start_active || is_end_active) {
            return;
        }
        search_foursquare({
            client_id: settings.forsquare.client_id,
            client_secret: settings.forsquare.client_secret,
            v: 20180323,
            limit: 1,
            ll: coords.lat + ',' + coords.lng
        }, function (data) {
            var items = data.response.groups[0].items;
            var html = "<h4>Foursquare</h4>";
            if (items.length) {
                var venue = items[0].venue;
                if (venue.name) {
                    html += "<p class='m-0'><span>Name:</span> <span><strong>" + venue.name + "</span></strong></p>";
                    var location = venue.location;
                    Object.keys(location).forEach(function (loc_key) {
                        var loc = location[loc_key];
                        if (typeof loc !== 'object' && loc !== null) {
                            html += "<p class='m-0'><span>" + loc_key + ":</span> <span><strong>" + loc + "</span></strong></p>";
                        }
                    });
                } else {
                    html += "<p class='m-0'>No data...</p>";
                }
            } else {
                html += "<p class='m-0'>No data found...</p>";
            }
            search_wikimapia({
                key: settings.wikimapia_key,
                function_name: 'place.getnearest',
                format: 'json',
                language: 'en',
                lat: coords.lat,
                lon: coords.lng
            }, function (res) {
                if (html) {
                    html += "<div class='border-top my-2'></div>";
                }
                html += "<h4>Wikimapia</h4>";
                if (res.title) {
                    html += "<p class='m-0'><span>Title:</span> <span><strong>" + res.title + "</span></strong></p>";
                } else {
                    html += "<p class='m-0'>No data found...</p>";
                }
                new mapboxgl.Popup({ closeButton: false })
                    .setLngLat(coords)
                    .setHTML(html)
                    .addTo(map);
            });
        });
    });

});


function load_geojson_with_custom_icon(options) {
    map.loadImage(options.icon_url, function (error, image) {
        if (error) throw error;
        map.addImage(options.icon_id, image);
        // Add a GeoJSON source with 2 points
        map.addSource(options.source_id, options.point_geojson);

        // Add a symbol layer
        map.addLayer({
            'id': options.layer_id,
            'type': 'symbol',
            'source': options.source_id,
            'layout': {
                'icon-image': options.icon_id,
                // get the title name from the source's "title" property
                'text-field': ['get', options.text_field ? options.text_field : 'title'],
                'text-font': [
                    'Open Sans Semibold',
                    'Arial Unicode MS Bold'
                ],
                'text-offset': [0, 1.25],
                'text-anchor': 'top'
            }
        });
    }
    );
}

function search_wikimapia(params, success_func) {
    var url = "http://api.wikimapia.org/?function=" + params.function_name;

    Object.keys(params).forEach(function (key) { url += "&" + key + "=" + params[key]; });

    $.ajax({
        url: url,
        crossDomain: true,
        success: function (res) {
            success_func(res);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.log(errorThrown);
        }
    });
}

function search_foursquare(params, success_func) {
    var url = "https://api.foursquare.com/v2/venues/explore?";

    Object.keys(params).forEach(function (key) { url += "&" + key + "=" + params[key]; });

    $.ajax({
        url: url,
        crossDomain: true,
        success: function (res) {
            success_func(res);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.log(errorThrown);
        }
    });
}

function add_route_point(coords, is_start) {
    var poi_id = is_start ? 'start' : 'end';
    var poi = {
        type: 'FeatureCollection',
        features: [{
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'Point',
                coordinates: coords
            }
        }
        ]
    };
    if (map.getLayer(poi_id)) {
        map.getSource(poi_id).setData(poi);
    } else {
        map.addLayer({
            id: poi_id,
            type: 'circle',
            source: {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: [{
                        type: 'Feature',
                        properties: {},
                        geometry: {
                            type: 'Point',
                            coordinates: coords
                        }
                    }]
                }
            },
            paint: {
                'circle-radius': 10,
                'circle-color': is_start ? '#3887be' : '#f30'
            }
        });
    }
}

$(".direction-services button").on("click", function (e) {
    $(".direction-services button").removeClass("active");
    $(this).addClass("active");
    if ($(this).hasClass("route-cancel-btn")) {
        map.removeLayer('start');
        map.removeSource('start');
        map.removeLayer('end');
        map.removeSource('end');
        map.removeLayer(route_id);
        map.removeSource(route_id);
        start = null;
        end = null;
    }
});

$(".direction-service-toggle span").on("click", function (e) {
    $(".direction-service-toggle span").removeClass("active");
    $(this).addClass("active");
});
