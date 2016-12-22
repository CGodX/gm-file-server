var express = require('express');
var router = express.Router();
var multiparty = require('multiparty');

var filePath = './public/files/';

router.get('/valid_md5', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/***
 * 文件上传
 */
router.post('/upload', function(req, res, next) {
    var form = new multiparty.Form({
        uploadDir: filePath
    });
    form.parse(req, function(err, fields, files){
        if(err){
            res.json({
                success: false,
                message: '上传文件失败'
            });
            return;
        }

        res.json({
            success: true,
            data: files
        });
        console.log(files);
    });
});

/***
 * 文件下载
 */
router.get('/down/:id', function(req, res, next) {
    console.log(req.params.id);
    res.sendFile(req.params.id + '.jpg', {
        root: filePath
    });
});
module.exports = router;
