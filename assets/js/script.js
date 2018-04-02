let map, searchBox, bounds, placesService, infowindow, bars, lodging, museum;
let input = document.getElementById('pac-input');
let markers = [];

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 52.4348, lng: 13.6350 },
        zoom: 3
    });

    searchBox = new google.maps.places.SearchBox(input);
    searchBoxActions();

    placesService = new google.maps.places.PlacesService(map);
    infowindow = new google.maps.InfoWindow();
}

/*
  Cities
  Recommendation to visit (show only once, when you visit the page)
 */
// On click one of the given places set pin on the map and show most visited places
(function getCity() {
    let latLng;
    $('.cities-card').on('click', function() {
        clearFooter();
        let city = $(this).find('h2').text();
        let value = $(this).attr('value').split(',');
        latLng = JSON.parse(`{"lat":${value[0]}, "lng":${value[1]}}`);

        createMarker(latLng);

        map.zoom = 13;
        map.setCenter(latLng);
        setTimeout(function() {
            // Get and Sort nearby places by Type for Recommendation Section and Append
            topPlaces('bar', bars, city);
            topPlaces('lodging', lodging, city);
            topPlaces('museum', museum, city);
        }, 0);
        nearbyMarkersByType(latLng);
    });
})();

/*
  Filter
  Showing pins on the map of chosen type (NEARBY SEARCH)
 */
function nearbyMarkersByType(place) {
    $('#filter').on('change', function() {
        let thisVal = $('#filter').val();
        let request = {
            location: place,
            bounds: map.getBounds(),
            type: ['']
        };
        request.type = thisVal;

        placesService.nearbySearch(request, callback);
    });

    function callback(results, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            clearMarkers();
            results.map(function(result) {
                createMarker(result.geometry.location);
                infoWindowForMarkers(result);
            });

        }
    }
}

// Info window for markers
function infoWindowForMarkers(place) {
    var marker = new google.maps.Marker({
        map: map,
        position: place.geometry.location
    });
    markers.push(marker);

    // function return if organisation open or close
    function openingHours() {
        if (place.opening_hours != undefined) {
            let ifOpen = (place.opening_hours.open_now) ? `Opening Hours: Open Now <br>` : `Opening Hours: Close <br>`;
            return ifOpen;
        }
        else {
            return "";
        }
    }

    // function check if preview photo exist or not
    function ifPhoto() {
        let currentPhoto = (place.photos != undefined || place.photos != null) ? `<img src="${place.photos[0].getUrl({maxWidth:100, maxHeight:100})}"><br>` : "";
        return currentPhoto;
    }

    // function check if obj exist or not
    function ifRating(str) {
        let currentRating = (place.rating != undefined || place.rating != null) ? `${str} ${place.rating}` : "";
        return currentRating;
    }

    google.maps.event.addListener(marker, 'click', function() {
        infowindow.setContent(`${ifPhoto()}${place.name} <br>${place.vicinity}<br> ${openingHours()}${ifRating('Raiting: ')}`);
        infowindow.open(map, this);
    });
}

/* 
  Search Box function 
 */
function searchBoxActions() {
    searchBox.addListener('places_changed', function() {
        let inputPlaceSearchBox = searchBox.getPlaces();
        let country = inputPlaceSearchBox[0].formatted_address;

        if (inputPlaceSearchBox.length == 0) return;

        clearMarkers(); // clear markers if exist
        clearFooter();

        bounds = new google.maps.LatLngBounds();

        inputPlaceSearchBox.forEach(function(place) {

            if (!place.geometry) {
                console.log("Returned place contains no geometry");
                return;
            }

            createMarker(place.geometry.location); // create markers
            nearbyMarkersByType(place.geometry.location);

            setTimeout(function() {
                // Get and Sort nearby places by Type for Recommendation Section and Append
                topPlaces('bar', bars, country);
                topPlaces('lodging', lodging, country);
                topPlaces('museum', museum, country);
            }, 0);

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

// Clear out the old MARKERS
function clearMarkers() {
    markers.forEach(function(marker) { marker.setMap(null) });
    markers = [];
}

// Create MARKER for each place
function createMarker(place) {
    markers.push(new google.maps.Marker({
        map: map,
        position: place
    }));
}

/*
  Footer
  Top NEARBY PLACES of current Location
 */
// Clear Footer
function clearFooter() {
    bars = [];
    lodging = [];
    museum = [];

    $('footer .row').html('');
    $('#cities').hide();
}

// Get and Sort of given results
function topPlaces(placeType, variable, country) {
    placesService.nearbySearch({
        bounds: map.getBounds(),
        type: [placeType]
    }, callback);

    function callback(results, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            $('footer .row').append(`<h2>Travellers’ ${placeType}s сhoice in ${country}</h2>`);
            variable = results.filter(function(result) {
                    return result.types[0] === placeType;
                }).filter(function(result) {
                    return result.photos != undefined;
                }).sort(function(a, b) {
                    return b.rating - a.rating;
                }).slice(0, 4)
                .map(function(result) {
                    topPlacesInHTML(result, placeType);
                });
        }
    }
}

// Append executed array in HTML
function topPlacesInHTML(arr, variable) {
    $('footer .row').append(`<div class="row-content row-content-${variable}" id="${arr.place_id}"><div class="img-container"><img src="${arr.photos[0].getUrl({maxWidth:400, maxHeight:400})}"></div>
<h3>${arr.name}</h3></div>`);
}

/*
  Aside
  More Information for chosen top rated place
 */
// On click action for any of given cards from footer
(function moreInfoForTopRated() {
    $('.row').on('click', '.row-content', function() {
        $('#place-info').show('slow');

        $('#map').animate({
            width: '70%'
        }, 500);

        $('#place-info').html('');
        let placeID = $(this).attr('id');

        placesService.getDetails({ placeId: placeID }, callback);

        function callback(place, status) {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                $('#place-info').append(`<div class="img-container">
                <img class="aside-img" src='${place.photos[0].getUrl({maxWidth:350, maxHeight:350})}'></div>
                <div class="content-wrapper"><h2>${place.name}</h2><button type="button" class="btn btn-primary btn-xs aside-btn">Show location on the map</button><br>
                <span>${place.formatted_address}</span><br><span>${place.international_phone_number}</span></div>`);

                asideSlider(place);
                asideBtnShowLocation(place);
            }
        }
    });
})();

// Slider for Aside section 
function asideSlider(place) {
    var i = 0;
    if (place.photos.length > 0) {
        $('#place-info').append(`<i class="fa fa-chevron-right"></i>`);
        $('#place-info').append(`<i class="fa fa-chevron-left"></i>`);
    }
    $('.fa-chevron-right').click(function() {
        i++;
        if (i == place.photos.length) i = 0;
        $('.aside-img').attr('src', place.photos[i].getUrl({ maxWidth: 500, maxHeight: 500 }));
    });
    $('.fa-chevron-left').click(function() {
        if (i < 0) i = place.photos.length;
        i--;
        $('.aside-img').attr('src', place.photos[i].getUrl({ maxWidth: 500, maxHeight: 500 }));
    });
}

// Button action - showing location on the map
function asideBtnShowLocation(place) {
    $('.aside-btn').on('click', function() {
        clearMarkers();
        createMarker(place.geometry.location);
    });
    nearbyMarkersByType(place.geometry.location);
}
