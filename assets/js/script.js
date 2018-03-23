var map, geocoder, service, request, image, infowindow;
var markers = [];

function initMap() {
    geocoder = new google.maps.Geocoder();
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: -34.397, lng: 150.644 },
        zoom: 8
    });

    infowindow = new google.maps.InfoWindow();

    currentPosition();
    searchBox();
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

// Clear Markers
function clearOverlay() {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers.length = 0;
}

function searchBox() {
    var input = document.getElementById('pac-input');
    var searchBox = new google.maps.places.SearchBox(input);
    var placeId;

    // Listen for the event fired when the user selects a prediction and retrieve more details for that place.
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

        clearOverlay();

        // For each place, get the icon, name and location.
        var bounds = new google.maps.LatLngBounds();

        places.forEach(function(place) {
            if (!place.geometry) {
                console.log("Returned place contains no geometry");
                return;
            }
            service = new google.maps.places.PlacesService(map);
            service.nearbySearch({ location: pos, radius: 500 }, callback);

            function callback(results, status) {
                var arrPlaces = [];
                if (status === google.maps.places.PlacesServiceStatus.OK) {

                    var count = 0;
                    for (var i = 0; i < results.length; i++) {
                        if (results[i].photos == undefined) { count++; continue; }
                        var place = results[i];
                        arrPlaces += results[i];
                        if (i < 4 + count) {
                            createRecomendationPlaces(results[i]);
                        }
                    }
                }
            }
            var topRated;

            function createRecomendationPlaces(place) {
                var marker = new google.maps.Marker({
                });

                topRated = $('#top-rated').append(`<div class='top-rated-block'><img src="${place.photos[0].getUrl({maxWidth:200, maxHeight:200})}"><br>
                    <br><h3>${place.name}<br></h3><p>${place.vicinity}</p></div>`);
                //  topRated;
                markers.push(marker);

                searchBox.addListener('places_changed', function() {
                    // infowindow.open(map, marker);
                    // $('#top-rated').append(`<p>Very Interestin Place<br></p>`);
                    topRated.empty();
                });

            }

            // Create a marker for each place.
            markers.push(new google.maps.Marker({
                map: map,
                title: place.name,
                position: place.geometry.location
            }));

            if (place.geometry.viewport) {
                // Only geocodes have viewport.
                bounds.union(place.geometry.viewport);
            }
            else {
                bounds.extend(place.geometry.location);
            }

        });
        map.fitBounds(bounds);

    });

}

function search() {
    var type = parseInt($("input[name='filter']:checked").val());

    request = {
        location: map.getCenter(),
        radius: 1000,
        type: []
    };

    switch (type) {
        case 1: //Tourist attractions
            request.type = "point_of_interest";
            image = 'https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png';

            break;
        case 2: //Accommodation
            request.type = "hotels";
            image = '';
            break;
        case 3: //Bars and Restaurants
            request.type = "bar";
            image = '';
            break;
        default:
            image = '';
            break;
    }


    service = new google.maps.places.PlacesService(map);
    service.nearbySearch(request, callback);
}

function callback(results, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
        clearOverlay();
        for (var i = 0; i < results.length; i++) {
            createMarker(results[i]);
        }


    }
}

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
