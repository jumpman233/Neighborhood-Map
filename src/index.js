import $ from 'jquery';
import ko from 'knockout';
import './css/reset.css';
import './css/index.css';
/*jshint loopfunc: true */

(function () {
    'use strict';

    let map = null,   //google map
        location = null, //google location
        service = null, //google service
        infoWindow; //google infoWindow

    //get the required jquery elements
    const $ele = {
        sidebar: $('.page-sidebar'),
        mainContent: $('.page-content'),
        errMsg: $('#error-msg'),
        noData: $('#no-data')
    };

    /**
     * @name clickMenu
     * @desc click menu button
     */
    const clickMenu = (model, event) => {
        $(event.target).toggleClass('rotate');
        $ele.sidebar.toggleClass('menu-hide');
        $ele.mainContent.toggleClass('menu-hide');
    };

    /**
     * @name hideMenu
     * @desc force to hide menu
     */
    const hideMenu = () => {
        $ele.sidebar.addClass('menu-hide');
        $ele.mainContent.addClass('menu-hide');
    };

    /**
     * @name checkHideMenu
     * @desc if the width of window is too short, the menu will be hide
     */
    const checkHideMenu = () => {
        if (window.innerWidth <= 700) {
            hideMenu();
        }
    };

    /**
     * @name showNoDataFound
     * @desc show the msg no data found by google nearby search
     */
    const setErrMsg = (content)=>{
        $ele.errMsg.text(content);
    };

    //show the msg no data found by google nearby search
    /**
     * @name showNoDataFound
     * @desc show the msg no data found by google nearby search
     */
    const showNoDataFound = ()=>{
        viewModel.resetData();
        $ele.noData.show();
    };

    /**
     * @name clickMarker
     * @desc the operation when you click a marker
     * @param marker {Google Marker}
     * @param name {String}
     */
    const clickMarker = (marker, name)=>{
        getWiki(name)
            .then((data) => {
                showInfoWindow({
                    name: name,
                    wikiTitle: data.title,
                    title: data.links[0].title
                }, marker);

                checkHideMenu();
            }, () => {
                showInfoWindow({
                    name: name
                }, marker);

                checkHideMenu();
            });
    };

    /**
     * @name AppViewModel
     * @desc init the view model
     */
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
            });
        };

        self.clickMenu = clickMenu;

        self.clickItem = function (model, event) {
            let list = self.posList();

            for (let i = 0; i < list.length; i++) {
                if (list[i].name === event.target.innerText) {
                    clickMarker(list[i].marker, list[i].name);
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

    /**
     * @name googleMapInit
     * @desc init map/service/InfoWindow and start to get data.
     * @param lat {Number} latitude
     * @param lon {Number} longitude
     */
    function googleMapInit(lat, lon) {
        if(!window.google){
            setErrMsg('Get google API failed. Maybe you have blocked the google service or network error.');
            hideMenu();
            return;
        }

        location = new window.google.maps.LatLng(lat, lon);

        map = new window.google.maps.Map(document.getElementById('map'), {
            center: location,
            zoom: 15
        });

        service = new window.google.maps.places.PlacesService(map);

        googleNearbySearch(map, service, {
            location: location,
            radius: '500',
            types: ['default']
        });

        infoWindow = new window.google.maps.InfoWindow();
    }

    /**
     * @name googleNearbySearch
     * @desc use google nearby search service to get data and render page.
     * @param map {Google Map}
     * @param service {Google Service}
     * @param request {object} check definition in Google service API
     */
    const googleNearbySearch = (map, service, request) => {
        service.nearbySearch(request, (results, status) => {
            viewModel.resetData();

            if (status == window.google.maps.places.PlacesServiceStatus.OK) {
                for (let i = 0; i < results.length; i++) {
                    let place = results[i];

                    let marker = new window.google.maps.Marker({
                        position: place.geometry.location,
                        map: map
                    });

                    Object.assign(place, {
                        marker
                    });

                    viewModel.posList.push(place);

                    window.google.maps.event.addListener(marker, 'click', ()=>{
                        clickMarker(marker, place.name);
                    });
                }
            } else if(status == window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS){
                showNoDataFound();
            } else if (status == window.google.maps.places.PlacesServiceStatus.UNKNOWN_ERROR) {
                window.alert('A server-side error occurred; trying again may be successful.');
            }
        });
    };

    /**
     * @name getWikiInfoWindowText
     * @desc get a html string of a infoWindow
     * @param param {Object}
     *                       name: the title of infoWindow
     *                       wikiTitle: a link title to wikipedia
     *                       title: the title of wikipedia
     * @return {String}
     */
    const getWikiInfoWindowText = (param) => ` 
 <div>
    <strong>${param.name}</strong><br>
    wiki: <a href="http://en.wikipedia.org/wiki/${param.wikiTitle}" target="_blank">${param.title}</a>
    <br>
</div>`;

    /**
     * @name getWikiInfoWindowText
     * @desc get a html string of a infoWindow
     * @param param {Object}
     * @return {String}
     */
    const getNormalInfoWindowText = (param) => `
<div>
    <strong>${param.name}</strong><br>
</div>
`;

    /**
     * @name showInfoWindow
     * @desc show a infoWindow reference to param
     * @param param {Object} see definition in getWikiInfoWindowText
     * @param marker {Google Marker}
     */
    const showInfoWindow = function (param, marker) {
        if (param.wikiTitle) {
            infoWindow.setContent(getWikiInfoWindowText(param));
        } else {
            infoWindow.setContent(getNormalInfoWindowText(param));
        }
        infoWindow.open(map, marker);
    };

    /**
     * @name getWiki
     * @desc get information about {content} from wikipedia
     * @param content {String}
     * @returns {Promise}
     */
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

    //at the first check the window width
    $(() => {
        checkHideMenu();
    });

    //init view model
    const viewModel = new AppViewModel();

    ko.applyBindings(viewModel);

    //get the current position, if failed, a default location will be set.
    //the init the map.
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            let crd = pos.coords;

            googleMapInit(crd.latitude, crd.longitude);
        },
        () => {
            window.alert('Get you location failed! The default location will be set.');
            googleMapInit(39.9296624, 116.5998958);
        },
        {
            enableHighAccuracy: true,
            maximumAge: 1000
        }
    );
}());

