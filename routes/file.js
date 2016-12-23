const express     = require('express');
const multiparty  = require('multiparty');
const fs          = require('fs');
const path        = require('path');
const router      = express.Router();

const filePath = './public/gm-file-server';

/***
 * 生成文件夹
 */
function mkdirsSync(dirpath, mode) {
    if (!fs.existsSync(dirpath)) {
        var pathtmp;
        dirpath.split(path.sep).forEach(function(dirname) {
            if (pathtmp) {
                pathtmp = path.join(pathtmp, dirname);
            }
            else {
                pathtmp = dirname;
            }
            if (!pathtmp) return;
            if (!fs.existsSync(pathtmp)) {
                if (!fs.mkdirSync(pathtmp, mode)) {
                    return false;
                }
            }
        });
    }
    return true;
}

mkdirsSync(filePath);

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
                message: err
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
