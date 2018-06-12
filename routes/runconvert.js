'use strict';


const ccconvert = require('../public/javascripts/ccconvert.js'),
    express = require('express'),
    router = express.Router(),
    // fs = require('fs'),
    // util = require("util"),
    path = require('path'),
    exec = require("child_process").exec,
    tmp = require("tmp");

tmp.setGracefulCleanup();

function readBatch(pid, theprocess) {
    const devmode = theprocess.argv[2] === 'DEVMODE';

    // TODO: read the batch file
    // ./data/ Shapes.psd Green pictooverlay.png
    const process = {
        argv: ['',
            '',
            path.join((devmode ? '.' : '..'), 'data'),
            'Shapes.psd',
            'Green',
            'pictooverlay.png']
    };

    return ({
        devmode: devmode,
        pid: pid,

        outputPath: path.join(process.argv[2], 'output'),
        inputPath: path.join(process.argv[2], process.argv[3]),
        overlayLayerName: process.argv[4],
        overlayPngPath: path.join(process.argv[2], process.argv[5])
    });
}

function BatchImageProc(pid) {
    let args = readBatch(pid, process);

    return(args);
}

/* GET home page. */
router.get('/', function(req, res /*, next*/) {
    const procid = req.query['id'];
    if(procid !== undefined) {
        const proc = new BatchImageProc(procid),
            basename = path.basename(proc.inputPath, path.extname(proc.inputPath)),
            basepng = path.join(proc.outputPath, basename + '.png'),
            finalpng = path.join(proc.outputPath, basename + '-mrg.png');

        if(proc.devmode){
            console.warn('***DEVMODE***');
        }
        console.log('BEGIN OVERLAY: ' + proc.inputPath + ' + ' + proc.overlayPngPath + ' ==> ' + finalpng + ' using layer: "' + proc.overlayLayerName + '"');
        console.log('path is: ' + exec('pwd'));

        let ermsg = 'starting...';

        try {
            ccconvert.ccexportfile(proc.inputPath, basepng, proc.overlayLayerName, proc.overlayPngPath, finalpng, proc.devmode);
            ermsg = 'success';
            console.log(ermsg);
        } catch(e) {
            ermsg = e;
            console.error(ermsg);
        }

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
            errorcode: ermsg
        });
        return;
    }
    console.log(' please supply all params e.g.: ./path/to/data input.psd LayerName mergedoutput.png');
    res.render('paramerror', { message: 'Incorrect parameters' });
});

module.exports = router;
