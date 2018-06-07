'use strict';


var cp = require("cp"),
    fs = require("fs"),
    exec = require("child_process").execSync,
    path = require('path'),
    tmp = require("tmp"),
    util = require("util");

tmp.setGracefulCleanup();

/*
 * Overlay the image at imageToOverlayPath on the image at origImagePath at
 * co-ordinates overlayX and overlayY, scaling the image to be overlaid as
 * needed to fit in width overlayW and height overlayH. Finally, produce
 * the combined image in the file newImagePath.
 *
 * The function returns a Promise that resolves to the path of the generated
 * image.
 *
 * uses ImageMagick command line:
 * https://www.imagemagick.org/script/command-line-processing.php
 */
function _doOverlay(src, osrc, dest, ox, oy) {
    // const combineCmd = 'convert %s %s -geometry +%d+%d -composite %s\n';
    // TODO: this will change if Windows/Azure??
    const combineCmd = 'bash setmagick.sh %s %s -geometry +%d+%d -composite %s';
    var cmd = util.format(combineCmd, src, osrc, ox, oy, dest);
    console.log('----> running _doOverlay: ' + cmd + exec(cmd, function (error, stdout, stderr) {
        if (error) {
            console.error('----> _doOverlay ERROR ' + error);
            return 1;
        }
    }));
    return 0;
}

function _doResize(src, dest, ow, oh) {
    // const imgResizeCmd = 'bash setmagick.sh -density 1200 -background none -resize x%d^ -gravity center -extent %dx%d %s %s\n';
    const imgResizeCmd = 'bash setmagick.sh %s -resize %dx%d -gravity center %s\n';
    var cmd = util.format(imgResizeCmd, src, ow, oh, dest);
    console.log('----> _doResize: ' + cmd + exec(cmd, function (error, stdout, stderr) {
        if (error) {
            console.error('----> _doResize ERROR ' + error);
            return 1;
        }
    }));
    return 0;
}

function overlayImage(origImagePath, imageToOverlayPath, newImagePath,
                      overlayX, overlayY, overlayW, overlayH) {

    console.log('path is: ' + exec('pwd'));

    if (!checkFileExists(origImagePath)) {
        console.error('----> overlayImage: no origImagePath at: ' + origImagePath);
        throw 100;
    }
    if (!checkFileExists(imageToOverlayPath)) {
        console.error('----> overlayImage: no imageToOverlayPath at: ' + imageToOverlayPath);
        throw 200;
    }

    if (overlayW == undefined || overlayH == undefined) {
        overlayW = 0;
        overlayH = 0;
    }
    if (overlayX == undefined || overlayY == undefined) {
        overlayX = 0;
        overlayY = 0;
    }
    var script = '',
        tmpdir = path.join('.', 'tmp'),
        tmpFile = tmp.fileSync({ template: path.join(tmpdir, 'tmp-XXXXXX.png') });

    if (overlayW != 0 || overlayH != 0) {
        if(_doResize(imageToOverlayPath, tmpFile.name, overlayW, overlayH)) {
            return;
        }
    } else {
        cp(imageToOverlayPath, tmpFile.name, function (err) {
            if (err !== undefined) {
                console.error("copied with err " + err);
                return;
            }
        });
    }
    _doOverlay(origImagePath, tmpFile.name, newImagePath, overlayX, overlayY);
}

function validateLoad() {
    console.log("Module loaded");
    return true;
}

function checkFileExists(filePath) {
    return fs.existsSync(filePath);
}

module.exports.overlayImage = overlayImage;
module.exports.validateLoad = validateLoad;
module.exports.checkFileExists = checkFileExists;
