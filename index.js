define(['angular'], function(angular) {

var app = angular.module('bower-helloworld', []);

if (location.href.indexOf("protractor-test") < 0) {
    angular.bootstrap(document.getElementById("app"), ['bower-helloworld']);
} else {
    angular.element(document).ready(function() {
        var elem = document.getElementById("app");
        window.name = 'NG_DEFER_BOOTSTRAP!' + window.name;
        angular.bootstrap(elem, ['bower-helloworld']);
        elem.setAttribute('ng-app', '');
        window.angular = angular;
    });
}

});

