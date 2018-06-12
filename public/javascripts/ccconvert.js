'use strict';

const PSD = require('psd'),
    fs = require('fs'),
    imageOverlay = require('./ccoverlay');

/**
 * get the layer indicated by layrname and retrieve the geometry of that layer
 * this will be the layer to merge to
 *
 * @param inppsd
 * @param inppng
 * @param layrname
 * @param ovrp
 * @param outp
 * @param devmode
 * @returns {number}
 */
function _ccexportlayers(inppsd, inppng, layrname, ovrp, outp, devmode) {
    let start = new Date(),
        didmerge = false,
        mergelayr = {};

    console.log('--> ' + start + ' _ccexportlayers using inppsd: ' + inppsd + ' inppng: ' + inppng + ' layrname: ' + layrname);

    PSD.open(inppsd).then(function (psd) {
        psd.tree().descendants().forEach(function (node) {
            // if (node.isGroup()) return true;
            // if (node.name.indexOf('/') > 0) return true;
            // node.saveAsPng(outp + node.name + ".png").catch(function (err) {
            //      console.log('error! ' + err);
            // }
            if(node.name.indexOf(layrname) > 0) {
                mergelayr = node.export();
                console.log('--> _ccexportlayers: found layer named ' + layrname + ' geom t r w h ' + mergelayr.top + ' ' + mergelayr.right + ' ' +
                    mergelayr.width + ' ' + mergelayr.height);
                didmerge = true;
            }
        });
    }).then(function () {
        if(!didmerge){
            throw('_ccexportlayers: could not find layer named ' + layrname);
        } else {
            _ccmerge(inppng, ovrp, outp, mergelayr.top, mergelayr.left, mergelayr.width, mergelayr.height, devmode);
        }
        const endd = (new Date());
        console.log('--> ' + endd + " _ccexportlayers Finished in " + ((new Date()) - start) + "ms");
    });
}

/**
 * merge the overlay png over the base image
 *
 * @param inp
 * @param ovrp
 * @param outp
 * @param mt
 * @param ml
 * @param mw
 * @param mh
 * @param devmode
 */
function _ccmerge(inp, ovrp, outp, mt, ml, mw, mh, devmode) {
    const start = new Date();

    console.log('--> ' + start + ' _ccmerge inp: ' + inp + ' ovrp: ' + ovrp + ' outp: ' + outp + '  geom t r w h ' + mt + ' ' + ml + ' ' + mw + ' ' + mh);

    // imageOverlay.overlayImage(srcImgPath, ovrImgPath, outImgPath);   // no resize
    imageOverlay.overlayImage(inp, ovrp, outp, ml, mt, mw, mh, devmode);      // resize

    const endd = (new Date());
    console.log('--> ' + endd + " _ccmerge Finished in " + ((endd) - start) + "ms");
}

function ccexportfile(inp, outp, layrname, ovrp, mergedp, devmode) {
    //var psd = PSD.fromFile(file.realpath);
    let start = new Date();

    console.log('--> ' + start + ' ccexportfile using inp: ' + inp + ' outp: ' + outp);

    if(!fs.existsSync(inp)) {
        throw('ccexportfile: no PSD file at: ' + inp);
    }

    PSD.open(inp).then(function (psd) {
        psd.image.saveAsPng(outp).then(function (){
            _ccexportlayers(inp, outp, layrname, ovrp, mergedp, devmode);
        });
    }).then(function () {
        const endd = (new Date());
        console.log('--> ' + endd + " ccexportfile Finished in " + ((endd) - start) + "ms");
    });
}

module.exports.ccexportfile = ccexportfile;
