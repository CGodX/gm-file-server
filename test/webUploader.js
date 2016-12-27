(function() {
    var uploader = angular.module('webUploader', []);

    var upBase = WebUploader.create();

    uploader.directive('fileSelect', function(){
        return {
            require: ['ngModel'],
            restrict: 'A',
            link: function(scope, element, attrs, controllers){
                var ngModel = controllers[0];

                    // 多选
                var multiple = 'multiple' in attrs && attrs.multiple !== 'false';

                var webUp = WebUploader.create({
                    server: 'http://127.0.0.1:3000/file/upload',
                    pick: {
                        id: element[0],
                        multiple: 'multiple' in attrs
                    }
                });

                setTimeout(function(){
                    element.children('[id][style]').css({
                        top: 0,
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '',
                        width: ''
                    });
                });

                scope.ngModel = ngModel;

                scope[attrs.fileSelectName] = webUp;

                /**
                 * 如果是单选，在选择新文件的时候删除原来的文件
                 */
                if (!multiple){
                    webUp.on('beforeFileQueued', function(){
                        angular.forEach(webUp.getFiles('inited'), function(file){
                            webUp.removeFile(file, true);
                        });
                    });
                }

                webUp.on('fileQueued', function(file){
                    file._source = file.source;
                });

                webUp.on('filesQueued', function(files){
                    console.log('filesQueued');
                    if (multiple){
                        ngModel.$setViewValue(webUp.getFiles('inited'));
                    } else {
                        ngModel.$setViewValue(files[0]);
                    }
                    ngModel.$render();
                    scope.$apply();
                });

                webUp.on('fileDequeued', function(file){
                    var files = undefined;
                    if (multiple){
                        var files = angular.extend([], ngModel.$modelValue);
                        var index = files.indexOf(file);
                        if (index != -1){
                            files.splice(index, 1);
                        }
                    }
                    ngModel.$setViewValue(files);
                    ngModel.$render();
                    console.log('fileDequeued');
                });

                webUp.on('uploadStart', function(file){
                    file._state = 'uploading';
                });

                webUp.on('uploadProgress', function(file, progress){
                    file._progress = parseInt(progress * 100);
                    scope.$apply();
                });

                webUp.on('uploadSuccess', function(file, respJson){
                    file._state = 'success';
                    scope.$apply();
                });
            }
        };
    });

    uploader.directive('fileThumb', function(){
        return {
            restrict: 'A',
            link: function(scope, element, attrs){
                scope.$watch(attrs.fileThumb, function(){
                    var file = scope.$eval(attrs.fileThumb);
                    if (!file) return;
                    upBase.makeThumb(file, function(err, src){
                        if (err){
                            console.log(file);
                            console.log('不能预览');
                            return;
                        }
                        element.attr('src', src);
                    });
                });
            }
        };
    });

    uploader.directive('uploaderList', function(){
        return {
            restrict: 'EA',
            templateUrl: 'temp/uploader-item.html',
            scope: {},
            link: function(scope, element, attrs){
                scope.uploader = scope.$parent.$eval(attrs.fileSelectName);
                scope.$parent.$watch(attrs.list, function(files){
                    console.log(files);
                    scope.files = files;
                });
            }
        };
    });


})();
