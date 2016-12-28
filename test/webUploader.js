(function() {
    var uploader = angular.module('webUploader', []);

    uploader.config(function($httpProvider){
        angular.extend($httpProvider.defaults.headers.common, {
            'X-Requested-With': 'XMLHttpRequest'
        });

        angular.extend($httpProvider.defaults.headers.post, {
            'Content-Type': 'application/x-www-form-urlencoded'
        });

        var r20 = /%20/g,
            rbracket = /\[\]$/;
        function buildParams( prefix, obj, traditional, add ) {
        	var name;

        	if ( angular.isArray( obj ) ) {

        		// Serialize array item.
        		angular.forEach( obj, function( v, i ) {
        			if ( traditional || rbracket.test( prefix ) ) {

        				// Treat each array item as a scalar.
        				add( prefix, v );

        			} else {

        				// Item is non-scalar (array or object), encode its numeric index.
        				buildParams(
        					prefix + "[" + ( typeof v === "object" && v != null ? i : "" ) + "]",
        					v,
        					traditional,
        					add
        				);
        			}
        		} );

        	} else if ( !traditional && angular.isObject(obj) ) {

        		// Serialize object item.
        		for ( name in obj ) {
        			buildParams( prefix + "[" + name + "]", obj[ name ], traditional, add );
        		}

        	} else {

        		// Serialize scalar item.
        		add( prefix, obj );
        	}
        }

        // Serialize an array of form elements or a set of
        // key/values into a query string
        function param( a, traditional ) {
        	var prefix,
        		s = [],
        		add = function( key, value ) {

        			// If value is a function, invoke it and return its value
        			value = angular.isFunction( value ) ? value() : ( value == null ? "" : value );
        			s[ s.length ] = encodeURIComponent( key ) + "=" + encodeURIComponent( value );
        		};

    		// If traditional, encode the "old" way (the way 1.3.2 or older
    		// did it), otherwise encode params recursively.
    		for ( prefix in a ) {
    			buildParams( prefix, a[ prefix ], traditional, add );
    		}

        	// Return the resulting serialization
        	return s.join( "&" ).replace( r20, "+" );
        };

        $httpProvider.defaults.transformRequest = [function(data){
            return angular.isObject(data) && String(data) !== '[object File]' ? param(data, true) : data;
        }];
    });

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
                    swf: 'http://cdn.staticfile.org/webuploader/0.1.5/Uploader.swf',
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
                }, 100);

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

                // 添加文件
                webUp.on('fileQueued', function(file){
                    file._source = file.source;
                });

                // 添加多文件
                webUp.on('filesQueued', function(files){
                    console.log('filesQueued');
                    if (multiple){
                        var fs = angular.extend([], ngModel.$viewValue);
                        ngModel.$setViewValue(fs.concat(files));
                    } else {
                        ngModel.$setViewValue(files);
                    }
                    ngModel.$render();
                    scope.$apply();
                });

                // 移除文件
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

    uploader.directive('uploaderList', function($http){
        return {
            restrict: 'EA',
            require: 'ngModel',
            templateUrl: 'temp/uploader-item.html',
            scope: {
                list: '=',
                uploader: '=fileSelectName'
            },
            link: function(scope, element, attrs, ngModel){
                element.addClass('uploader-list');

                scope.$parent.$watch(attrs.ngModel, loadQueryList);

                function loadQueryList(ids) {
                    if (!ids) return;
                    $http.post('http://127.0.0.1:3000/file/find', {
                        data: ids
                    }).success(function(list){
                        scope.queryList = list;
                    });
                }

                scope.uploader.on('uploadSuccess', function(file, respJson){
                    ngModel.$viewValue = ngModel.$viewValue || [];
                    file._path = respJson.data[0].path;
                    ngModel.$viewValue.push(file._path);
                    ngModel.$setViewValue(ngModel.$viewValue);
                    ngModel.$render();
                });

                scope.uploader.on('fileDequeued', function(file){
                    var i = ngModel.$modelValue.indexOf(file._path);
                    if (i != -1){
                        ngModel.$modelValue.splice(i, 1);
                        ngModel.$setViewValue(ngModel.$modelValue);
                        ngModel.$render();
                    }
                });

                scope.removeQueryList = function(file){
                    var i = scope.queryList.indexOf(file);
                    if (i != -1){
                        scope.queryList.splice(i, 1);
                    }
                    // 删除 ngModel 中的对象
                    i = ngModel.$modelValue.indexOf(file.path);
                    if (i != -1){
                        ngModel.$modelValue.splice(i, 1);
                        ngModel.$setViewValue(ngModel.$modelValue.length > 0 ? ngModel.$modelValue : null);
                        ngModel.$render();
                    }
                };
            }
        };
    });

    uploader.filter('fileSize', function(){
        return function(s){
            s = Number(s);
            if (s < 1024){
                return s + 'B';
            }
            if (s < 1024 * 1024){
                return (s / 1024).toFixed(0) + 'KB';
            }
            if (s < 1024 * 1024 * 1024){
                return (s / 1024 / 1024).toFixed(1) + 'MB';
            }
            return (s / 1024 / 1024 / 1024).toFixed(2) + 'GB';
        };
    });

})();
