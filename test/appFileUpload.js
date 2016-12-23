(function(){
    var appFile = angular.module('appFileUpload', ['ngFileUpload']);

    appFile.service('appFile', function(){
        var domain = 'http://192.168.4.27:3000';

        this.uploadUrl = domain + '/file/upload';

        this.loadUrl = domain + '/file/load/';

        this.downUrl = domain + '/file/down/';
    });
})();
