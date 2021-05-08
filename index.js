const EMPTY_ROD = 11;
const rods = [false,1,EMPTY_ROD,EMPTY_ROD];
var position = { x: 0, y: 0 };

function init() {
    reset();
    initInteractables();

    $("#auto").click((e) => {
        algorithm($("#delay").val());
    });
    $("#reset").click((e) => {
        reset();
    });

    $(() => $('[data-toggle="tooltip"]').tooltip());
}

function initInteractables() {
    
    interact('.disk-wrapper').draggable({
        listeners: {
            start (event) {
                position.x = 0;
                position.y = 0;
            },
            move (event) {
                position.x += event.dx;
                position.y += event.dy;

                event.target.style.transform =
                    `translate(${position.x}px, ${position.y}px)`;
                event.target.style.position= "relative";
                event.target.style.zIndex="1000";
                
            },
            end(event) {
                event.target.style = "";
            },
        }

    })

    interact('.rod').dropzone({
        overlap: 0.5,
        accept: '.top',
        ondrop: function (event) {
            moveDiskIfPossible(event.target.id,$("#" + event.relatedTarget.id));
            return false;
        },
    })

    
}


// auto solve optimal algorithm for the towers.
function algorithm(delay){
    //reset game to starting conditions
    reset();
    // determine amount of disks and optimal move count
    const diskCount = $(".disk-wrapper").length;
    const moves = $("#optimal").val();

    var functions = [];
    // compute moves and queue them with a delay to be executed synchronously
    for (var i=0;i<moves;i++){
        functions.push(() => {
            var move = nextMove(diskCount%2);
            const disk = $("#disk-" + rods[move.src]);
            console.log(delay);
            return disk.delay(delay).queue(moveDiskIfPossible(move.dest,disk));
        });
        
    }
    
    // actual visual execution
    execute(functions);
}

// execute the queue of actions recursively to allow 
// synchronously animation of disk moves
function execute(functionArray) { 
    
    if(functionArray.length > 0 ) {       
        const func = functionArray.splice(0,1);
        
        func[0]().promise().done(() => execute(functionArray));
    }
}

function nextMove(direction) {
    var validRods = {src: null, dest: null};
    //moves alternate between smallest disk and second smallest disk
    if (rods[0]) {
        // second smallest disk move
        // find the two rods without the smallest disk on top
        var validRodsArray = [];
        for (var i = 1;i<=3;i++)
            if (rods[i] != 1){
                validRodsArray.push({rod:i,top:rods[i]});
            }

        // determine the second smallest disk and where to move it
        if (validRodsArray[0].top < validRodsArray[1].top){
            validRods.src = validRodsArray[0].rod;
            validRods.dest = validRodsArray[1].rod;
        }
        else {
            validRods.src = validRodsArray[1].rod;
            validRods.dest = validRodsArray[0].rod;
        }
    } else {
        // smallest disk move. 
        // Always move in the same direction, 
        // which depends on whether there is an even or odd number of disks
        validRods.src = rods.indexOf(1); 
        // the direction changes according to the disk count to ensure 
        // that all disks start in rod 1 and end in rod 3
        validRods.dest = getDestRod(validRods.src,direction);
    }

    //alternate the next move between the two possible ones
    rods[0] = !rods[0]; 
    return validRods;
}

function getDestRod(src,direction) {
    if (direction)
        return src===1?3:(src-1); // move to the next rod: 1->3, 3->2, 2->1
    return 1 + src%3; // move to the next rod: 1->2, 2->3, 3->1
}

// checks if it is possible to move the given disk to the given rod
// if possible make the move, update the move count, 
// and update the rods array with current top disks
function moveDiskIfPossible(rodTarget,disk){
    
    // check if move is possible
    if (rods[parseInt(rodTarget)] > parseInt(disk.attr("data-value"))){
        // make the move
        $("#" + rodTarget).prepend(disk);
        // update move count in the UI
        $("#move").val(parseInt($("#move").val())+1);
        // update rods with current top disks
        updateTops();  
    }
    console.log(rods);
}

// update rods array with current top disks
function updateTops(){
    for (var i = 1;i <=3;i++){
        // update current top disk in the UI 
        // and get its value for the rods array
        rods[i] = parseInt($("#"+i).find(".disk-wrapper").removeClass("top").first().addClass("top").attr("data-value"));
        rods[i] = rods[i]?rods[i]:EMPTY_ROD;
    }
}

function reset(){
    
    rods[0] = false;
    $(".rod").empty();
    $("#move").val(0);
    const disks = parseInt($("#disks").val());
    $("#optimal").val(Math.pow(2,disks)-1);
    for (var i = 1;i <= disks;i++) 
        $("#1.rod").append(createDisk(i,disks));
    updateTops();
}

function createDisk(i,disks) {
    return $("#template").clone().removeClass("d-none")
                         .attr("id","disk-" + i)
                         .attr("data-value",i)
                         .addClass("disk-wrapper")
                         .find(".disk")
                         .addClass("disk-"+i)
                         .css("width",  (i/disks)*100+"%")
                         .find("span").text(i)
                         .end().end();
                         
}