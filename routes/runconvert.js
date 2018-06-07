'use strict';


var ccconvert = require('../public/javascripts/ccconvert.js'),
    express = require('express'),
    router = express.Router(),
    fs = require('fs'),
    util = require("util"),
    path = require('path'),
    exec = require("child_process").exec,
    tmp = require("tmp");

tmp.setGracefulCleanup();

function readBatch(pid) {
    // TODO: read the batch file
    // ./data/ Shapes.psd Green pictooverlay.png
    return ({
        outputPath: process.argv[2] + 'output/',
        inputPath: process.argv[2] + process.argv[3],
        overlayLayerName: process.argv[4],
        overlayPngPath: process.argv[2] + process.argv[5]
    });
}

function batchImageProc(pid) {
    let args = readBatch(pid);

    return(args);
}

/* GET home page. */
router.get('/', function(req, res, next) {
    var procid = req.query['id'];
    if(procid !== undefined) {
        const proc = new batchImageProc(procid),
            basename = path.basename(proc.inputPath, path.extname(proc.inputPath)),
            basepng = path.join(proc.outputPath, basename + '.png'),
            finalpng = path.join(proc.outputPath, basename + '-mrg.png');

        console.log('BEGIN OVERLAY: ' + proc.inputPath + ' + ' + proc.overlayPngPath + ' ==> ' + finalpng + ' using layer: "' + proc.overlayLayerName + '"');
        let ercode = ccconvert.ccexportfile(proc.inputPath, basepng, proc.overlayLayerName, proc.overlayPngPath, finalpng);
        console.log('END OVERLAY: ' + proc.inputPath + ' + ' + proc.overlayPngPath + ' ==> ' + finalpng + ' using layer: "' + proc.overlayLayerName + '"');

        res.render('runconvert', {
            procid: procid,
            inputPath: proc.inputPath,
            overlayLayerName: proc.overlayLayerName,
            overlayPngPath: proc.overlayPngPath,
            outputPath: proc.outputPath,
            basename: basename,
            basepng: basepng,
            finalpng: finalpng,
            errorcode: ercode
        });
        return;
    }
    console.log(' please supply all params e.g.: ./path/to/data input.psd LayerName mergedoutput.png');
    res.render('paramerror', { message: 'Incorrect parameters' });
});

module.exports = router;
