# Neighborhood-Map
## Description
A single page application featuring a map of your neighborhood or a neighborhood you would like to visit.
## Requirements
- npm(5.5.1 or higher)
- webpack(4.0.1)
- webpack-dev-server(3.1.0)
## Start
1. `npm install`
2. `npm run start:dev`
3. access [localhost:8081/index.html](localhost:8081/index.html).

Notice: The code in /dist will not be used at all, web-dev-server generates files in internal storage. Upload /dist codes are just to fit the rubric.
## Third Party
- Google map API(build the map and get location data).
- wikipedia(to get a location description).
- KnockoutJS(build a page with MVVM)
- jQuery(Dom operations and AJAX).
## Details
1. When the page is loaded, it will try to access the visitor's location. If the {} fails, A default location will be set.
2. If the google map js loads failed, the page will show error message and does't work :( 
3. A marker will try to show a wiki title with a link provided by wikipedia, if the request for wikipedia is wrong or no data found, the wiki title will not show.
