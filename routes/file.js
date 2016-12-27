const express = require('express');
const multiparty = require('multiparty');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const db = require('./util/db');

// 文件存放路径
const filePath = './public/gm-file-server'.replace(new RegExp('/', 'g'), path.sep);

/**
 * 允许跨域
 */
router.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    next();
});

/***
 * 文件上传
 */
router.post('/upload', function(req, res, next) {
    const form = new multiparty.Form({
        uploadDir: filePath
    });
    form.parse(req, function(err, fields, files) {
        if (err) {
            console.error('------------------------------');
            console.error('文件上传失败');
            console.error(err);
            console.error('------------------------------');
            res.json({
                success: false,
                message: err
            });
            return;
        }

        const resultArr = [];
        for (var i in files) {
            const file = files[i][0];
            const file_path = file.path.substr(file.path.lastIndexOf(path.sep) + 1);
            const fileData = {
                file_name: file.originalFilename,
                file_size: file.size,
                path: file_path,
                create_time: new Date(),
                origin: req.headers.origin,
                user_agent: req.headers['user-agent'],
                down_count: 0,
                mime: file.headers['content-type']
            };

            resultArr.push({
                path: file_path,
                name: fileData.file_name,
                mime: fileData.mime,
                size: fileData.file_size
            });

            db.query('insert into file set ?', [fileData], function(err, result) {
                if (err) {
                    console.error('[%s]保存数据库失败', file.originalFilename);
                } else {
                    console.log('[%s]保存数据库成功', file.originalFilename);
                }
            });
        }
        // 返回文件文件数据
        res.json({
            success: true,
            data: resultArr
        });
    });
});

/***
 * 文件下载
 */
router.get('/load/:id', function(req, res, next) {
    if (!fs.existsSync(filePath + path.sep + req.params.id)){
        return res.send('no exists');
    }
    res.sendFile(req.params.id, {
        root: filePath
    });

    upDownCount(req.params.id);
});

router.get('/down/:id', function(req, res, next) {
    db.query('select file_name from file where path = ?', [req.params.id], function(err, result) {
        const headers = {};
        if (err) {
            console.error('------------------------------');
            console.error('文件下载数据库查询失败: %s', req.params.id);
            console.error(err);
            console.error('------------------------------');
        } else if (!result || !result.length) {
            console.error('文件下载数据库查询没有数据: %s', req.params.id);
        } else {
            headers['Content-Disposition'] = 'attachment;filename=' + encodeURIComponent(result[0].file_name);
            upDownCount(req.params.id);
        }

        res.sendFile(req.params.id, {
            root: filePath,
            headers: headers
        });
    });
});

router.get('/list', function(req, res){
    var rows = Number(req.query.rows) || 10;
    var page = ((Number(req.query.page) || 1) - 1) * rows;

    db.query('select count(*) count from file', function(err, cr){
        db.query('select * from file order by down_count desc, last_down_time limit ?,? ', [page, rows], function(err, result){
            res.json({
                total: cr[0].count,
                rows: result
            });
        });
    });
});

// 统计下载次数
function upDownCount(path){
    db.query('update file set down_count = down_count + 1, last_down_time=? where path=?', [new Date(), path]);
}

/***
 * 生成文件夹
 */
function mkdirsSync(dirpath, mode) {
    if (!fs.existsSync(dirpath)) {
        var pathtmp;

        dirpath.split(path.sep).forEach(function(dirname) {
            if (pathtmp) {
                pathtmp = path.join(pathtmp, dirname);
            } else {
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

// 检查文件夹是否存在并创建附件文件夹
mkdirsSync(filePath, true);

module.exports = router;
