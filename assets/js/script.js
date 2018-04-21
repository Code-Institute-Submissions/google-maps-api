let map, searchBox, bounds, placesService, infowindow, bars, lodging, museum;
let input = document.getElementById('pac-input');
let markers = [];
let placeToEat = [];
let hotels = [];

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 52.4348, lng: 13.6350 },
        zoom: 3
    });

    searchBox = new google.maps.places.SearchBox(input);
    searchBoxActions();

    placesService = new google.maps.places.PlacesService(map);
    infowindow = new google.maps.InfoWindow();

    dropDownLocalStorage();
    $('#saved-places').click(function() {
        $('#saved-places-list').slideToggle('slow');
    });

    moreInfoForTopRated();
    getCity();
    checkBoxFilter();
}

/*
  Cities
  Recommendation to visit (show only once, when you visit the page)
 */
// On click one of the given places set pin on the map and show most visited places
function getCity() {
    let latLng;
    $('.cities-card').on('click', function() {
        let city = $(this).find('h2').text();
        let value = $(this).attr('value').split(',');
        latLng = JSON.parse(`{"lat":${value[0]}, "lng":${value[1]}}`);

        mapAndFooterUpdateLocation(latLng, city);
    });
}

function mapAndFooterUpdateLocation(latLng, city) {
    clearFooter();

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
    checkBoxFilter(latLng);
}

/*
  Filter
  Showing pins on the map of chosen type (NEARBY SEARCH)
 */
function nearbyMarkersByType(place) {
    $('#filterForFun option:eq(0)').prop('selected', true);
    $('#filter').on('change', function() {
        $('.row-content-museum, .museum').remove();
        $('footer .row-content-art_gallery, .art_gallery').remove();
        $('footer .row-content-amusement_park, .amusement_park').remove();
        $('footer .row-content-aquarium, .aquarium').remove();
        $('footer .row-content-zoo, .zoo').remove();

        thisVal = $('#filter').val();
        let type = thisVal.replace('_', ' ');
        let city = $('.bar').text().slice(18);

        if (thisVal != 'blank') {
            let request = {
                location: place,
                bounds: map.getBounds(),
                type: ['']
            };
            request.type = thisVal;

            placesService.nearbySearch(request, callbackNBSearch);

            topPlaces(thisVal, museum, city, type);
        }
    });
}

function callbackNBSearch(results, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
        clearMarkers();
        results.map(function(result) {
            createMarker(result.geometry.location);
            infoWindowForMarkers(result);
        });

    }
}

// Info window for markers
function infoWindowForMarkers(place, arr) {
    arr = arr || markers;
    var marker = new google.maps.Marker({
        map: map,
        position: place.geometry.location
    });
    arr.push(marker);

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
        let currentPhoto = (place.photos != undefined || place.photos != null) ? `<img src="${place.photos[0].getUrl({maxWidth:100, maxHeight:100})}">` : "";
        return currentPhoto;
    }

    // function check if obj exist or not
    function ifRating(str) {
        let currentRating = (place.rating != undefined || place.rating != null) ? `${str} ${place.rating}` : "";
        return currentRating;
    }

    google.maps.event.addListener(marker, 'click', function() {
        infowindow.setContent(`<div class="info-window">${ifPhoto()}<p>${place.name}</p> <p>${place.vicinity}</p>
        <p>${openingHours()}</p><p>${ifRating('Raiting: ')}</p><p class="info-window-more-info" onclick="">More Info</p></div>`);
        infowindow.open(map, this);
        infoWindowMoreInfo(place.place_id);
    });
}

function infoWindowMoreInfo(placeID) {
    $('.info-window-more-info').on('click', function() {
        $('#place-info').html('');
        asideContent(placeID);
    });
}

// CheckBox for places where to eat
function checkBoxFilter(place) {
    let request;
    $('input[name=typeOfPlace]').on('change', function() {
        if (this.checked) {
            request = {
                location: place,
                bounds: map.getBounds(),
                type: ['']
            };

            if (this.value == 'restaurant') {
                request.type = this.value;
                placesService.nearbySearch(request, callbackWTE);
            }

            if (this.value == 'lodging') {
                request.type = this.value;
                placesService.nearbySearch(request, callbackHotels);
            }

        }
        else {
            if (this.value == 'restaurant') clearPlaceToEat();
            if (this.value == 'lodging') clearHotels();
        }
    });
}

function callbackWTE(results, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
        clearPlaceToEat();
        results.map(function(result) {
            createMarkerForRestaurant(result);
            infoWindowForMarkers(result, placeToEat);
        });

    }
}

function callbackHotels(results, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
        clearHotels();
        results.map(function(result) {
            createMarkerForHotels(result);
            infoWindowForMarkers(result, hotels);
        });

    }
}

function createMarkerForRestaurant(result) {
    placeToEat.push(new google.maps.Marker({
        map: map,
        position: result.geometry.location
    }));
}

function createMarkerForHotels(result) {
    hotels.push(new google.maps.Marker({
        map: map,
        position: result.geometry.location
    }));
}

function clearPlaceToEat() {
    placeToEat.forEach(function(marker) { marker.setMap(null) });
    placeToEat = [];
}

function clearHotels() {
    hotels.forEach(function(marker) { marker.setMap(null) });
    hotels = [];
}

/* 
  Search Box function 
 */
function searchBoxActions() {
    searchBox.addListener('places_changed', function() {
        let inputPlaceSearchBox = searchBox.getPlaces();
        let country = inputPlaceSearchBox[0].formatted_address;

        map.zoom = 13;

        if (inputPlaceSearchBox.length == 0) return;

        clearMarkers();
        clearFooter();

        bounds = new google.maps.LatLngBounds();

        inputPlaceSearchBox.forEach(function(place) {

            if (!place.geometry) {
                console.log("Returned place contains no geometry");
                return;
            }

            createMarker(place.geometry.location); // create markers
            nearbyMarkersByType(place.geometry.location);
            checkBoxFilter(place.geometry.location);

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
function topPlaces(placeType, variable, country, h2Type) {
    if (h2Type == undefined) h2Type = placeType;

    placesService.nearbySearch({
        bounds: map.getBounds(),
        type: [placeType]
    }, callback);

    function callback(results, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            $('footer .row').append(`<h2 class="${placeType}">Top rated ${h2Type}s in ${country}</h2>`);
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
    $('footer .row').append(`<div class="row-content row-content-${variable}" id="${arr.place_id}">
    <div class="img-container"><img src="${arr.photos[0].getUrl({maxWidth:400, maxHeight:400})}"></div>
    <h3>${arr.name}</h3></div>`);
}

/*
  Aside
  More Information for chosen top rated place
 */
// On click action for any of given cards from footer
function moreInfoForTopRated() {
    $('.row').on('click', '.row-content', function() {
        $('#place-info').html('');
        let placeID = $(this).attr('id');

        asideContent(placeID);
    });
}

function asideContent(placeID) {

    if (window.matchMedia("(min-width: 999px)").matches) {
        asideContentAnimation();
    }
    else if (window.matchMedia("(max-width: 998px)").matches) {
        mobileAsideContentAnimation();
        setTimeout(function() {
            closeOverlay();
        }, 1000);
    }

    placesService.getDetails({ placeId: placeID }, asideCallback);
}

function asideCallback(place, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
        $('#place-info').append(`<div class="wrapper-aside-content">
                    <div class="img-container img-container-aside">
                    <button type="button" class="btn btn-warning btn-xs save-btn">Save</button>
                    <img class="aside-img" src='${place.photos[0].getUrl({maxWidth:350, maxHeight:350})}'></div>
                    <div class="content-wrapper"><h2>${place.name}</h2>
                    <button type="button" class="btn btn-primary btn-xs aside-btn">Show location on the map</button><br>
                    <span>${place.formatted_address}</span><br><span>${place.international_phone_number}</span></div>
                </div>
                <div class="exit-btn-popup-form"><img src="assets/img/cross.svg" alt=""></div>`);

        asideSlider(place);
        asideBtnShowLocation(place);
        localStorageFunction(place);
    }
}

// Slider for Aside section 
function asideSlider(place) {
    var i = 0;
    if (place.photos.length > 0) {
        $('#place-info .wrapper-aside-content').append(`<i class="fa fa-chevron-right"></i>`);
        $('#place-info .wrapper-aside-content').append(`<i class="fa fa-chevron-left"></i>`);
    }
    $('.fa-chevron-right').click(function() {
        i++;
        if (i == place.photos.length) i = 0;
        $('.aside-img').attr('src', place.photos[i].getUrl({ maxWidth: 500, maxHeight: 500 }));
    });
    $('.fa-chevron-left').click(function() {
        if (i <= 0) i = place.photos.length;
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
}

/*
  Local Storage
 */
function localStorageFunction(place) {
    asideBtnSave(place);
}
// Save parameters in Local Storage and if you will save more then 5 return alert
function asideBtnSave(place) {
    $('.save-btn').on('click', function() {
        if (typeof(Storage) !== "undefined") {
            if (localStorage.getItem(place.name) === null && localStorage.length < 20) {
                localStorage.setItem(place.name + ' - ID', place.place_id);
                localStorage.setItem(place.name + ' - LtdLng', place.geometry.location);
                localStorage.setItem(place.name + ' - name', place.name);
                localStorage.setItem(place.name + ' - image', place.photos[0].getUrl({ maxWidth: 100, maxHeight: 100 }));
                localStorage.setItem(place.name + ' - city', place.address_components[3].long_name);
            }
            else {
                alert('You reached your storage limit. Please remove one to save current place.');
            }
        }
        else {
            alert('Sorry! No Web Storage support');
        }
        setTimeout(function() {
            dropDownLocalStorage();
        }, 50);
    });
}

// Drop Down menu for Saved Places
function dropDownLocalStorage() {
    $('#saved-places-list').empty();
    if (localStorage.length > 0) {
        Object.keys(localStorage).filter(function(key) {
            return key.includes('name');
        }).map(function(key) {
            let ltdLng = localStorage.getItem(localStorage.getItem(key) + ' - LtdLng');
            let image = localStorage.getItem(localStorage.getItem(key) + ' - image');
            let title = localStorage.getItem(key);
            $('#saved-places-list').append(`<div class="saved-place" value="${ltdLng}"><i class="glyphicon glyphicon-remove"></i><img src="${image}" alt=""><span>${title}</span></div>`);
        });
        $('#saved-places').css('display', 'inline-block');
    }
    
    removeLocalStorageKey();
    getValueFromSavedPlaces();
}

// Remove Item from Local Storage and from Drop Down menu
function removeLocalStorageKey() {
    $('.saved-place .glyphicon-remove').on('click', function() {
        let name = $(this).parent().text();

        localStorage.removeItem(name + ' - name');
        localStorage.removeItem(name + ' - image');
        localStorage.removeItem(name + ' - ID');
        localStorage.removeItem(name + ' - LtdLng');
        localStorage.removeItem(name + ' - city');

        $(this).parent().remove();
    });
}

// Collect Value from Drop Down menu
function getValueFromSavedPlaces() {
    $('.saved-place').on('click', function() {
        $('#place-info').html('');

        let title = $(this).text();
        let latLng = localStorage.getItem(title + ' - LtdLng');
        latLng = latLng.replace(/\(|\)/g, '').replace(' ', '').split(',');
        latLng = JSON.parse(`{"lat":${latLng[0]}, "lng":${latLng[1]}}`);

        let city = localStorage.getItem(title + ' - city');

        asideContent(localStorage.getItem(title + ' - ID'));

        mapAndFooterUpdateLocation(latLng, city);
    });
}

/* Animation */
$('.slide-left-aside-btn.inside').on('click', function() {
    $('#additional-menu').hide('slow');
    $('.slide-left-aside-btn.outside').show('slow');
    $('.slide-left-aside-btn.inside').hide('slow');
});
$('.slide-left-aside-btn.outside').on('click', function() {
    $('#additional-menu').show('slow');
    $('.slide-left-aside-btn.inside').show('slow');
    $('.slide-left-aside-btn.outside').hide('slow');
});

function asideContentAnimation() {
    $('#place-info').show('slow');

    $('#map').animate({
        width: '70%'
    }, 500);
}

function mobileAsideContentAnimation() {
    $('.overlay').show();
    $('#place-info').show();
}

function closeOverlay() {
    $('#place-info .exit-btn-popup-form').on('click', function() {
        $('.overlay').hide();
        $('#place-info').hide();
    });
}
