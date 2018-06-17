/*
 * Analyto - Personal Analytics System
 * Author: Kanav Gupta
 * Contact: kanav0610@gmail.com
 */
var analyto_data = {};
analyto_data.host = window.location.hostname;
analyto_data.page = window.location.href;
// Used functions
function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}
var createCookie = function(name, value, days) {
    var expires;
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toGMTString();
    }
    else {
        expires = "";
    }
    document.cookie = name + "=" + value + expires + "; path=/";
}
// Store fingerprint in a evercookie
analyto_data.user = getCookie('analyto_user');
xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
       result = JSON.parse(xhttp.responseText);
       if(result.flag == false) {
       		createCookie('analyto_user', result.new_id, 1000);
       }
    }
};
xhttp.open('POST', 'http://<ANALYTICS_DOMAIN>/log', true);
xhttp.setRequestHeader("Content-type", "application/json");
xhttp.send(JSON.stringify(analyto_data));