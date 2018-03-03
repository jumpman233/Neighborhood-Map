// import $ from 'jquery';
// import ko from 'knockout';

const $ = require('jquery');
const ko = require('knockout');

let map = null,
    location = null,
    service = null,
    infoWindow;

const googleNearbySearch = (map, service, request) => {
    service.nearbySearch(request, (results, status) => {
        if (status == google.maps.places.PlacesServiceStatus.OK) {
            viewModel.posList().forEach((item)=>{
                item.marker.setMap(null);
            });
            viewModel.posList.removeAll();

            for (let i = 0; i < results.length; i++) {
                let place = results[i];

                let marker = new google.maps.Marker({
                    position: place.geometry.location,
                    map: map
                });

                Object.assign(place, {marker});
                console.log(marker);

                viewModel.posList.push(place);

                google.maps.event.addListener(marker, 'click', function() {
                    infoWindow.setContent('<div><strong>' + place.name + '</strong><br>' +
                        'Place ID: ' + place.place_id + '<br>' +
                        place.formatted_address + '</div>');
                    infoWindow.open(map, this);
                })
            }
        }
    });
};

function AppViewModel() {
    let self = this;

    self.posList = ko.observableArray([]);

    self.searchInput = ko.observable('');

    self.clickSearch = ()=>{
        googleNearbySearch(map, service, {
            location: location,
            radius: '500',
            types: ['default'],
            keyword: viewModel.searchInput()
        })
    }
}

const viewModel = new AppViewModel();

ko.applyBindings(viewModel);

navigator.geolocation.getCurrentPosition(
    (pos)=>{
        let crd = pos.coords;

        console.log('Your current position is:');
        console.log('Latitude : ' + crd.latitude);
        console.log('Longitude: ' + crd.longitude);
        console.log('More or less ' + crd.accuracy + ' meters.');

        function initialize() {
            location = new google.maps.LatLng(crd.latitude, crd.longitude);

            map = new google.maps.Map(document.getElementById('map'), {
                center: location,
                zoom: 15
            });

            service = new google.maps.places.PlacesService(map);

            googleNearbySearch(map, service, {
                location: location,
                radius: '500',
                types: ['default']
            });

            infoWindow = new google.maps.InfoWindow();
        }

        initialize();
    },
    ()=>{
        console.log(arguments)
    },
    {
        enableHighAccuracy: true, maximumAge: 1000
    });