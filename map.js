var container = document.getElementById("container");
var content = document.getElementById("content");
var search = document.getElementById('search');

var canvas = document.getElementById('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
var context = canvas.getContext("2d");
var searchCanvas = document.getElementById('canvas');
searchCanvas.width = window.innerWidth;
searchCanvas.height = window.innerHeight;
var searchContext = searchCanvas.getContext("2d");
var maxSearchResults = 30;
var scaleFactor = 1.1;
var mapImg = new Image();
var tiersImg = new Image();
var namesImg = new Image();
var uniquesImg = new Image();
var upgradesImg = new Image();
var smallNamesImg = new Image();
var smallUniquesImg = new Image();
var selectedImg = new Image();
var completedImg = new Image();
var selectedButtons = [];
var buttons = [];
var showNames =  true;
var showTiers = true;
var showUniques = false;
var showUpgrades = false;
var landscape = true;
var isLarge = true;
var shouldDraw = true;
atlasTracker = localStorage;

mapImg.src = 'Images/atlas.jpg';
tiersImg.src = 'Images/AtlasTier.png'
namesImg.src = 'Images/AtlasNames.png';
uniquesImg.src = 'Images/AtlasUnique.png';
upgradesImg.src = 'Images/AtlasUpgrades.png';
smallNamesImg.src = 'Images/AtlasNamesSmall.png';
smallUniquesImg.src = 'Images/AtlasUniquesSmall.png';
selectedImg.src = 'Images/Selected.png';
completedImg.src = 'Images/Completed.png'
// Screen variables
var zoomValue = 1;
var originX = 0;
var originY = 0;
var width = 0;
var height = 0;
var endX = 0;
var endY = 0;
var mapHeight = 0;
var mapWidth = 0;
var mapX = 0;
var mapY = 0;

// Mouse varaibles
var mouseX = 0;
var mouseY = 0;
var lastX = 0;
var lastY = 0;
var dragStart;
var isPressed = false;
var isKeyPressed = false;

// Remove scroll bars
document.documentElement.style.overflow = 'hidden';  // firefox, chrome
document.body.scroll = "no"; // ie only
onselectstart="return false;"

var loadButtons = function(){
    createButtons();
    if (localStorage.getItem("buttons") != null){
        var temp = (JSON.parse(localStorage.getItem("buttons")));
        for (i = 0; i < temp.length; i++){
            if (temp[i].completed){
                buttons[i].completed = temp[i].completed;
                addInstance(i, selectedButtons);
            }
        }
    }
}

function trackTransforms(context){
    var svg = document.createElementNS("http://www.w3.org/2000/svg",'svg');
	var xform = svg.createSVGMatrix();
	context.getTransform = function(){ return xform; };

    var scale = context.scale;
    context.scale = function(sx, sy){
        xform = xform.scaleNonUniform(sx, sy);
        zoomValue = zoomValue * sx;
        shouldDraw = true;
        draw();
        return scale.call(context, sx, sy);
    };

    var translate = context.translate;
    context.translate = function(dx,dy){
        xform = xform.translate(dx, dy);
        originX = xform.e;
        originY = xform.f;
        shouldDraw = true;
        draw();
        return translate.call(context, dx, dy);
    };

    var pt = svg.createSVGPoint();
    context.transformedPoint = function(x, y){
        pt.x = x; pt.y = y;
        return pt.matrixTransform(xform.inverse());
    }

}

function detectMobile() {
   if( navigator.userAgent.match(/Android/i)
    || navigator.userAgent.match(/webOS/i)
    || navigator.userAgent.match(/iPhone/i)
    || navigator.userAgent.match(/iPad/i)
    || navigator.userAgent.match(/iPod/i)
    || navigator.userAgent.match(/BlackBerry/i)
    || navigator.userAgent.match(/Windows Phone/i)
    ){
        return true;
    } else {
        return false;
    }
}

$(window).resize(function() {
    // Refresh page when it changes size
    if (!detectMobile()){
        window.location.reload(false);
    }
});

$(document).on("click" || "change", "input[type='checkbox']", function () {
    // Handle Checkboxes
    showNames = $("#mapCheckbox").is(':checked');
    showTiers = $("#tierCheckbox").is(':checked');
    showUniques = $("#uniqueCheckbox").is(':checked');
    showUpgrades = $("#upgradesCheckbox").is(':checked');
    isLarge = $("#largeTextCheckbox").is(':checked');

    shouldDraw = true;
});

$('*').mouseenter(function(){;
    var currentCursor = $(this).css('cursor') ;
    if (currentCursor != "default"){
        isPressed = false;
        dragStart = null;
    }
});

$('*').mouseleave(function(){
    isPressed = false;
    dragStart = null;
});

function setCanvas(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if ((canvas.width / canvas.height) > 16.0 / 9.0){
        mapHeight = canvas.height;
        mapWidth = canvas.height * 16.0 / 9.0;
        mapX = (canvas.width - mapWidth) / 2;
        mapY = 0;
        landscape = true;
    } else{
        landscape = false;
        mapHeight = canvas.width * 9.0 / 16.0;
        mapWidth = canvas.width;
        mapX = 0;
        mapY = (canvas.height - mapHeight) / 2;;
    }
}

function removeInstance(value, array){
    // Remove instance of value from array
    var index = array.indexOf(i);
    if (index > - 1){
        selectedButtons.splice(index, 1);
    }

}

function addInstance(value, array){
    // Adds the value to the array if it does not already exist
    if (array.indexOf(value) < 0){
        array.push(value);
    }

}

function reset () {
    var xLimit1 = (canvas.width - (canvas.width * zoomValue));
    var yLimit1 = (canvas.height - (canvas.height * zoomValue));
    var xLimit2 = - xLimit1 + canvas.width;
    var yLimit2 = - yLimit1 + canvas.height;
    var shouldReset = false;
    if (originX < xLimit1 - 0.1){
        if(!isPressed){
            context.translate((xLimit1 - originX) / 10.0, 0);
        }
        shouldReset = true;
    }
    if (originY < yLimit1 - 0.1){
        if(!isPressed){
            context.translate(0,  (yLimit1 - originY) / 10.0);
        }
        shouldReset = true;
    }
    if (endX > xLimit2 + 0.1){
        if(!isPressed){
            context.translate((xLimit2 - endX) / 10.0, 0);
        }
        shouldReset = true;
    }
    if (endY > yLimit2 + 0.1){
        if(!isPressed){
            context.translate(0,  (yLimit2 - endY) / 10.0);
        }
        shouldReset = true;
    }
    return shouldReset;
}

function checkButtons(){
// Draw selected buttons
        var countSelected = 0;
        var searchValue = document.getElementById('search').value;
        var searchLength = searchValue.length;
        var index = 0;
        for (i = 0; i < buttons.length; i++){

            if (countSelected < maxSearchResults && searchLength > 0 &&
            (buttons[i].name.toUpperCase().includes(searchValue.toUpperCase()) ||
            buttons[i].tier == searchValue)){
                countSelected = countSelected + 1;
                buttons[i].selected = true;
                addInstance(i, selectedButtons);
            }
            else{
                buttons[i].selected = false;
                if(!buttons[i].completed){
                    removeInstance(i, selectedButtons);
                }
            }
        }
        if (countSelected >= maxSearchResults){
            document.getElementById("systemText").innerHTML = "Showing first " + countSelected + " results found";
        }
        else{
            document.getElementById("systemText").innerHTML = "";
        }
}

function drawButtons(){
    for(i = 0; i < selectedButtons.length; i++){
        buttons[selectedButtons[i]].draw();
    }
}

var draw = function () {
    if(shouldDraw){
        setTimeout(function() {
            requestAnimationFrame(draw);
            // Clear canvas
            var origin = context.transformedPoint(0, 0);
            var dimension = context.transformedPoint(canvas.width, canvas.height);
            context.clearRect(origin.x, origin.y, dimension.x - origin.x, dimension.y - origin.y);

            // Draw map
            context.drawImage(mapImg, mapX, mapY, mapWidth, mapHeight);
            if(showUpgrades){
               context.drawImage(upgradesImg, mapX, mapY, mapWidth, mapHeight);
            }
            if(showNames){
                if(isLarge){
                    context.drawImage(namesImg, mapX, mapY, mapWidth, mapHeight);
                }
                else{
                    context.drawImage(smallNamesImg, mapX, mapY, mapWidth, mapHeight);
                }
            }
            if(showTiers){
                  context.drawImage(tiersImg, mapX, mapY, mapWidth, mapHeight);
            }
            if(showUniques){
               if(isLarge){
                   context.drawImage(uniquesImg, mapX, mapY, mapWidth, mapHeight);
               }
                else{
                    context.drawImage(smallUniquesImg, mapX, mapY, mapWidth, mapHeight);
                }
            }

            // Set some variables
            width = canvas.width * zoomValue;
            height = canvas.height * zoomValue;
            endX = width + originX;
            endY = height + originY

            if(isKeyPressed){
                checkButtons();
            }

            drawButtons();
            // var ratioX =  ((mouseX-(1920 - 1697.77777777777)  / 2) /1697.77777777777);
            // var ratioY = mouseY / 955;

            if(!reset() && !isKeyPressed){
                shouldDraw = false;
            }
        }, 1000 / 30);

			var atlasBonus = 0;

		for (i = 0; i < buttons.length; i++){
			if(buttons[i].completed == true){
				atlasBonus = atlasBonus + 1;
			}
		}

		document.getElementById("systemText").innerHTML = "Atlas Bonus: " + atlasBonus + "/" + buttons.length;
   }
}


class Button{
    constructor(name, tier, x, y){
        this.name = name;
        this.x = mapX + x * mapWidth;
        this.y = mapY + y * mapHeight;
        this.radius = canvas.width / 150;
        this.selected = false;
        this.completed = false;
        this.tier = tier;
    }

    draw(){
        if (this.completed){
            searchContext.drawImage(completedImg, this.x - this.radius * 2, this.y - this.radius * 2, this.radius * 2, this.radius * 2);
        }
        if (this.selected){
//          searchContext.moveTo(this.x, this.y - this.radius);
//          searchContext.ellipse((this.x - this.radius) , this.y - this.radius, this.radius, this.radius, 0, 2 * Math.PI, 0);
            searchContext.drawImage(selectedImg, this.x - this.radius * 2, this.y - this.radius * 2, this.radius * 2, this.radius * 2);
        }
    }

    isPressed(mX, mY){
        return (Math.sqrt(Math.pow((mX - (this.x - this.radius * 0.75)), 2) + Math.pow((mY - (this.y - this.radius * 0.75)), 2)) < this.radius);
    }
}

function createButtons(){
    // Secteur haut - gauche - corner
    buttons.push(new Button("Malformation", 1, 0.1768, 0.1602));
    buttons.push(new Button("Precinct", 1, 0.235, 0.146));
    buttons.push(new Button("Dig", 1, 0.288, 0.139));
    buttons.push(new Button("Leyline", 1, 0.405, 0.139));
    buttons.push(new Button("Conservatory", 1, 0.355, 0.17));
    buttons.push(new Button("Grotto", 1, 0.291, 0.203));
    buttons.push(new Button("Vaults of atziri", 1, 0.3372, 0.192));
    buttons.push(new Button("Vaal pyramid", 1, 0.3475, 0.225));
    buttons.push(new Button("Shrine", 1, 0.1725, 0.251));
    buttons.push(new Button("Chateau", 1, 0.174, 0.312));
    buttons.push(new Button("Perandus manor", 1, 0.1765389082462253, 0.36041666666666666));
    buttons.push(new Button("Terrace", 1, 0.2154471544715447, 0.2989583333333333));
    buttons.push(new Button("Castle ruins", 1, 0.24332171893147503, 0.2333333333333333));
    buttons.push(new Button("Phantasmagoria", 1, 0.24796747967479674, 0.3260416666666666));
    buttons.push(new Button("Academy", 1, 0.29442508710801396, 0.2604166666666667));

    // Secteur haut - droit - corner

    buttons.push(new Button("Arena", 1, 0.6608594657375145, 0.146875));
    buttons.push(new Button("Core", 1, 0.7311265969802555, 0.159375));
    buttons.push(new Button("Lava lake", 1, 0.7880371660859465, 0.146875));
    buttons.push(new Button("Carcass", 1, 0.8391405342624855, 0.16041666666666668));
    buttons.push(new Button("Barrows", 1, 0.6666666666666667, 0.19791666666666669));
    buttons.push(new Button("Arachnid nest", 1, 0.7020905923344948, 0.215625));
    buttons.push(new Button("Pit", 1, 0.7200929152148664, 0.28541666666666665));
    buttons.push(new Button("Caldera", 1, 0.7560975609756098, 0.26145833333333335));
    buttons.push(new Button("Lair", 1, 0.7955865272938444, 0.271875));
    buttons.push(new Button("Crimson temple", 1, 0.8449477351916376, 0.253125));
    buttons.push(new Button("Thicket", 1, 0.7502903600464577, 0.3260416666666666));
    buttons.push(new Button("Reef", 1, 0.7984901277584204, 0.37083333333333335));
    buttons.push(new Button("Shipyard", 1, 0.8443670150987224, 0.36041666666666666));
    buttons.push(new Button("Bone crypt", 1, 0.7549361207897793, 0.38229166666666664));
    buttons.push(new Button("Olmec's Sanctum", 1, 0.7723577235772358, 0.3458333333333334));
    buttons.push(new Button("Canyon", 1, 0.8310104529616724, 0.45625));

    // Secteur bas - droit - corner

    buttons.push(new Button("Tower", 1, 0.8205574912891985, 0.5697916666666667));
    buttons.push(new Button("Geode", 1, 0.789198606271777, 0.578125));
    buttons.push(new Button("Estuary", 1, 0.7508710801393729, 0.64375));
    buttons.push(new Button("Siege", 1, 0.7828106852497096, 0.6885416666666667));
    buttons.push(new Button("Colosseum", 1, 0.8373983739837398, 0.678125));
    buttons.push(new Button("Relic chambers", 1, 0.7276422764227642, 0.6822916666666667));
    buttons.push(new Button("Arachnid tomb", 1, 0.7531939605110337, 0.7260416666666667));
    buttons.push(new Button("Palace", 1, 0.8403019744483159, 0.7802083333333333));
    buttons.push(new Button("Dark forest", 1, 0.7903600464576074, 0.778125));
    buttons.push(new Button("Defiled cathedral", 1, 0.7102206736353078, 0.753125));
    buttons.push(new Button("Gardens", 1, 0.7555168408826946, 0.78125));
    buttons.push(new Button("Desert spring", 1, 0.8222996515679442, 0.8427083333333333));
    buttons.push(new Button("Sepulchre", 1, 0.7491289198606271, 0.8541666666666667));
    buttons.push(new Button("Ancient city", 1, 0.6933797909407666, 0.7979166666666667));
    buttons.push(new Button("Toxic sewer", 1, 0.6747967479674797, 0.8416666666666667));

    // Secteur bas - gauche - corner

    buttons.push(new Button("Basilica", 1, 0.19686411149825783, 0.6197916666666666));
    buttons.push(new Button("Primordial blocks", 1, 0.17421602787456447, 0.6927083333333333));
    buttons.push(new Button("Courtyard", 1, 0.23228803716608595, 0.7));
    buttons.push(new Button("The Vinktar Square", 1, 0.22938443670150988, 0.6541666666666667));
    buttons.push(new Button("Summit", 1, 0.1753774680603949, 0.7760416666666667));
    buttons.push(new Button("Courthouse", 1, 0.22764227642276424, 0.7802083333333333));
    buttons.push(new Button("Sunken city", 1, 0.18118466898954705, 0.85625));
    buttons.push(new Button("Acid caverns", 1, 0.25261324041811845, 0.86875));
    buttons.push(new Button("Park", 1, 0.28106852497096396, 0.7760416666666667));
    buttons.push(new Button("Cage", 1, 0.33159117305458774, 0.7791666666666667));
    buttons.push(new Button("Waste pool", 1, 0.3118466898954704, 0.834375));
    buttons.push(new Button("Moon temple", 1, 0.3542392566782811, 0.8489583333333333));
    buttons.push(new Button("Arcade", 1, 0.3977932636469222, 0.8770833333333333));
    buttons.push(new Button("The twilight temple", 1, 0.3263646922183508, 0.8125));

    // Secteur haut - gauche - centre

    buttons.push(new Button("Cursed crypt", 1, 0.42973286875725897, 0.2041666666666667));
    buttons.push(new Button("Coward's trial", 1, 0.4059233449477352, 0.22395833333333331));
    buttons.push(new Button("Iceberg", 1, 0.4396051103368177, 0.2583333333333333));
    buttons.push(new Button("Laboratory", 1, 0.40185830429732866, 0.2635416666666667));
    buttons.push(new Button("The putrid cloister", 1, 0.36875725900116146, 0.26875));
    buttons.push(new Button("Temple", 1, 0.305458768873403, 0.3177083333333333));
    buttons.push(new Button("Museum", 1, 0.35714285714285715, 0.2947916666666667));
    buttons.push(new Button("Poorjoy's Asylum", 1, 0.3420441347270616, 0.32083333333333336));
    buttons.push(new Button("Spider forest", 1, 0.3472706155632985, 0.35208333333333336));
    buttons.push(new Button("City square", 1, 0.40069686411149824, 0.34895833333333337));
    buttons.push(new Button("Waterways", 1, 0.27119628339140534, 0.41770833333333335));
    buttons.push(new Button("Primordial pools", 1, 0.32113821138211385, 0.3770833333333334));
    buttons.push(new Button("Necropolis", 1, 0.3257839721254356, 0.415625));
    buttons.push(new Button("Death and Taxes", 1, 0.30313588850174217, 0.44583333333333336));
    buttons.push(new Button("Ghetto", 1, 0.3699186991869919, 0.4239583333333334));
    buttons.push(new Button("Tropical island", 1, 0.44134727061556334, 0.36770833333333336));
    buttons.push(new Button("Alleyways", 1, 0.4715447154471545, 0.3729166666666666));
    buttons.push(new Button("Wharf", 1, 0.45993031358885017, 0.425));
    buttons.push(new Button("Atoll", 1, 0.424506387921022, 0.41770833333333335));
    buttons.push(new Button("Strand", 1, 0.4314750290360046, 0.46979166666666666));
    buttons.push(new Button("Maelstrom of Chaos", 1, 0.3908246225319396, 0.3927083333333334));
    buttons.push(new Button("Whakawairua Tuahu", 1, 0.40940766550522645, 0.45));

    // Secteur bas - gauche - centre

    buttons.push(new Button("Colonnade", 1, 0.23112659698025553, 0.43020833333333336)); // Mauvais name
    buttons.push(new Button("Lava chamber", 1, 0.25261324041811845, 0.4864583333333334));
    buttons.push(new Button("Cells", 1, 0.32113821138211385, 0.49375));
    buttons.push(new Button("Pen", 1, 0.37456445993031356, 0.4979166666666666));
    buttons.push(new Button("Plaza", 1, 0.22996515679442509, 0.5375));
    buttons.push(new Button("Mao kun", 1, 0.24680603948896632, 0.5833333333333334));
    buttons.push(new Button("Channel", 1, 0.31997677119628337, 0.5427083333333333));
    buttons.push(new Button("Infested valley", 1, 0.31997677119628337, 0.6125));
    buttons.push(new Button("Shore", 1, 0.2590011614401858, 0.6145833333333334));
    buttons.push(new Button("Coves", 1, 0.30139372822299654, 0.7052083333333333));
    buttons.push(new Button("Flooded mine", 1, 0.38211382113821135, 0.5458333333333334));
    buttons.push(new Button("Fungal hollow", 1, 0.42566782810685244, 0.5510416666666667));
    buttons.push(new Button("Excavation", 1, 0.3699186991869919, 0.6197916666666666));
    buttons.push(new Button("Vault", 1, 0.36062717770034847, 0.7052083333333333));
    buttons.push(new Button("Racecourse", 1, 0.3699186991869919, 0.7770833333333332));
    buttons.push(new Button("Marshes", 1, 0.4146341463414634, 0.6104166666666666));
    buttons.push(new Button("Beach", 1, 0.45934959349593496, 0.6041666666666666));
    buttons.push(new Button("Dungeon", 1, 0.41056910569105687, 0.6895833333333333)); // Blanc
    buttons.push(new Button("Sulphur vents", 1, 0.4738675958188153, 0.6552083333333333));
    buttons.push(new Button("Spider lair", 1, 0.4465737514518003, 0.6770833333333333));
    buttons.push(new Button("Armoury", 1, 0.3989547038327526, 0.7635416666666667));
    buttons.push(new Button("Glacier", 1, 0.4268292682926829, 0.7552083333333333));
    buttons.push(new Button("Ramparts", 1, 0.46922183507549364, 0.7354166666666667));

    // Secteur bas - droite - centre

    buttons.push(new Button("Pier", 1, 0.5580720092915215, 0.6010416666666667));
    buttons.push(new Button("Factory", 1, 0.535423925667828, 0.628125));
    buttons.push(new Button("Vaal temple", 1, 0.5127758420441347, 0.6552083333333333));
    buttons.push(new Button("Villa", 1, 0.5296167247386759, 0.671875));
    buttons.push(new Button("Scriptorium", 1, 0.5609756097560975, 0.6572916666666667));
    buttons.push(new Button("Peninsula", 1, 0.5993031358885017, 0.6479166666666667));
    buttons.push(new Button("Lookout", 1, 0.6184668989547039, 0.6895833333333333));
    buttons.push(new Button("Graveyard", 1, 0.5307781649245064, 0.7145833333333332));
    buttons.push(new Button("Overgrown shrine", 1, 0.5017421602787456, 0.7447916666666667));
    buttons.push(new Button("Mineral pools", 1, 0.5760743321718932, 0.7083333333333333));
    buttons.push(new Button("Crater", 1, 0.6283391405342624, 0.7479166666666667));
    buttons.push(new Button("Mud Geyser", 1, 0.6556329849012776, 0.765625));
    buttons.push(new Button("Mesa", 1, 0.6329849012775842, 0.7989583333333333));
    buttons.push(new Button("Burial chambers", 1, 0.5969802555168409, 0.7666666666666667));
    buttons.push(new Button("Wasteland", 1, 0.6045296167247387, 0.8333333333333333));
    buttons.push(new Button("Promenade", 1, 0.5714285714285715, 0.8104166666666667));
    buttons.push(new Button("Lighthouse", 1, 0.5458768873403019, 0.778125));
    buttons.push(new Button("Overgrown ruins", 1, 0.5232288037166086, 0.7666666666666667));
    buttons.push(new Button("Acton's Nightmare", 1, 0.4912891986062718, 0.7697916666666668));
    buttons.push(new Button("Hall of Grandmasters", 1, 0.5505226480836236, 0.8104166666666667));

    // Secteur haut - droite - centre

    buttons.push(new Button("Bazaar", 1, 0.48606271777003485, 0.23125));
    buttons.push(new Button("Plateau", 1, 0.5615563298490127, 0.19895833333333332));
    buttons.push(new Button("Underground river", 1, 0.5209059233449477, 0.23020833333333332));
    buttons.push(new Button("Bog", 1, 0.616144018583043, 0.234375));
    buttons.push(new Button("Maze", 1, 0.59465737514518, 0.3041666666666667));
    buttons.push(new Button("Port", 1, 0.5412311265969802, 0.3177083333333333));
    buttons.push(new Button("Desert", 1, 0.47909407665505227, 0.3197916666666667));
    buttons.push(new Button("Fields", 1, 0.5336817653890824, 0.36979166666666663));
    buttons.push(new Button("Ivory temple", 1, 0.5795586527293844, 0.3614583333333334));
    buttons.push(new Button("Jungle valley", 1, 0.5598141695702671, 0.4197916666666666));
    buttons.push(new Button("Arid lake", 1, 0.6144018583042974, 0.41666666666666663));
    buttons.push(new Button("Dunes", 1, 0.6811846689895471, 0.3375));
    buttons.push(new Button("Arsenal", 1, 0.6579558652729385, 0.2885416666666667));
    buttons.push(new Button("Mausoleum", 1, 0.6231126596980255, 0.47916666666666663));
    buttons.push(new Button("Haunted mansion", 1, 0.599883855981417, 0.575));
    buttons.push(new Button("Residence", 1, 0.6655052264808363, 0.484375));
    buttons.push(new Button("Underground sea", 1, 0.6515679442508712, 0.384375));
    buttons.push(new Button("Coral ruins", 1, 0.724157955865273, 0.4822916666666666));
    buttons.push(new Button("Crystal ore", 1, 0.7764227642276422, 0.47708333333333336));
    buttons.push(new Button("Ashen wood", 1, 0.6649245063879211, 0.5791666666666666));
    buttons.push(new Button("Belfry", 1, 0.727061556329849, 0.5604166666666667));
    buttons.push(new Button("Orchard", 1, 0.6573751451800233, 0.6833333333333332));
    buttons.push(new Button("Cemetery", 1, 0.68931475029036, 0.6916666666666668));
    buttons.push(new Button("Hollowed ground", 1, 0.705574912891986, 0.6135416666666667));
    buttons.push(new Button("Pillars of arun", 1, 0.6823461091753775, 0.36770833333333336));
    buttons.push(new Button("Oba's cursed trove", 1, 0.6724738675958188, 0.4375));
    buttons.push(new Button("Caer Blaidd, Wolfpack's Den", 1, 0.508130081300813, 0.26875));
    buttons.push(new Button("Doryani's Machinarium", 1, 0.578397212543554, 0.2572916666666667));
    buttons.push(new Button("Volcano", 1, 0.7148664343786295, 0.38333333333333336));
}

function save(){
    localStorage.setItem("buttons", JSON.stringify(buttons));
}

// Mouse functions
function addEvent(obj, evt, fn) {
    if (obj.addEventListener) {
        obj.addEventListener(evt, fn, false);
    }
    else if (obj.attachEvent) {
        obj.attachEvent("on" + evt, fn);
    }
}

var zoom = function(delta){
   var pt = context.transformedPoint(lastX, lastY);
    if (zoomValue * (Math.pow(scaleFactor, delta)) > 0.9 && zoomValue * (Math.pow(scaleFactor, delta)) < 3){
       context.translate(pt.x, pt.y);
       context.scale(Math.pow(scaleFactor, delta), Math.pow(scaleFactor, delta));
       context.translate(-pt.x, -pt.y);
       draw();
    }
}

var handleScroll = function(evt){
    var delta = evt.wheelDelta ? evt.wheelDelta / 40 : evt.detail ? -evt.detail : 0;
    if (delta){
        zoom(delta)
        return evt.preventDefault() && false;
    }
};

canvas.addEventListener('mousemove', function(evt){
    mouseX = evt.clientX;
    mouseY = evt.clientY;
    var mX = context.transformedPoint(mouseX, 0).x;
    var mY = context.transformedPoint(0, mouseY).y;
    var hover = false;
    for (i = 0; i < buttons.length; i++){
        if (buttons[i].isPressed(mX, mY)){
            shouldDraw = true;
            document.body.style.cursor = "pointer";
            hover = true;
        }
    }
    if (!hover){
        document.body.style.cursor = "default";
    }
    lastX = evt.offsetX;
    lastY = evt.offsetY;
    if (dragStart){
        var pt = context.transformedPoint(lastX, lastY);
        context.translate(pt.x - dragStart.x, pt.y - dragStart.y);
    }
});

canvas.addEventListener('mousedown', function(evt){
    lastX = evt.offsetX;
    lastY = evt.offsetY;
    isPressed = true;
    if ($(this).css('cursor') == "default"){
        dragStart = context.transformedPoint(lastX, lastY);
    }
});

canvas.addEventListener('mouseup', function(evt){
    dragStart = null;
    isPressed = false;
    shouldDraw = true;
    reset();
});

addEvent(document, "mouseout", function(e) {
    e = e ? e : window.event;
    var from = e.relatedTarget || e.toElement;
    if (!from || from.nodeName == "HTML") {
        dragStart = null;
        isPressed = false;
    }
});

addEvent(document, "click", function(e){
    if (!dragStart){
        var mX = context.transformedPoint(mouseX, 0).x;
        var mY = context.transformedPoint(0, mouseY).y;
        for (i = 0; i < buttons.length; i++){
            if (buttons[i].isPressed(mX, mY)){
                if(buttons[i].completed){
                    buttons[i].completed = false;
                    if(!buttons[i].selected){
                        removeInstance(i, selectedButtons);
                    }
                }
                else{
                    buttons[i].completed = true;
                    addInstance(i, selectedButtons);
                }
            }
        }
    }
    draw();
});

addEvent(document, "keydown" || "keypressed", function(e){
    checkButtons();
    draw();
    shouldDraw = true;
    isKeyPressed = true;
});


addEvent(document, "keyup", function(e){
    checkButtons();
    draw();
    shouldDraw = true;
    isKeyPressed = false;
});

canvas.addEventListener('DOMMouseScroll', handleScroll, false);
canvas.addEventListener('mousewheel', handleScroll, false);

window.onload = function () {
    setCanvas();

    trackTransforms(context);
    loadButtons();

    draw();
};

/* Tool to capture pos */
/*
  function getMousePos(canvas, evt, zoomValue) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: (100 * ((evt.clientX + 13) - 107) / 1722) / 100,
      y: (100 * ((evt.clientY + 10) - 8) / 960) / 100
    };
  }

var contextTest = canvas.getContext('2d');

  canvas.addEventListener('mousedown', function(evt) {
    var mousePos = getMousePos(canvas, evt, zoomValue);
    var message = mousePos.x + ', ' + mousePos.y;
    console.log(message);
    document.getElementById("search").value = message;
  }, false);
*/

/* Force settings temp */
showNames = false;
showTiers = false;
showUniques = false;
showUpgrades = false;
isLarge = false;