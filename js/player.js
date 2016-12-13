Traj.Player = {
    loopMode: false,
    requestId: undefined,
    loopID: undefined,
    isPlaying: false,
    audioFilePath: "./snd/Hip_Hop_4_Break.wav",
    wavesurfer: undefined,
    binauralAudio: undefined,
    binauralPanner: undefined,
    markers : [0,300,460,600,770,900,1060,1200,1370, 1500, 1660, 1800, 1960, 2090, 2210, 2270],
	continu : false,
    //tempo : 123,
    
     //This methods plays the curves from their indexes
    playCurves: function (indexes) {
        Traj.Player.isPlaying = true;
        //Traj.Player.wavesurfer.play();
         Traj.Player.binauralAudio.play();
        
        //Find longest curves for the time slider range
        var longestCurveIdx = Traj.Manager.longestCurveIdxOfPlayedCurve(indexes);
        var maxDuration = Traj.Manager.trajectories[longestCurveIdx].getDuration();
        var dureeSon = Traj.Player.wavesurfer.getDuration() * 1000;
        Traj.Manager.selectCurve(longestCurveIdx);
        //time variables
        var begin = new Date().getTime()
            , now, pourcentage = 0;
        //initialization of the polar position list 
        var listePolaire = [];
        
        (function loopMulti() {
            // get time for new frame
            now = new Date().getTime() - begin;
            pourcentage = now / dureeSon;
            Traj.Player.wavesurfer.seekTo(pourcentage); //CHANGEMENT DE FONCTION LECTURE DU SON
            // clear dyn canvas
            Traj.View.dyn_repaint();
            //stop if the current time is less than the whole duration
            if (now > dureeSon) {
                //if loop mode then relaunch the playing
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
                    //do it only if the curve is not finished.  
                    //var idx = Traj.Utils.findPointIdx(now,curve),
                    if (Traj.Player.continu) {
						var pointCoord = Traj.Utils.interpolatePourcentage(pourcentage, curve)
                        	, x = pointCoord[0]
                        	, y = pointCoord[1]
                        	, z = 0
                        	, orientation = ['undefined', 'undefined', 'undefined'];
					}
					else {
						var pointCoord = Traj.Utils.interpolateMarker(pourcentage, curve)
                        	, x = pointCoord[0]
                        	, y = pointCoord[1]
                        	, z = 0
                        	, orientation = ['undefined', 'undefined', 'undefined'];
					}
                    if (!isNaN(x) && !isNaN(y)) {
                        var position = [x,y,z];
                        //console.log(position);
                        Traj.Player.repaintPointWithOrientation(curve, [x, y], orientation);
                        Traj.Player.binauralPanner.setSourcePositionByIndex(0,position);
                        Traj.Player.binauralPanner.update();
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
            Traj.Player.binauralAudio.pause();
            Traj.Player.binauralAudio.currentTime = 0;
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
    },
    ////////////////////////////////////
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
        var audioContext = new AudioContext();
        var serverDataBase = new binaural.sofa.ServerDataBase();
        
        // Audio Nodes
        Traj.Player.binauralPanner = new binaural.audio.BinauralPanner({
             audioContext: audioContext,
             crossfadeDuration: 0.05, // in seconds
             coordinateSystem: 'spat4Cartesian', // [x,y,z]
             sourceCount: 1,
             sourcePositions: [ [0, 0, 1] ], // initial position
             distAttenuationExponent: 1,
         });
        
        //Create Audio Nodes
        Traj.Player.binauralAudio = new Audio(Traj.Player.audioFilePath);
        var player = audioContext.createMediaElementSource(Traj.Player.binauralAudio);
      
        Traj.Player.binauralPanner.connectInputByIndex(0, player);
        Traj.Player.binauralPanner.connectOutputs(audioContext.destination);
        
        //Set HRTF dataset
        var hrtfUrl = "./libs/hrtf/IRC_1147_C_HRIR_M_44100.sofa.json";
        Traj.Player.binauralPanner.loadHrtfSet(hrtfUrl);
        Traj.Player.binauralPanner.setSourcePositionByIndex(0,[0, 1, 0]);
        
        // Create wave form wisualization
        Traj.Player.wavesurfer = WaveSurfer.create({
            container: '#waveform'
            , waveColor: 'violet'
            , progressColor: 'purple'
        , });
        Traj.Player.wavesurfer.load(Traj.Player.audioFilePath);
        
    }
}