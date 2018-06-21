'use strict';


const ccconvert = require('../public/javascripts/ccconvert.js'),
    express = require('express'),
    router = express.Router(),
    fs = require('fs'),
    // util = require("util"),
    path = require('path'),
    // exec = require("child_process").exec,
    csv = require('csv-streamify'),
    mkdirp = require('mkdirp'),
    mv = require('mv'),
    tmp = require("tmp");

tmp.setGracefulCleanup();

/* GET runconvert page. */
router.get('/', function (req, res /*, next*/) {
    const procid = req.query['id'],
        devmode = process.argv[2] === 'DEVMODE';

    if (procid !== undefined) {
        const basedatadir = path.join((devmode ? '.' : '..'), 'data'),
            inputdir = path.join((devmode ? '.' : '..'), 'input'),
            inputcsv = path.join(inputdir, procid + '.csv'),
            parser = csv(),
            datadir = path.join(basedatadir, procid),
            outputPath = path.join(datadir, 'output'),
            csvfile = path.join(datadir, procid + '.csv');

        if (devmode) {
            console.warn('***DEVMODE***');
        }

        if (!fs.existsSync(inputcsv)) {
            console.error('File not found: ', csvfile);
            res.render('paramerror', {message: 'INVALID batch ID: ' + procid});
            return;
        }

        /*
         * move files to work directories
         * mkdirp will create data/procid AND data/procid/output
         * TODO read CSV file and only move files for this batch
         */
        mv(inputdir, datadir, {
            mkdirp: true,
            clobber: false
        }, function (err) {
            // done. it first created all the necessary directories, and then
            // tried fs.rename, then falls back to using ncp to copy the dir
            // to dest and then rimraf to remove the source dir
            if (err && (err.code !== 'EEXIST')) {
                console.error('UNABLE TO move files to work directory: ' + err);
                res.render('paramerror', {message: 'UNABLE TO  move files to work directory ' + err});
                return;
            } else {
                if (err && (err.code === 'EEXIST')) {
                    console.warn('Files moved but some files already exist');
                } else {
                    console.log('Moved files to work directory ' + datadir);
                }

                /*
                 * replace the input direcotyr
                 */
                mkdirp(inputdir, function () {
                    console.log('Recreated input directory');
                });

                /*
                 * create output directory
                 */
                mkdirp(outputPath, function (oerr) {
                    if (oerr) {
                        console.error('UNABLE TO create output directory: ' + oerr);
                        res.render('paramerror', {message: 'UNABLE TO create output directory: ' + oerr});
                        return;
                    } else {
                        let parmsarr = [];

                        console.log('Created output directory ' + outputPath);
                        // emits each line as a buffer or as a string representing an array of fields
                        parser.on('end', function () {
                            console.log('this is the end of the csv file');

                            res.render('runconvert', {
                                procid: procid,
                                parmsarr: parmsarr
                            });

                            console.log('END OVERLAY: ' + procid);
                        });
                        parser.on('data', function (line) {
                            // CSV file contains 1234, Shapes.psd Green pictooverlay.png
                            // CSV file contains -
                            // 003f400000P08UmAAJ,Shapes.psd,Green,flyerslogo.png,005f4000002H0miAAC,2018-05-28T18:14:39.000Z
                            console.log(line);

                            // positions of parameters
                            const P_JOBNUM = 0,
                                P_PSDFILENAME = 1,
                                P_PSDLAYERNAME = 2,
                                P_OVERLAYIMAGENAME = 3;
                                // P_BATCHNUM = 4;
                                // P_TIMESTAMP = 4;

                            let jobnum = line[P_JOBNUM],
                                psdfilepath = path.join(datadir, line[P_PSDFILENAME]),
                                basename = path.basename(psdfilepath, path.extname(psdfilepath)),
                                parms = {
                                    jobNum: jobnum,
                                    psdFilePath: psdfilepath,
                                    overlayLayerName: line[P_PSDLAYERNAME],
                                    overlayPngPath: path.join(datadir, line[P_OVERLAYIMAGENAME]),
                                    baseName: basename,
                                    basePng: path.join(outputPath, basename + '.png'),
                                    finalPng: path.join(outputPath, jobnum + '.png'),
                                    ermsg: 'starting...'
                                };

                            /*
                             * PROCESS THE FILES (ignore first line if title)
                             */
                            if(jobnum !== 'ID'){
                                console.log('BEGIN OVERLAY: ' + procid + ':' + parms.psdFilePath + ' + ' + parms.overlayPngPath + ' ==> ' + parms.finalPng + ' using layer: "' + parms.overlayLayerName + '"');
                                // console.log('path is: ' + exec('pwd'));

                                try {
                                    ccconvert.ccexportfile(parms.psdFilePath, parms.basePng, parms.overlayLayerName, parms.overlayPngPath, parms.finalPng, devmode);
                                    parms.ermsg = 'success';
                                    console.log(parms.ermsg);
                                } catch (e) {
                                    parms.ermsg = e;
                                    console.error('CAUGHT error: ' + parms.ermsg);
                                }
                                parmsarr.push(parms);
                            }
                        });

                        // now pipe some data into it
                        fs.createReadStream(csvfile).pipe(parser);
                    }
                });
            }
        });

        return;
    }
    console.error(' please supply all params e.g.: ./path/to/data input.psd LayerName mergedoutput.png');
    res.render('paramerror', {message: 'Incorrect parameters'});
});

module.exports = router;
