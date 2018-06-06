'use strict';

var PSD = require('psd'),
    // fs = require('fs'),
    imageOverlay = require('./ccoverlay');

/**
 * get the layer indicated by layrname and retrieve the geometry of that layer
 * this will be the layer to merge to
 * @param inp
 * @param layrname
 * @returns {number}
 */
function ccexportlayers(inppsd, inppng, layrname, ovrp, outp) {
    var start = new Date(),
        didmerge = false,
        mergelayr = {};

    console.log('--> ' + start + ' ccexportlayers using inppsd: ' + inppsd + ' inppng: ' + inppng + ' layrname: ' + layrname);

    PSD.open(inppsd).then(function (psd) {
        psd.tree().descendants().forEach(function (node) {
            // if (node.isGroup()) return true;
            // if (node.name.indexOf('/') > 0) return true;
            // node.saveAsPng(outp + node.name + ".png").catch(function (err) {
            //      console.log('error! ' + err);
            // }
            if(node.name.indexOf(layrname) > 0) {
                mergelayr = node.export();
                console.log('--> ccexportlayers: found layer named ' + layrname + ' geom t r w h ' + mergelayr.top + ' ' + mergelayr.right + ' ' +
                    mergelayr.width + ' ' + mergelayr.height);
                didmerge = true;
            }
        });
    }).then(function () {
        if(!didmerge){
            console.error('--> ccexportlayers: could not find layer named ' + layrname);
            return 0;
        } else {
            ccmerge(inppng, ovrp, outp, mergelayr.top, mergelayr.left, mergelayr.width, mergelayr.height);
        }
        var endd = (new Date());
        console.log('--> ' + endd + " ccexportlayers Finished in " + ((new Date()) - start) + "ms");
    }).catch(function (err) {
        var endd = (new Date());
        console.error('--> ' + endd + " ccexportlayers ERROR " + err.stack);
        return 0;
    });
    return 1;
}

/**
 * merge the overlay png over the base image
 * @param inp
 * @param outp
 */
function ccmerge(inp, ovrp, outp, mt, ml, mw, mh) {
    var start = new Date();

    console.log('--> ' + start + ' ccmerge inp: ' + inp + ' ovrp: ' + ovrp + ' outp' + outp + '  geom t r w h ' + mt + ' ' + ml + ' ' + mw + ' ' + mh);

    try {
        // imageOverlay.overlayImage(srcImgPath, ovrImgPath, outImgPath);   // no resize
        imageOverlay.overlayImage(inp, ovrp, outp, ml, mt, mw, mh);      // resize
    } catch(e) {
        console.error("--> ccmerge:imageOverlay threw exception " + e);
    }
    var endd = (new Date());
    console.log('--> ' + endd + " ccmerge Finished in " + ((endd) - start) + "ms");
}

function ccexportfile(inp, outp, layrname, ovrp, mergedp) {
    //var psd = PSD.fromFile(file.realpath);
    let start = new Date(),
    ercode;

    console.log('--> ' + start + ' ccexportfile using inp: ' + inp + ' outp: ' + outp);

    PSD.open(inp).then(function (psd) {
        psd.image.saveAsPng(outp).then(function (){
            ercode = ccexportlayers(inp, outp, layrname, ovrp, mergedp);
        });
    }).then(function () {
        var endd = (new Date());
        console.log('--> ' + endd + " ccexportfile Finished in " + ((endd) - start) + "ms");
        return ercode;
    });
    console.error('--> ' + new Date() + " ccexportfile Could not find input PSD (" + inp + ")");
    return 100;
}

module.exports.ccexportlayers = ccexportlayers;
module.exports.ccmerge = ccmerge;
module.exports.ccexportfile = ccexportfile;
