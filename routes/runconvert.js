'use strict';


const ccconvert = require('../public/javascripts/ccconvert.js'),
    express = require('express'),
    router = express.Router(),
    fs = require('fs'),
    // util = require("util"),
    path = require('path'),
    exec = require("child_process").exec,
    csv = require('csv-streamify'),
    tmp = require("tmp");

tmp.setGracefulCleanup();

/* GET home page. */
router.get('/', function(req, res /*, next*/) {
    const procid = req.query['id'],
        devmode = process.argv[2] === 'DEVMODE',
        datadir = path.join((devmode ? '.' : '..'), 'data'),
        parser = csv(),
        csvfile = path.join(datadir, procid + '.csv');

    if(procid !== undefined) {
        if(devmode){
            console.warn('***DEVMODE***');
        }

        // emits each line as a buffer or as a string representing an array of fields
        parser.on('data', function (line) {
            // CSV file contains 1234, Shapes.psd Green pictooverlay.png
            console.log(line);

            let outputPath = path.join(datadir, 'output'),
                inputPath = path.join(datadir, line[1]),
                overlayLayerName = line[2],
                overlayPngPath = path.join(datadir, line[3]),
                basename = path.basename(inputPath, path.extname(inputPath)),
                basepng = path.join(outputPath, basename + '.png'),
                finalpng = path.join(outputPath, basename + '-mrg.png'),
                ermsg = 'starting...';

            console.log('BEGIN OVERLAY: ' + procid + ':' + inputPath + ' + ' + overlayPngPath + ' ==> ' + finalpng + ' using layer: "' + overlayLayerName + '"');
            console.log('path is: ' + exec('pwd'));

            try {
                ccconvert.ccexportfile(inputPath, basepng, overlayLayerName, overlayPngPath, finalpng, devmode);
                ermsg = 'success';
                console.log(ermsg);
            } catch(e) {
                ermsg = e;
                console.error(ermsg);
            }

            res.render('runconvert', {
                procid: procid,
                inputPath: inputPath,
                overlayLayerName: overlayLayerName,
                overlayPngPath: overlayPngPath,
                outputPath: outputPath,
                basename: basename,
                basepng: basepng,
                finalpng: finalpng,
                errorcode: ermsg
            });

            console.log('END OVERLAY: ' + procid);
        });

        if(fs.existsSync(csvfile)) {
            // now pipe some data into it
            fs.createReadStream(csvfile).pipe(parser);
        } else {
            console.error('INVALID batch ID');
            res.render('paramerror', { message: 'INVALID batch ID: ' + procid });
        }

        return;
    }
    console.error(' please supply all params e.g.: ./path/to/data input.psd LayerName mergedoutput.png');
    res.render('paramerror', { message: 'Incorrect parameters' });
});

module.exports = router;
