/*
Event manager handling both mutlitouch or mouse events
TODO: Handle both TOuch and Mouse events (for surface or new devices..)
*/

Traj.Events = {

    stream_orientation : false, //send or not the orientation via OSC
    rangeSlider : false, //display or not the range slider
    touchId : 0, //touch ID
    idRotateLeft : [], //?
    idRotateRight : [],//?
    isTransforming : false,
    isOrientationMode : false,
    touches : [], //array of touches
    drawing : false,
    transformationEventTimer : 0,
    holdEventTimer : 0,
    center2Touch : [],
    transformation : null, // null, 1touch, 2touch, 3touch


    handleMouseDown : function(evt) {
        if (Traj.View.touchState === 'wait') {
            Traj.View.touchState = '1touch';
            var evt_pos = Traj.Utils.event2CanvasPos(evt);
            var coords = Traj.Utils.convertCanvasPosIntoUnits(evt_pos);
            var z = 0;
            var t = Math.floor(evt.timeStamp);
            Traj.Manager.processCreateNewCurve(coords[0], coords[1], z, t);
            Traj.View.draw_startCurrentCurve(evt);
            Traj.View.last_event_pos =  evt_pos;
        }
    },

    handleMouseMove : function(evt) {
        if (Traj.View.touchState === '1touch') {
            var evt_pos = Traj.Utils.event2CanvasPos(evt);
            if (Traj.Manager.currentCurve !== null && Traj.Utils.distanceBtwPoints(evt_pos, Traj.View.last_event_pos) > Traj.View.DISTANCE_TRESHOLD) {
                var coords = Traj.Utils.convertCanvasPosIntoUnits(evt_pos);
                var z = 0;
                var t = Math.floor(evt.timeStamp);
                Traj.Manager.processAddPointToCurve(coords[0], coords[1], z, t);
                Traj.View.draw_updateCurrentCurve(evt);
                Traj.View.last_event_pos = evt_pos;  
            }
        }
    },

    handleMouseUp : function(evt) {
        var coords = Traj.Utils.convertCanvasPosIntoUnits(Traj.Utils.event2CanvasPos(evt));
        var z = 0;
        var t = Math.floor(evt.timeStamp);
        if (!Traj.Events.rangeSlider && Traj.Manager.currentCurve !== null) {
            Traj.Manager.processEndCurve(coords[0], coords[1], z, t); // cas dessin normal
        }
        Traj.View.touchState = 'wait';
        //"draw_updateCurrentCurve(evt);
    },


    addMouseEvents : function(canvas) {
        canvas.addEventListener("mousedown", Traj.Events.handleMouseDown, false);
        canvas.addEventListener("mousemove", Traj.Events.handleMouseMove, false);
        canvas.addEventListener("mouseup", Traj.Events.handleMouseUp, false);
    },

    //EVENTS INITIALIZATION
    initEvents : function() {

        Traj.Events.addMouseEvents(Traj.View.dyn_canvas);
 

        // functions that already make distinction between mobile or computer
        this.addSessionButtonEvents();

        Traj.Events.addPlayPauseEvent();

        Traj.View.setDefaultFeedbackDisplay();
    },

    addSessionButtonEvents : function() {
        sessionDivOverCanvas = $('#sessionDivOverCanvas'),
        sessionDiv = document.getElementById("lblCurrentSession");

        sessionDivOverCanvas.hide();
        sessionDivOverCanvas.addClass( "hide" );
        sessionDiv.addEventListener(Traj.Utils.getStartEventName(),function(){
            if (sessionDivOverCanvas.hasClass("hide")) {
                sessionDivOverCanvas.show();
                sessionDivOverCanvas.removeClass( "hide" ).addClass( "show" );
            } else if (sessionDivOverCanvas.hasClass("show")) {
                sessionDivOverCanvas.hide();
                sessionDivOverCanvas.removeClass( "show" ).addClass( "hide" );
            }
        });
        Traj.View.dyn_canvas.addEventListener(Traj.Utils.getStartEventName(), function() {
            if (sessionDivOverCanvas.hasClass("show")) {
                sessionDivOverCanvas.hide();
                sessionDivOverCanvas.removeClass( "show" ).addClass( "hide" );
            }
        }, false);
    },


    addFullscreenEvent : function() { 
        var header = document.getElementById('header');
        header.addEventListener('touchstart',function() {

            if (!document.fullscreenElement &&    // alternative standard method
               !document.mozFullScreenElement && !document.webkitFullscreenElement) {  // current working methods
                if (document.documentElement.requestFullscreen) {                  
                    document.documentElement.requestFullscreen();
                } else if (document.documentElement.mozRequestFullScreen) {
                    document.documentElement.mozRequestFullScreen();
                } else if (document.documentElement.webkitRequestFullscreen) {
                    document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
                }
            }
        },false);
    },

    addPlayPauseEvent : function() {
        var playButton = document.getElementById('playButton');
        var playPause = function() {
            if (playButton.innerHTML == 'Play') {
                //if multi mode, then gets the list of indexes otherwise use the current index
                var indexes = Traj.Player.isMulti ? Traj.Manager.getMultiPlayIndexes() : [Traj.Manager.currentCurveIndex];

                //filter the indexes for multiuser behaviors
                if(Traj.Manager.allowed_indexes != null){
                    var updated_indexes = [];
                    var cnt = 0;
                    for(var i = 0; i< indexes.length; i++){
                        if(Traj.Manager.allowed_indexes.indexOf(Traj.Manager.trajectories[indexes[i]].sourceNumber) !=-1){
                           updated_indexes[cnt] = indexes[i];
                           cnt ++; 
                        }
                    }
                    indexes = updated_indexes;
                }

                if(indexes.length >0 ){
                    Traj.Player.playCurves(indexes);
                    playButton.innerHTML = 'Pause';
                }
            } else {
                Traj.Player.stopPlayActions();
                playButton.innerHTML = 'Play';
            }
        };
        playButton.addEventListener(Traj.Utils.getStartEventName(),playPause,false);
    },
};




