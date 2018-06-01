var express = require('express');
var router = express.Router();

function batchImageProc(pid) {
    // TODO: read the batch file
    this.outputPath = '';//process.argv[2] + 'output/';
    this.inputPath = '';//process.argv[2] + process.argv[3];
    this.overlayLayerName = '';//process.argv[4];
    this.overlayPngPath = '';//process.argv[2] + process.argv[5];
}

/* GET home page. */
router.get('/', function(req, res, next) {
    var procid = req.query['id'];
    if(procid !== undefined) {
        var proc = new batchImageProc(procid);
        res.render('runconvert', { title: 'Convert Files - procid: ' + procid });
        return;
    }
    res.render('paramerror', { message: 'Incorrect parameters' });
});

module.exports = router;
