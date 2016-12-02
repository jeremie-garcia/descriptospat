Traj.Player = {
    loopMode: false
    , requestId: undefined
    , loopID: undefined
    , isPlaying: false
    , audioFilePath: "./snd/Hip_Hop_4_Break.wav"
    , wavesurfer: undefined
    , binauralAudio: undefined
    , binauralNode: undefined, //This methods plays the curves from their indexes
    playCurves: function (indexes) {
        Traj.Player.isPlaying = true;
        var duree = Traj.Player.wavesurfer.getDuration();
        console.log(duree);
        //Traj.Player.wavesurfer.play();
        Traj.Player.binauralAudio.play();
        // Traj.Player.wavesurfer.seekTo(pourcentage); pour aller entre 0 et 1
        //Find longest curves for the time slider range
        var longestCurveIdx = Traj.Manager.longestCurveIdxOfPlayedCurve(indexes);
        var maxDuration = Traj.Manager.trajectories[longestCurveIdx].getDuration();
        Traj.Manager.selectCurve(longestCurveIdx);
        //time variables
        var begin = new Date().getTime()
            , now, pourcentage;
        (function loopMulti() {
            // get time for new frame
            now = new Date().getTime() - begin;
            //TODO
            pourcentage = 0;
            // clear dyn canvas
            Traj.View.dyn_repaint();
            //stop if the current time is less than the whole duration
            if (now > duree) {
                //if loop mode then relaucnh the palying
                if (Traj.Player.loopMode) {
                    cancelAnimationFrame(this.requestId);
                    this.requestId = undefined;
                    Traj.Player.playCurves(indexes);
                    return;
                }
                else {
                    Traj.Player.stopPlayActions();
                    return;
                }
            }
            else {
                //process each curve
                for (var k = 0; k < indexes.length; k++) {
                    var curve = Traj.Manager.trajectories[indexes[k]];
                    pointCoord = Traj.Utils.interpolatePourcentage(curve, pourcentage), x = pointCoord[0], y = pointCoord[1], z = 0, orientation = ['undefined', 'undefined', 'undefined'];
                    if (!isNaN(x) && !isNaN(y)) {
                        //Mise a jour de la position pour la spatialisation ici
                        //Update the display (paint playHead and curve segment
                        Traj.Player.repaintPointWithOrientation(curve, [x, y], orientation);
                        var azimuth = -40; //fonctionne
                        var distance = 1; //pas sur que ça fonctionne bien...
                        var elevation = 0;
                        Traj.Player.binauralNode.setPosition(azimuth, elevation, distance);
                        // Traj.Player.binauralFIRNode.setPosition(40, 0, 1);
                        //Traj.Player.repaintCurve(curve,idx,idx-1);
                    }
                }
                Traj.Player.requestId = requestAnimationFrame(loopMulti);
            }
        }())
    }
    , stopPlayActions: function () {
        if (this.isPlaying) {
            if (this.requestId) {
                cancelAnimationFrame(this.requestId);
                this.requestId = undefined;
            }
            // Traj.View.dyn_repaint();
            Traj.Player.isPlaying = false;
            var playButton = document.getElementById('playButton');
            playButton.innerHTML = 'Play';
        }
    }
    , repaintPointWithOrientation: function (curve, point, orientation) {
        var dyn_ctx = Traj.View.dyn_ctx;
        dyn_ctx.strokeStyle = curve.color;
        if (point && orientation) {
            Traj.View.drawOrientationForPoint(dyn_ctx, point, orientation);
            //draw large point 
            var pos = Traj.Utils.convertUnitsIntoCanvasPos(point);
            Traj.View.drawPoint(dyn_ctx, pos, 18);
        }
    }
    , repaintCurve: function (curve, index, lastIndex) {
        var dyn_ctx = Traj.View.dyn_ctx
            , pos, last_pos;
        dyn_ctx.lineWidth = Traj.View.CURVE_ACTIVE_STROKE_SIZE * 1.3;
        dyn_ctx.strokeStyle = curve.color;
        //Traj.View.traj_repaint();
        if (index > 0) {
            for (var idx = 0; idx < index + 1; idx++) {
                pos = Traj.Utils.convertUnitsIntoCanvasPos([curve.X[idx], curve.Y[idx]]);
                last_pos = Traj.Utils.convertUnitsIntoCanvasPos([curve.X[idx - 1], curve.Y[idx - 1]]);
                // draw large curve
                dyn_ctx.beginPath();
                dyn_ctx.moveTo(last_pos[0], last_pos[1]);
                dyn_ctx.lineTo(pos[0], pos[1]);
                dyn_ctx.stroke();
            }
        }
    }, //resets the player (stop playing and refresh display)
    reset: function () {
        Traj.Player.stopPlayActions();
        document.getElementById('playButton').innerHTML = 'Play';
        Traj.View.repaintAll();
    }, ////////////////////////////////////
    ////////// CALLED FROM HTML ////////
    ////////////////////////////////////
    updateLoopMode: function () {
        Traj.Player.loopMode = document.getElementById("flip-loop").checked;
        Traj.Player.reset();
    }
    , updatePlayMode: function () {
        Traj.Player.isMulti = document.getElementById("flip-PlayMode").checked;
        Traj.Player.reset();
    }
    , initAudioFileArea: function () {
        var loader = function (path, cb) {
            var req = new XMLHttpRequest();
            req.open('GET', path, true);
            req.onreadystatechange = function (evt) {
                if (req.readyState == 4) {
                    if (req.status == 200) {
                        cb(req.responseText)
                    }
                }
            }
            req.send(null);
        }
        var IR, sourcePosition;
        loader('./opendap/irc_1002.sofa.IR', function (res) {
            IR = res;
            loader('./opendap/irc_1002.sofa.asc.sourceposition', function (res) {
                sourcePosition = res;
                // split the global string into an array of strings
                var sourcesPositions = sourcePosition.split('\n');
                // remove first line which is useless
                sourcesPositions.shift();
                // remove last line (might be empty) /// TODO : check that
                sourcesPositions.pop();
                var re = /SourcePosition\[(.*)\], (.*), (.*), (.*)/;
                // go to each element of the array, and apply the parsing
                var sourcePositionsParsed = sourcesPositions.map(function (elmt) {
                    var res = re.exec(elmt);
                    var obj = {
                        index: parseInt(res[1])
                        , azimuth: parseFloat(res[2])
                        , elevation: parseFloat(res[3])
                        , distance: parseFloat(res[4])
                    }
                    return obj;
                })
                var IRs = IR.split('\n');
                IRs.shift()
                IRs.pop()
                var reIR = /Data.IR\[(.*)\]\[(.*)\], (.*)/;
                var IRsParsed = IRs.map(function (elmt) {
                    var res = reIR.exec(elmt);
                    var obj = {
                        a: parseInt(res[1])
                        , b: parseInt(res[2])
                        , coeffs: res[3].split(',').map(parseFloat)
                    };
                    return obj
                })
            })
        })
        var audioContext = new AudioContext();
        var targetNode = audioContext.destination;
        // Create Audio Nodes
        Traj.Player.binauralNode = new BinauralModeled({
            audioContext: audioContext
        });
        //Create Audio Nodes
        Traj.Player.binauralAudio = new Audio(Traj.Player.audioFilePath);
        //var mediaElement = document.getElementById('source');
        var player = audioContext.createMediaElementSource(Traj.Player.binauralAudio);
        // Set HRTF dataset
        Traj.Player.binauralNode.HRTFDataset = modeledHRTFData;
        // Connect Audio Nodes
        player.connect(Traj.Player.binauralNode.input);
        Traj.Player.binauralNode.connect(targetNode);
        Traj.Player.binauralNode.setPosition(0, 0, 1);
        Traj.Player.wavesurfer = WaveSurfer.create({
            container: '#waveform'
            , waveColor: 'violet'
            , progressColor: 'purple'
        , });
        Traj.Player.wavesurfer.load(Traj.Player.audioFilePath);
    }
}