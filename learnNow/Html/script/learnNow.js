
window.learnNow=function(opt){
    var rows = opt.rows           || 5;
    var columns = opt.columns     || 6;
    var obstacles = opt.obstacles || 3;
    var attempts = opt.attempts   || 50;
    
    var myCanvas;
    var ctx;
    var usq;
    var positions;
    var delay = 100; //in milliseconds
    var actions;
    var actionCounter = 0;
    var attemptCounter = 0;
    var dir, toDo;
    var i, j;
    var clean = false;
    var reposition = false;
    var myChart;
    var actionCounter = 0;

    createCanvas()
    init("learnNowCanvas")

    function createCanvas(){
        var wrapper = document.getElementById("learnNowWrapper");
        var element = document.createElement("canvas");
        element.id = "learnNowCanvas";
        wrapper.appendChild(element);
        wrapper.appendChild(document.createElement("br"));

        var ids = [
            "fetch",
            "genGraph1",
            "genGraph2",
            "genDataTb",
            "genNewData"
        ]
        var values = [
            "POST DATA",
            "ATTEMPTS GRAPH",
            "REWARDS GRAPH",
            "DATA TABLE",
            "GEN. NEW DATA"
        ]
        for (let i = 0; i < 5; i++){
            let btn = document.createElement("button");
            btn.type = "button";
            btn.id = ids[i];
            btn.innerHTML = values[i];
            wrapper.appendChild(btn);
        }
    }

    document.getElementById("fetch").addEventListener('click', sendData)
    document.getElementById("genGraph1").addEventListener('click', generateGraph1)
    document.getElementById("genGraph2").addEventListener('click', generateGraph2)
    document.getElementById("genDataTb").addEventListener('click', generateDataTable)
    document.getElementById("genNewData").addEventListener('click', generateNewData)

    addEventListener("resize", (event) => {
        resizer();
    })
    
    const handler1 = {
        set: function(obj, prop, value) {
          if (prop === 'clean' && value === true) {
            window.requestAnimationFrame(cleanEveryObject)
            myCleanProxy.clean = false;
          }
          obj[prop] = value;
          return true;
        }
      };
      
    const myCleanProxy = new Proxy({ clean }, handler1);
    
    const handler2 = {
        set: function(obj, prop, value) {
          if (prop === 'reposition' && value === true) {
            window.requestAnimationFrame(placePieces);
            myRepositionProxy.reposition = false;
          }
          obj[prop] = value;
          return true;
        }
      };
      
    const myRepositionProxy = new Proxy({ clean }, handler2);
    
    /**
     * Init
     * initialize the base position of items and the grid dimensions
     * @param {string} idName 
     * @returns {string} [INFO] creation completed
     */
    
    function init(){
        myCanvas = document.getElementById("learnNowCanvas");
        ctx = myCanvas.getContext("2d");
        //get wrapper dimension
        let width = 0.65 * myCanvas.parentElement.clientWidth;
        //apply to canvas
        updateDimension(width);
        usq = myCanvas.width / columns;
        //create grid
        myCanvas.height = rows * usq + 2;
        createGrid();
        assignItemPositions();
        placePieces();
        return "Grid and pieces successfully created";
    }
    
    /**
     * Update Dimensions
     * update dimensions on wrapper resize
     * @param {int} width 
     * @returns {string} [INFO] new square dimensions
     */
    
    function updateDimension(width){
        myCanvas.width = width;
        return "New dimension is: " + width;
    }
    
    /**
     * Resizer
     * updates grid dimensions and pieces positions
     * @returns {string} [INFO] pieces and grid successfully repositioned
     */
    
    function resizer(){
        let width = 0.65 * myCanvas.parentElement.clientWidth;
        usq = width / columns;
        updateDimension(width);
        myCanvas.height = rows * usq;
        createGrid();
        placePieces();
        if (myChart)
            myChart.update();
        return "Put the new pieces back and new grid dimensions";
    }
    
    /**
     * Create Grid
     * create/recreate grid onload or on window resize
     * @returns {stirng} [INFO] grid created
     */
    
    function createGrid(){
        for (let i = 0; i < rows; i++)
            for (let j = 0; j < columns; j++){
                createSquares(i, j);
            }
        return "Grid created";
    }
    
    /**
     * Create Squares
     * creates the squares that rapresents the grid divisions
     * @param {int} i row position
     * @param {int} j columns position
     * @returns {string} [INFO] square creation success
     */
    
    function createSquares(i, j){
        ctx.beginPath();
        ctx.strokeStyle = "white";
        ctx.rect(j * usq, i * usq, usq, usq);
        ctx.stroke();
        return "Squares successfully placed and created"
    }
    
    /**
     * Assign Item Positions
     * assign each new item to the respective position
     * @returns {string} [INFO] successful item generation
     */
    
    function assignItemPositions(){
        positions = getPiecesPosition();
    
        if (sessionStorage.getItem('positions') != null)
            positions = JSON.parse(sessionStorage.getItem("positions"));
        else{
            positions[0] = ["square", positions[0]];
            positions[1] = ["triangle", positions[1]];
            for (let i = 2; i < positions.length; i++)
                positions[i] = ["circle", positions[i]];
        }
        return "Item positions successfully generated";
    }
    
    /**
     * Get Pieces Position
     * creates random number positions for the items
     * @returns {Array.<Array.<int>>}
     */
    
    function getPiecesPosition(){
        let position = [];
        let allCells = [];
        let temp;
        for (let i = 0; i < rows * columns; i++)
            allCells.push(i);
    
        let counter = 0;
        let index;
        for (let i = 0; i < rows; i++)
            for (let j = 0; j < columns; j++){
                if (i == rows - 1 && j == 0)
                    index = counter
                counter++;
            }
        allCells.splice(index, 1)
    
        for (let i = 0; i < obstacles + 2; i++){
            temp = getRandomInt(allCells.length);
            value = allCells[temp];
            allCells.splice(temp, 1);
            position.push(positionTraslator(value));
        }
        return position;
    }
    
    /**
     * Get Random Int
     * creates a random integer given from the a max value
     * @param {int} max 
     * @returns {int} a random value between 0 and max - 1
     */
    
    function getRandomInt(max) {
        return Math.floor(Math.random() * max);
    }
    
    /**
     * Position Translator 
     * translates from an int position of the grid to an array of x and y position
     * @param {int} value 
     * @returns {Array.<int>} [x, y] positions
     */
    
    function positionTraslator(value){
        let counter = 0;
        for (let i = 0; i < rows; i++)
            for (let j = 0; j < columns; j++){
                if (counter == value)
                    return [i, j];
                counter++
            }
    }
    
    /**
     * Place Pieces
     * places pieces in their respective position
     * @returns {string} [INFO] object placed successfully
     */
    
    function placePieces(){
        for (let i = 0; i < positions.length; i++){
            if (i == 0)
                drawSquare(positions[i][1]);
            else if (i == 1)
                drawTriangle(positions[i][1]);
            else
                drawCircle(positions[i][1]);
        }
        return "Pieces successfully positioned";
    }
    
    /**
     * Draw Circle
     * draws the obstacles in their respective position
     * @param {Array.<int>} pos 
     * @returns {string} [INFO] object placed successfully
     */
    
    function drawCircle(pos){
        let diameter = 0.4 * usq; //40% based on the diameter, 80% based on the radius
        ctx.beginPath();
        ctx.arc(leftCircleDistance(pos[1]), topCircleDistance(pos[0]),diameter,0,2*Math.PI);
        ctx.fillStyle = "#e71d36";
        ctx.fill();
        return "Circle successfully created and positioned";
    }
    
    /**
     * Left Circle Distance
     * calculates the distance from the left of the canvas
     * @param {int} x 
     * @returns {int} distance from the left of the canvas
     */
    
    function leftCircleDistance(x){
        return usq * x + usq / 2;
    }
    
    /**
     * Top Circle Distance
     * calculates the distance from the top of the canvas
     * @param {int} x 
     * @returns {int} distance from the top of the canvas
     */
    
    function topCircleDistance(y){
        return usq * y + usq / 2;
    }
    
    /**
     * Draw Square
     * draws the square in his respective position
     * @param {Array.<int>} pos 
     * @returns {stirng} [INFO] object placed successfully
     */
    
    function drawSquare(pos){
        let squareSide = 0.7 * usq;
        ctx.beginPath();
        ctx.rect(leftSquareDistance(pos[1], squareSide), topSquareDistance(pos[0], squareSide), squareSide, squareSide);
        ctx.fillStyle = "#2ec4b6";
        ctx.fill();
        return "Square successfully created and positioned";
    }
    
    /**
     * Top Square Distance
     * calculates the distance from the top of the canvas
     * @param {int} x 
     * @returns {int} distance from the top of the canvas
     */
    
    function topSquareDistance(x, l){
        return usq * x + (usq - l) / 2;
    }
    
    /**
     * Left Square Distance
     * calculates the distance from the left of the canvas
     * @param {int} x 
     * @returns {int} distance from the left of the canvas
     */
    
    function leftSquareDistance(y, l){
        return usq * y + (usq - l) / 2;
    
    }
    
    /**
     * Draw Triangle
     * draws the triangle in his respective position
     * @param {Array.<int>} pos 
     * @returns {string} [INFO] object placed successfully
     */
    
    function drawTriangle(pos){
        let b = 0.7 * usq;
        let h = Math.sqrt(Math.pow(b, 2) - Math.pow(0.5 * b, 2));
    
        ctx.beginPath();
        let startPositionY = ((usq - h) / 2 + h) + usq * pos[0];
        let startPositionX =  (usq / 2) + usq * pos[1];
        ctx.moveTo(startPositionX, startPositionY);
        ctx.lineTo(startPositionX - b * 0.5, startPositionY);
        ctx.lineTo(startPositionX, startPositionY - h);
        ctx.lineTo(startPositionX + b * 0.5, startPositionY);
        ctx.closePath();
    
        ctx.fillStyle = "#ff9f1c";
        ctx.fill();
        return "Triangle successfully created and positioned";
    }
    
    /**
     * Move
     * moves the square
     * @param {string} direction 
     * @returns {string} [INFO] gives info on where the square moved from
     */
    
    function move(direction){
        let dontSleep = false;
        if (toDo)
            direction = dir;
        let temp = positions[0][1][1] + ", " + positions[0][1][0];
        deleteOldSquare(positions[0][1][1], positions[0][1][0]);
        switch(direction){
            case "Up":
                if (positions[0][1][0] != 0)
                    positions[0][1][0]--;
                else
                    dontSleep = true;
            break;
            case "Down":
                if (positions[0][1][0] != rows - 1)
                    positions[0][1][0]++;
                else
                    dontSleep = true;
            break;
            case "Left": 
                if (positions[0][1][1] != 0)
                    positions[0][1][1]--;
                else
                    dontSleep = true;
            break;
            case "Right":
                if (positions[0][1][1] != columns - 1)
                    positions[0][1][1]++;
                else
                    dontSleep = true;
            break;
            default: 
                console.log("Has been requested a non-correct direction");
        }
        placePieces();
        if (!dontSleep)
            sleep(delay);
        return "Piece successfully moved from " + temp + " to " + positions[0][1][1] + ", " + positions[0][1][0]; 
    }
    
    /**
     * Delete Old Square
     * deletes old square from the old position
     * @param {int} x 
     * @param {int} y 
     * @returns {string} [INFO] object deleted successfully
     */
    
    function deleteOldSquare(x, y){
        let l = 0.7 * usq;
        ctx.clearRect(leftSquareDistance(x, l) - 2, topSquareDistance(y, l) - 2, l + 4, l + 4);
        return "Old square successfully deleted";
    }
    
    async function sendData(){
        const baseUrl = 'http://127.0.0.1:8091/positions'
        sessionStorage.clear(500)
        sessionStorage.setItem('positions', JSON.stringify(positions))
        fetch(baseUrl,
        {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "rows": rows,
                "columns": columns,
                "positions": positions,
                "attempts": attempts
            })
        }).then(response =>
            response.json().then(data => ({
                data: data
            })
        ).then(res => {
            actions = res.data["result"];
            document.getElementsByTagName("h3")[0].style.visibility = "visible";
            document.getElementsByTagName("h3")[1].style.visibility = "visible";
            generateGraph1();
            i = 0;
            j = 0;
            window.requestAnimationFrame(draw)
        }));
    }
    
    function cleanEveryObject(){
        for (let i = 0; i < rows + 1; i++)
            for (let j = 0; j < columns + 1; j++)
                deleteItem(i, j);
    }

    function deleteItem(x, y){
        let l = 0.7 * usq;
        ctx.clearRect(y * usq + 1, x * usq + 1, usq - 2, usq - 2);
    }

    var alternateColorBool = true;

    function addTableItem(){
        var divItemsContainer = document.getElementById("tableItemsContainer");
        var row = document.createElement("div");
        row.className = "tbRow";
        if (alternateColorBool){
            row.style.backgroundColor = "#003566";
            alternateColorBool = false;
        }
        else{
            row.style.backgroundColor = "#001d3d";
            alternateColorBool = true;
        }
        row.style.height = "30px";
        
        var items = [];
        let w = divItemsContainer.offsetWidth / 3;

        for (let i = 0; i < 3; i++) {
            items[i] = document.createElement("div");
            items[i].style.width = (w-6) + "px"; // Set width as a string with 'px' unit
            items[i].id = "divItem"+(i+1);
            items[i].style.color = "#fff"
            items[i].style.lineHeight = "200%"

            let nAtt = actions[actionCounter]["Action" + actionCounter][0]["Moves"].replace("[", "").replace("]", "").split(", ").length;
            let reward = actions[actionCounter]["Action" + actionCounter][1]["Rewards"];
            let values = [actionCounter+1, nAtt, reward];

            items[i].innerHTML = values[i];
            row.appendChild(items[i]);
        }

        divItemsContainer.prepend(row);
        divItemsContainer.style.overflowY = "scroll";
        divItemsContainer.style.height = "200px"
    }
    
    function draw(){
        let countToTwo = 0;

        if (i != actions.length && j != actions[i]["Action"+i][0]["Moves"].length){
            move(getDirection(actions[i]["Action"+i][0]["Moves"].replace("[","").replace("]","").split(", ")[j]))
            j++;
            if (j - 1 == actions[i]["Action"+i][0]["Moves"].replace("[","").replace("]","").split(", ").length){
                addTableItem();
                j = 0;
                i++;
                sleep(200);
                actionCounter++;
    
                myChart.data.datasets.forEach((dataset) => {
                    if (countToTwo == 1){
                        dataset.data.push(actions[actionCounter-1]["Action"+(actionCounter-1)][0]["Moves"].replace("[","").replace("]","").split(", ").length);
                        dataset.backgroundColor = getPointsColor();
                        dataset.borderColor = 'rgba(229, 229, 229, 0.1)';
                    }
                    else
                        countToTwo++;
                });
                myChart.update();
    
                myCleanProxy.clean = true;
                positions = JSON.parse(sessionStorage.getItem("positions"));
                myRepositionProxy.reposition = true;
            }
        }
        window.requestAnimationFrame(draw)
    }
    
    function getDirection(dir){
        dir = parseInt(dir)
        switch (dir){
            case 0: return "Left";
            case 1: return "Down";
            case 2: return "Right";
            case 3: return "Up";
        }
    }
    
    function sleep(ms){
        const date = Date.now();
        let currentDate = null;
        do {
            currentDate = Date.now();
        } while(currentDate - date < ms)
    }
    
    function generateNewData(){
        positions = getPiecesPosition();
        sessionStorage.clear()
    
        positions[0] = ["square", positions[0]];
        positions[1] = ["triangle", positions[1]];
        for (let i = 2; i < positions.length; i++)
            positions[i] = ["circle", positions[i]];
        cleanEveryObject();
        placePieces()
        return "Item positions successfully generated";
    }
    
    function generateGraph1(){
        let xValues = getDataPointsX();
    
        const data = {
            labels: xValues,
            datasets: [{
                label: "Reward: 0.0, goal not reached",
                data: [], //yValues
                fill: false,
                borderColor: 'rgba(229, 229, 229, 0.1)',
                backgroundColor: [], //pointBackGroundColors
                tensions: 0.1
            },
            {
                label: "Reward: 1.0, goal reached",
                backgroundColor: "#2ec4b6"
            }]
        }
    
        const options = {
            responsive: true,
            animation: false,
            scales: {
                x: {
                    grid:{
                        color: 'rgba(255,255,255,0.1)'
                    }
                },
                y: {
                    grid:{
                        color: 'rgba(255,255,255,0.1)'
                    }
                }
            },
            plugins:{
                legend:{
                    display:false
                }
            }
        }
    
        myChart = new Chart("chart1", {
            type: "line",
            data: data,
            options: options
        });
    }
    
    function getPointsColor(){
        let blt = [];
        for (let i = 0; i < actionCounter; i++)
            if (actions[i]["Action"+i][1]["Rewards"] == '0.0')
                blt.push("#e71d36");
            else 
                blt.push("#2ec4b6");
        return blt;
    }
    
    function getDataPointsY1(){
        let blt = [];
        for (let i = 1; i < actionCounter + 1; i++)
            blt.push(actions[i]["Action"+i][0]["Moves"].replace("[","").replace("]","").split(", ").length);
        return blt;
    }
    
    function getDataPointsX(){
        let blt = [];
        for (let i = 0; i < actions.length; i++)
            blt.push(i+1);
        return blt;
    }
    
    function generateGraph2(){
        let xValues = getDataPointsX();
        let yValues = getDataPointsY2();
    
        const data = {
            labels: xValues,
            datasets: [{
                label: "Victory rate",
                data: yValues,
                fill: true,
                borderColor: 'rgba(252,163,17,0.5)',
                raduis: 0,
                pointRaduis: 0,
                tensions: 0.1
            }]
        }
    
        const options = {
            responsive: true,
            scales: {
                x: {
                    grid:{
                        color: 'rgba(255,255,255,0.1)'
                    }
                },
                y: {
                    grid:{
                        color: 'rgba(255,255,255,0.1)'
                    }
                }
            },
            plugins:{
                legend:{
                    display:false
                }
            }
        }
        myChart = new Chart("chart2", {
            type: "line",
            data: data,
            options: options
        });
    }
    
    function getDataPointsY2(){
        let blt = []
        for (let i = 0; i < actions.length; i++)
            if (actions[i]["Action"+i][1]["Rewards"] == '0.0')
                blt.push(0);
            else 
                blt.push(1);
        return blt
    }
    
    function generateDataTable(){
    
    }
}
