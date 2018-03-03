import $ from 'jquery';
import ko from 'knockout';
import './css/reset.css';
import './css/index.css';

let map = null,
    location = null,
    service = null,
    infoWindow;

const $ele = {
    sidebar: $('.page-sidebar'),
    mainContent: $('.page-content'),
    errMsg: $('#error-msg'),
    noData: $('#no-data')
};

const clickMenu = (model, event) => {
    $(event.target).toggleClass('rotate');
    $ele.sidebar.toggleClass('menu-hide');
    $ele.mainContent.toggleClass('menu-hide')
};

const hideMenu = () => {
    $ele.sidebar.addClass('menu-hide');
    $ele.mainContent.addClass('menu-hide');
};

const checkHideMenu = () => {
    if (window.innerWidth <= 700) {
        hideMenu();
    }
};

const setErrMsg = (content)=>{
    $ele.errMsg.text(content);
};

const showNoDataFound = ()=>{
    viewModel.resetData();
    $ele.noData.show();
};

$(() => {
    checkHideMenu();
});

function AppViewModel() {
    let self = this;

    self.posList = ko.observableArray([]);

    self.searchInput = ko.observable('');

    self.clickSearch = function () {
        googleNearbySearch(map, service, {
            location: location,
            radius: '500',
            types: ['default'],
            keyword: viewModel.searchInput()
        })
    };

    self.clickMenu = clickMenu;

    self.clickItem = function (model, event) {
        let list = self.posList();

        for (let i = 0; i < list.length; i++) {
            if (list[i].name === event.target.innerText) {
                list[i].clickMarker();
            }
        }
    };

    self.resetData = () => {
        self.posList().forEach((item) => {
            item.marker.setMap(null);
        });
        self.posList.removeAll();
        $ele.noData.hide();
    };
}

function googleMapInit(lat, lon) {
    if(!google){
        setErrMsg('Get google API failed. Maybe you have blocked the google service or network error.');
        hideMenu();
        return;
    }

    location = new google.maps.LatLng(lat, lon);

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

const googleNearbySearch = (map, service, request) => {
    service.nearbySearch(request, (results, status) => {
        viewModel.resetData();

        if (status == google.maps.places.PlacesServiceStatus.OK) {
            for (let i = 0; i < results.length; i++) {
                let place = results[i];

                let marker = new google.maps.Marker({
                    position: place.geometry.location,
                    map: map
                });

                Object.assign(place, {
                    marker,
                    clickMarker: () => {
                        getWiki(place.name)
                            .then((data) => {
                                showInfoWindow({
                                    name: place.name,
                                    wikiTitle: data.title,
                                    title: data.links[0].title
                                }, marker);

                                checkHideMenu();
                            }, () => {
                                showInfoWindow({
                                    name: place.name
                                }, marker);

                                checkHideMenu();
                            });
                    }
                });

                viewModel.posList.push(place);

                google.maps.event.addListener(marker, 'click', place.clickMarker);
            }
        } else if(status == google.maps.places.PlacesServiceStatus.ZERO_RESULTS){
            showNoDataFound();
        } else if (status == google.maps.places.PlacesServiceStatus.UNKNOWN_ERROR) {
            alert('A server-side error occurred; trying again may be successful.');
        }
    });
};

const getWikiInfoWindowText = (param) => ` 
 <div>
    <strong>${param.name}</strong><br>
    wiki: <a href="http://en.wikipedia.org/wiki/${param.wikiTitle}" target="_blank">${param.title}</a>
    <br>
</div>`;

const getNormalInfoWindowText = (param) => `
<div>
    <strong>${param.name}</strong><br>
</div>
`;

const showInfoWindow = function (param, marker) {
    if (param.wikiTitle) {
        infoWindow.setContent(getWikiInfoWindowText(param));
    } else {
        infoWindow.setContent(getNormalInfoWindowText(param));
    }
    infoWindow.open(map, marker);
};

const getWiki = (content) => new Promise((resolve, reject) => {
    $.ajax({
        url: 'https://en.wikipedia.org/w/api.php',
        data: {
            action: 'query',
            titles: content,
            prop: 'links',
            format: 'json'
        },
        dataType: 'jsonp',
        success: function (data) {
            if (data && data.query && data.query.pages) {
                for (let item in data.query.pages) {
                    if (item == -1) {
                        reject();
                    } else {
                        resolve(data.query.pages[item]);
                    }
                }
                reject();
            } else {
                reject();
            }
        },
        error: function () {
            reject();
        }
    });
});

const viewModel = new AppViewModel();

ko.applyBindings(viewModel);

navigator.geolocation.getCurrentPosition(
    (pos) => {
        let crd = pos.coords;

        console.log('Your current position is:');
        console.log('Latitude : ' + crd.latitude);
        console.log('Longitude: ' + crd.longitude);
        console.log('More or less ' + crd.accuracy + ' meters.');

        googleMapInit(crd.latitude, crd.longitude);
    },
    () => {
        alert('Get you location failed! The default location will be set.');
        googleMapInit(39.9296624, 116.5998958);
    },
    {
        enableHighAccuracy: true,
        maximumAge: 1000
    }
);