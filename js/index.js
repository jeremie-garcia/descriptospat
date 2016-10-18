/*
* This is the Index file creating the Traj Namespace and Initializaiton functions.
*/

var Traj = {

    logging : false, //if we want to logg data from the users
    onmobile : false, //running on mobile or desktop
    
    // Application Constructor
    initialize: function () {

        if (navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry|IEMobile)/)) {
            this.onmobile = true
            this.initFastClick();
        } else {
            console.log("Je suis sur une machine");
        }

        //Initializations
        Traj.View.initCanvas(); //Drawing
        Traj.Session.initStorage(); //storage
        Traj.Events.initEvents(); // Events

        //avoid contextual menus on links
        window.oncontextmenu = function(event) {
            event.preventDefault();
            event.stopPropagation();
            return false;
        };

        //called before exiting the window to save the current trajectories in the current session
        window.onbeforeunload = function (e) {
            Traj.Session.saveInSelectedSession();
         };


         //init wavefrom and audio
         Traj.Player.initAudioFileArea()
    },

    //use to improve the touch speed on mobile devices
    initFastClick: function () {
        window.addEventListener('load', function () {
            FastClick.attach(document.body);
        }, false);
    },
};
