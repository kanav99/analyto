var mymap = L.map('mapid').setView([51.505, -0.09], 2);
L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=<MAPBOX_API_KEY>', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox.streets',
    accessToken: '<MAPBOX_API_KEY>'
}).addTo(mymap);
points.forEach(function (point) {
	L.marker([point.latitude, point.longitude]).addTo(mymap);
})