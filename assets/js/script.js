var map, geocoder, service, request, image, infowindow, searchBox, topRated;
var markers = [];
var rating = [];
var arrPlaces = [];
var lodging = [];
var bars = [];
var museum = [];

function initMap() {
    geocoder = new google.maps.Geocoder();
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: -34.397, lng: 150.644 },
        zoom: 13
    });

    infowindow = new google.maps.InfoWindow();
    currentPosition();
    searchBoxF();
}

// Clear Markers
function clearOverlay() {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers.length = 0;

    lodging = [];
    bars = [];
    museum = [];

}

// Set current position on page load
function currentPosition() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
                var pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };

                map.setCenter(pos);
                search(pos);
            }, function() {
                handleLocationError(true, infoWindow, map.getCenter());
            },

        );
    }
    else {
        // Browser doesn't support Geolocation
        infoWindow.setPosition(map.getCenter());
    }
    //console.log(navigator.geolocation.clearWatch(pos));
}

// Headings for Recommended places
function headings(places) {
    $('#pop-places-bars').html('');
    $('#pop-places-lodging').html('');
    $('#pop-places-museum').html('');

    $('#pop-places-bars').append(`<h2>Popular Bars in ${places[0].name}</h2>`);
    $('#pop-places-lodging').append(`<h2>Popular Lodgings in ${places[0].name}</h2>`);
    setTimeout(function() {
        $('#pop-places-museum').append(`<h2>Popular Museums in ${places[0].name}</h2>`);
    }, 100);
}

function searchBoxF() {
    var input = document.getElementById('pac-input');
    searchBox = new google.maps.places.SearchBox(input);
    var placeId;

    searchBoxAddListener(input, searchBox);

}

// Related to searchBoxF()
// Listen for the event fired when the user selects a prediction and retrieve more details for that place.
function searchBoxAddListener(input, searchBox) {
    searchBox.addListener('places_changed', function() {
        var places = searchBox.getPlaces();
        placeId = places[0].place_id;
        var pos = {
            lat: places[0].geometry.location.lat(),
            lng: places[0].geometry.location.lng()
        };

        if (places.length == 0) {
            return;
        }

        search(pos);
        clearOverlay();

        // For each place, get the icon, name and location.
        var bounds = new google.maps.LatLngBounds();

        placesForEach(places, pos, bounds);

        map.fitBounds(bounds);

        setTimeout(function() {
            sortByRating();
        }, 1000);

        // Headings for Recommended places
        headings(places);

    });
}

// Related to searchBoxF() -> searchBoxAddListener(input, searchBox)
// For each place, get the icon, name and location.
function placesForEach(places, pos, bounds) {
    places.forEach(function(place) {
        if (!place.geometry) {
            console.log("Returned place contains no geometry");
            return;
        }
        service = new google.maps.places.PlacesService(map);
        service.nearbySearch({ location: pos, radius: 50000, type: ['bar'] }, nearbySearchCallback);
        service.nearbySearch({ location: pos, radius: 50000, type: ['lodging'] }, nearbySearchCallback);
        service.nearbySearch({ location: pos, radius: 50000, type: ['museum'] }, nearbySearchCallback);
        createMarker(place);

        if (place.geometry.viewport) {
            // Only geocodes have viewport.
            bounds.union(place.geometry.viewport);
        }
        else {
            bounds.extend(place.geometry.location);
        }

    });
}

// Related to searchBoxF() -> searchBoxAddListener(input, searchBox) -> placesForEach(places, pos, bounds, searchBox)
function nearbySearchCallback(results, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {

        for (var i = 0; i < results.length; i++) {
            if (results[i].photos == undefined) { continue; }
            if (results[i].rating == undefined) { continue; }
            for (var j = 0; j < results[i].types.length; j++) {
                if (results[i].types[j] === 'lodging') {
                    lodging.push(results[i]);
                }
                else if (results[i].types[j] === 'bar') {
                    bars.push(results[i]);
                }
                else if (results[i].types[j] === 'museum') {
                    museum.push(results[i]);
                }
            }
        }
    }
}

function sortByRating() {

    lodging.sort(function(a, b) {
        return b.rating - a.rating;
    });
    bars.sort(function(a, b) {
        return b.rating - a.rating;
    });
    museum.sort(function(a, b) {
        return b.rating - a.rating;
    });
    for (var i = 0; i < 4; i++) {
        createRecomendationPlaces(bars[i], lodging[i], museum[i]);
    }

    clickClass();
}


// Related to searchBoxF() -> searchBoxAddListener(input, searchBox) -> placesForEach(places, pos, bounds, searchBox) -> nearbySearchCallback(results, status)
function createRecomendationPlaces(recomBars, recomLodging, recomMuseum) {
    marker = new google.maps.Marker({});

    topRated = $('#pop-places-bars').append(`<div class='top-rated-block' id="${recomBars.place_id}"><img src="${recomBars.photos[0].getUrl({maxWidth:400, maxHeight:400})}"><br><h3>${recomBars.name}<br></h3></div>`);

    topRated = $('#pop-places-lodging').append(`<div class='top-rated-block' id="${recomLodging.place_id}"><img src="${recomLodging.photos[0].getUrl({maxWidth:200, maxHeight:200})}"><br><h3>${recomLodging.name}<br></h3></div>`);

    topRated = $('#pop-places-museum').append(`<div class='top-rated-block' id="${recomMuseum.place_id}"><img src="${recomMuseum.photos[0].getUrl({maxWidth:200, maxHeight:200})}"><br><h3>${recomMuseum.name}<br></h3></div>`);

    markers.push(marker);

    searchBox.addListener('places_changed', function() {
        // infowindow.open(map, marker);
        // $('#top-rated').append(`<p>Very Interestin Place<br></p>`);
        topRated.empty();
    });
}

// nearby search showed on map with marker
function search(pos) {
    $('#filter').on('change', function() {
        var thisVal = $('#filter').val();
        request.type = thisVal;

        service.nearbySearch(request, callback);
    });

    request = {
        location: pos,
        radius: 1000,
        type: ['amusement_park']
    };

    service = new google.maps.places.PlacesService(map);
    service.nearbySearch(request, callback);

}

// Related to search(pos)
function callback(results, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
        clearOverlay();
        for (var i = 0; i < results.length; i++) {
            createMarker(results[i]);
        }
    }
}

// Related to search(pos)
function createMarker(place) {
    var marker = new google.maps.Marker({
        map: map,
        position: place.geometry.location,
        icon: image
    });

    // function return if organisation open or close   
    function openingHours() {
        if (place.opening_hours != undefined) {
            if (place.opening_hours.open_now == true) {
                return `Opening Hours: Open Now <br>`;
            }
            else {
                return `Opening Hours: Close <br>`;
            }
        }
        else {
            return "";
        }
    }

    // function check if preview photo exist or not
    function ifPhoto() {
        if (place.photos != undefined || place.photos != null) {
            return `<img src="${place.photos[0].getUrl({maxWidth:100, maxHeight:100})}"><br>`;
        }
        else {
            return "";
        }
    }

    // function check if obj exist or not
    function ifRating(str) {
        if (place.rating != undefined || place.rating != null) {
            return `${str} ${place.rating}`;
        }
        else {
            return "";
        }
    }

    markers.push(marker);

    google.maps.event.addListener(marker, 'click', function() {
        infowindow.setContent(`${ifPhoto()}${place.name} <br>${place.vicinity}<br> ${openingHours()}${ifRating('Raiting: ')}`);
        infowindow.open(map, this);
    });
}

// Additional Info for Popular Place -> Aside
function clickClass() {
    $('.top-rated-block').click(function() {
        $('#place-info').html('');

        var thisPlaceId = $(this).attr('id');

        service.getDetails({ placeId: thisPlaceId }, callback);

        function callback(place, status) {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                placeAddress = {
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng()
                };
                place = place;

                $('#place-info').append(`<div class="img-container"><img src='${place.photos[0].getUrl({maxWidth:500, maxHeight:500})}'></div><div class="content-wrapper"><h2>${place.name}</h2><br><button type="button" class="btn btn-primary btn-xs" onclick="clickBtn()">Show location on the map</button><br><span>${place.formatted_address}</span><br><span>${place.international_phone_number}</span><br><span>${place.rating}</span></div>`);
            }
            else {
                alert('Something wrong');
            }
        }

    });
}

var placeAddress;
var place;

function clickBtn() {
    clearOverlay();
    var marker = new google.maps.Marker({
        position: placeAddress,
        map: map
    });
    map.setCenter(placeAddress);
    window.setTimeout(function() {
        map.panTo(marker.getPosition());
    }, 500);

    markers.push(marker);
}
