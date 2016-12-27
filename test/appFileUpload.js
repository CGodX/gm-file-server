(function(){
    var appFile = angular.module('appFileUpload', ['ngFileUpload']);

    appFile.service('appUpload', function(){
        var domain = 'http://127.0.0.1:3000';

        this.uploadUrl = domain + '/file/upload';

        this.loadUrl = domain + '/file/load/';

        this.downUrl = domain + '/file/down/';
    });
})();
