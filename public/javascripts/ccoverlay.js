'use strict';


const cp = require("cp"),
    fs = require("fs"),
    exec = require("child_process").execSync,
    path = require('path'),
    tmp = require("tmp"),
    util = require("util");

tmp.setGracefulCleanup();

function checkFileExists(filePath) {
    return fs.existsSync(filePath);
}

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
function _doOverlay(src, osrc, dest, ox, oy, magickbat) {
    const combineCmd = magickbat + ' %s %s -geometry +%d+%d -composite %s',
        cmd = util.format(combineCmd, src, osrc, ox, oy, dest);
    console.log('----> running _doOverlay: ' + cmd + exec(cmd, function (error /*, stdout, stderr*/) {
        if (error) {
            throw('overlayImage: error combining image: error' + error);
        }
    }));
    return 0;
}

function _doResize(src, dest, ow, oh, magickbat) {
    const imgResizeCmd = magickbat + ' %s -resize %dx%d -gravity center %s\n',
        cmd = util.format(imgResizeCmd, src, ow, oh, dest);
    console.log('----> _doResize: ' + cmd + exec(cmd, function (error /*, stdout, stderr*/) {
        if (error) {
            throw('overlayImage: error resizing image: error' + error);
        }
    }));
}

function overlayImage(origImagePath, imageToOverlayPath, newImagePath,
                      overlayX, overlayY, overlayW, overlayH, devmode) {

    const magickbat = devmode ? 'bash setmagick.sh' : '..\\setmagick.bat';

    if (!checkFileExists(origImagePath)) {
        throw('overlayImage: no origImagePath at: ' + origImagePath);
    }
    if (!checkFileExists(imageToOverlayPath)) {
        throw('overlayImage: no imageToOverlayPath at: ' + imageToOverlayPath);
    }

    if (overlayW === undefined || overlayH === undefined) {
        overlayW = 0;
        overlayH = 0;
    }
    if (overlayX === undefined || overlayY === undefined) {
        overlayX = 0;
        overlayY = 0;
    }
    const tmpdir = path.join((devmode ? '.' : '..'), 'tmp'),
        tmpFile = tmp.fileSync({ template: path.join(tmpdir, 'tmp-XXXXXX.png') });

    if (overlayW !== 0 || overlayH !== 0) {
        _doResize(imageToOverlayPath, tmpFile.name, overlayW, overlayH, magickbat);
    } else {
        cp(imageToOverlayPath, tmpFile.name, function (err) {
            if (err !== undefined) {
                throw('overlayImage: error copying image: ' + imageToOverlayPath);
            }
        });
    }
    return _doOverlay(origImagePath, tmpFile.name, newImagePath, overlayX, overlayY, magickbat);
}

module.exports.overlayImage = overlayImage;
module.exports.checkFileExists = checkFileExists;
