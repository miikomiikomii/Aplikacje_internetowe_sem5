let map = L.map('map').setView([53.430127, 14.564802], 18);
// L.tileLayer.provider('OpenStreetMap.DE').addTo(map);
L.tileLayer.provider('Esri.WorldImagery').addTo(map);

Notification.requestPermission().then(permission => {
    console.log(permission);
});

let fullSizeCanvas = document.getElementById("fullSizeCanvas");
let fullSizeContext = fullSizeCanvas.getContext("2d");

const puzzle_count = 16;

function getContext() {
    const tilesPerSide = 4;
    const size = 400;               // fullSizeCanvas ma 400x400
    const tile = size / tilesPerSide; // 100

    for (let i = 0; i < tilesPerSide * tilesPerSide; i++) {
        const canvas = document.getElementById(`singleCanvas${i}`);
        const ctx = canvas.getContext("2d");

        // źródło w fullSizeCanvas: sx/sy = kolumna/wiersz * 100
        const sx = (i % tilesPerSide) * tile;
        const sy = Math.floor(i / tilesPerSide) * tile;

        // czyścimy i rysujemy odpowiedni wycinek 100x100 do kafelka
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(fullSizeCanvas, sx, sy, tile, tile, 0, 0, canvas.width, canvas.height);
    }
}



document.getElementById("saveButton").addEventListener("click", function() {
    leafletImage(map, function (err, canvas) {
        // here we have the canvas
        let rasterMap = document.getElementById("rasterMap");
        let rasterContext = rasterMap.getContext("2d");
        fullSizeContext.drawImage(canvas, 0, 0)
        document.getElementById("startPuzzle").disabled = false;
    });
});


document.getElementById("startPuzzle").addEventListener("click", function (){


    const tile = document.getElementById("canvasx");
    const target_Container = document.getElementById("targetContainer");
    const puzzle = document.getElementById("singleCanvasx");
    const puzzle_Container = document.getElementById("puzzleContainer");

    const x = puzzle_count;

    if(target_Container.childElementCount < x){
        for(let t = 0; t < x; t++){
            const node = tile.cloneNode(true);


            node.hidden = false;
            node.id = String("canvas" + t);
            target_Container.appendChild(node);
        }
        getTargets();
    }

    if(puzzle_Container.childElementCount < x){
        for(let p = 0; p < x; p++){
            const node = puzzle.cloneNode(true);
            node.hidden = false;
            node.id = String("singleCanvas" + p);
            puzzle_Container.appendChild(node);

            if (p>0 && p%((Math.floor(Math.random() * 3)) +1)){
                let first = document.getElementById("singleCanvas" + (p-1));
                node.after(first);
            }
        }
        getContext();
        getDragable();
    }
})


document.getElementById("getLocation").addEventListener("click", function(event) {
    if (! navigator.geolocation) { console.log("No geolocation."); }
    navigator.geolocation.getCurrentPosition(position => {
        console.log(position);
        let lat = position.coords.latitude;
        let lon = position.coords.longitude;


        let marker = L.marker([lat, lon]).addTo(map);

        new Notification("Current location:", {
            body: `Latitude: ${lat}  Altitude: ${lon}`,
        });

        map.setView([lat, lon]);
    }, positionError => {
        console.error(positionError);
    });
});

//=============================================
function getDragable() {
    let items = document.querySelectorAll('.item');
    for (let item of items) {
        item.addEventListener("dragstart", function (event) {
            this.style.border = "3px dashed #D8D8FF";
            event.dataTransfer.setData("text", this.id);
        });

        item.addEventListener("dragend", function (event) {
            this.style.borderWidth = "0";
        });
    }
}
function getTargets(){
let targets = document.querySelectorAll(".drag-target");

for (let target of targets) {
    target.addEventListener("dragenter", function (event) {
        this.style.border = "2px solid #7FE9D9";
    });

    target.addEventListener("dragover", function (event) {
        event.preventDefault();
    });
    target.addEventListener("drop", function (event) {
        let myElement = document.querySelector("#" + event.dataTransfer.getData('text'));
        if(this.childElementCount === 0) { this.appendChild(myElement) }

        console.log("Tile ID " + myElement.id + " correlated to Target ID: " + this.id)
        checkCompletion();

    }, false);
}

    function isCorrect(i) {
        const tile = document.getElementById("singleCanvas" + i);
        const target = document.getElementById("canvas" + i);
        return tile.parentElement === target;
    }
    let puzzleAmount = puzzle_count;
    function checkCompletion() {
        let correct = 0;


        for (let i = 0; i < puzzleAmount; i++) {
            if (isCorrect(i)) {
                correct++;
            }
        }

        if (correct === puzzleAmount) {
            console.log("Puzzle complete")
            new Notification("Puzzle finished!", {
                body: "Well done!"
            });
        }
    }

}



