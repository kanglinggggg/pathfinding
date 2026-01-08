const gridEl = document.getElementById("grid");
const setStartBtn = document.getElementById("setStart");
const setEndBtn = document.getElementById("setEnd");
const runAlgoBtn = document.getElementById("runAlgo");
const clearBtn = document.getElementById("clearBtn");
const mazeBtn = document.getElementById("mazeBtn");
const weightBtn = document.getElementById("weightBtn");
const algoSelect = document.getElementById("algoSelect");
const gridSizeInput = document.getElementById("gridSize");

let rows = parseInt(gridSizeInput.value);
let cols = rows;
let cellSize = 25;
let startCell = null;
let endCell = null;
let isMouseDown = false;
let weightMode = false;
let currentMode = "wall";
let isRunning = false;

let cellElements = [];
let cellData = [];

// Grid Creation
function createGrid(r,c){
  rows = r; cols = c;
  gridEl.style.gridTemplateColumns = `repeat(${cols}, ${cellSize}px)`;
  gridEl.style.gridTemplateRows = `repeat(${rows}, ${cellSize}px)`;
  gridEl.innerHTML = '';
  cellElements = [];
  cellData = [];
  startCell = null;
  endCell = null;

  for(let i=0;i<rows;i++){
    const rowElems = [];
    const rowData = [];
    for(let j=0;j<cols;j++){
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.r = i;
      cell.dataset.c = j;

      cell.onmousedown = (e)=>{ handleCellClick(e, cell); isMouseDown=true; };
      cell.onmouseenter = (e)=>{ if(isMouseDown) handleCellClick(e, cell); };
      cell.onmouseup = ()=>{ isMouseDown=false; };
      cell.oncontextmenu = (e)=>e.preventDefault();

      gridEl.appendChild(cell);
      rowElems.push(cell);
      rowData.push({wall:false, weight:1});
    }
    cellElements.push(rowElems);
    cellData.push(rowData);
  }
}
createGrid(rows, cols);

// Button Events
setStartBtn.onclick = ()=>{ currentMode="start"; };
setEndBtn.onclick = ()=>{ currentMode="end"; };
weightBtn.onclick = ()=>{ weightMode=!weightMode; weightBtn.textContent=weightMode?"Weight Mode: ON":"Toggle Weight Mode"; };
gridSizeInput.onchange = ()=>{ createGrid(parseInt(gridSizeInput.value), parseInt(gridSizeInput.value)); };
clearBtn.onclick = ()=>{ createGrid(rows, cols); };
mazeBtn.onclick = ()=>{ generateMaze(); };
runAlgoBtn.onclick = ()=>{ 
  if(isRunning) return;
  const algo = algoSelect.value;
  if(algo==="bfs") runBFS();
  else if(algo==="dfs") runDFS();
  else if(algo==="dijkstra") runDijkstra();
  else if(algo==="astar") runAStar();
};

// Cell Click Logic
function handleCellClick(e, cell){
  if(isRunning) return;
  const r = parseInt(cell.dataset.r);
  const c = parseInt(cell.dataset.c);

  if(currentMode==="start"){
    if(startCell) startCell.classList.remove("start");
    startCell = cell;
    cell.classList.remove("wall","path","visited","weight");
    cell.classList.add("start");
    currentMode="wall";
    return;
  }
  if(currentMode==="end"){
    if(endCell) endCell.classList.remove("end");
    endCell = cell;
    cell.classList.remove("wall","path","visited","weight");
    cell.classList.add("end");
    currentMode="wall";
    return;
  }

  if(weightMode){
    if(cell===startCell||cell===endCell) return;
    const data = cellData[r][c];
    if(data.weight===1){ data.weight=5; cell.classList.add("weight"); }
    else{ data.weight=1; cell.classList.remove("weight"); }
  } else {
    if(cell===startCell||cell===endCell) return;
    const data = cellData[r][c];
    data.wall=!data.wall;
    cell.classList.toggle("wall", data.wall);
    cell.classList.remove("visited","path","weight");
  }
}

function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }
function getNeighbors(r,c){
  const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
  const result = [];
  for(const [dr,dc] of dirs){
    const nr=r+dr, nc=c+dc;
    if(nr>=0&&nr<rows&&nc>=0&&nc<cols) result.push([nr,nc]);
  }
  return result;
}
function clearVisuals(){
  for(let i=0;i<rows;i++) for(let j=0;j<cols;j++){
    const cell = cellElements[i][j];
    if(!cell.classList.contains("start")&&!cell.classList.contains("end")&&!cell.classList.contains("wall")&&!cell.classList.contains("weight")){
      cell.classList.remove("visited","path");
    }
  }
}

async function animatePath(parents, endR, endC){
  let path = [];
  let cur = `${endR},${endC}`;
  while(parents[cur]){
    path.push(cur.split(",").map(Number));
    cur = parents[cur];
  }
  path.reverse();
  for(const [r,c] of path){
    const cell = cellElements[r][c];
    if(cell!==startCell && cell!==endCell) cell.classList.add("path");
    await sleep(20);
  }
}

// BFS
async function runBFS(){
  if(!startCell||!endCell){ alert("Set start and end."); return; }
  isRunning=true; clearVisuals();
  const sr=parseInt(startCell.dataset.r), sc=parseInt(startCell.dataset.c);
  const er=parseInt(endCell.dataset.r), ec=parseInt(endCell.dataset.c);

  const visited = Array.from({length:rows},()=>Array(cols).fill(false));
  const parent = {};
  const queue = [[sr,sc]];
  visited[sr][sc]=true;

  while(queue.length){
    const [r,c] = queue.shift();
    if(r===er && c===ec){ await animatePath(parent, er, ec); isRunning=false; return; }
    for(const [nr,nc] of getNeighbors(r,c)){
      if(!visited[nr][nc] && !cellData[nr][nc].wall){
        visited[nr][nc]=true;
        parent[`${nr},${nc}`]=`${r},${c}`;
        queue.push([nr,nc]);
        const cell = cellElements[nr][nc];
        if(cell!==startCell && cell!==endCell) cell.classList.add("visited");
        await sleep(20);
      }
    }
  }
  alert("No path found."); isRunning=false;
}

// DFS
async function runDFS(){
  if(!startCell||!endCell){ alert("Set start and end."); return; }
  isRunning=true; clearVisuals();
  const sr=parseInt(startCell.dataset.r), sc=parseInt(startCell.dataset.c);
  const er=parseInt(endCell.dataset.r), ec=parseInt(endCell.dataset.c);

  const visited = Array.from({length:rows},()=>Array(cols).fill(false));
  const parent = {};
  const stack = [[sr,sc]];
  visited[sr][sc]=true;

  while(stack.length){
    const [r,c] = stack.pop();
    if(r===er && c===ec){ await animatePath(parent, er, ec); isRunning=false; return; }
    for(const [nr,nc] of getNeighbors(r,c)){
      if(!visited[nr][nc] && !cellData[nr][nc].wall){
        visited[nr][nc]=true;
        parent[`${nr},${nc}`]=`${r},${c}`;
        stack.push([nr,nc]);
        const cell = cellElements[nr][nc];
        if(cell!==startCell && cell!==endCell) cell.classList.add("visited");
        await sleep(20);
      }
    }
  }
  alert("No path found."); isRunning=false;
}

// Dijkstra
async function runDijkstra(){
  if(!startCell||!endCell){ alert("Set start and end."); return; }
  isRunning=true; clearVisuals();
  const sr=parseInt(startCell.dataset.r), sc=parseInt(startCell.dataset.c);
  const er=parseInt(endCell.dataset.r), ec=parseInt(endCell.dataset.c);

  const dist = Array.from({length:rows},()=>Array(cols).fill(Infinity));
  const parent = {};
  const visited = Array.from({length:rows},()=>Array(cols).fill(false));
  dist[sr][sc]=0;

  const pq = [[sr,sc,0]];

  while(pq.length){
    pq.sort((a,b)=>a[2]-b[2]);
    const [r,c,d] = pq.shift();
    if(visited[r][c]) continue;
    visited[r][c]=true;
    if(r===er && c===ec){ await animatePath(parent, er, ec); isRunning=false; return; }

    for(const [nr,nc] of getNeighbors(r,c)){
      if(cellData[nr][nc].wall) continue;
      const cost = cellData[nr][nc].weight || 1;
      if(dist[nr][nc]>dist[r][c]+cost){
        dist[nr][nc]=dist[r][c]+cost;
        parent[`${nr},${nc}`]=`${r},${c}`;
        pq.push([nr,nc,dist[nr][nc]]);
        const cell = cellElements[nr][nc];
        if(cell!==startCell && cell!==endCell) cell.classList.add("visited");
        await sleep(20);
      }
    }
  }
  alert("No path found."); isRunning=false;
}

// A*
function manhattan([x1,y1],[x2,y2]){ return Math.abs(x1-x2)+Math.abs(y1-y2); }
async function runAStar(){
  if(!startCell||!endCell){ alert("Set start and end."); return; }
  isRunning=true; clearVisuals();
  const sr=parseInt(startCell.dataset.r), sc=parseInt(startCell.dataset.c);
  const er=parseInt(endCell.dataset.r), ec=parseInt(endCell.dataset.c);

  const gScore = Array.from({length:rows},()=>Array(cols).fill(Infinity));
  const fScore = Array.from({length:rows},()=>Array(cols).fill(Infinity));
  const parent = {};
  const open = [[sr,sc]];
  gScore[sr][sc]=0;
  fScore[sr][sc]=manhattan([sr,sc],[er,ec]);

  while(open.length){
    open.sort((a,b)=>fScore[a[0]][a[1]]-fScore[b[0]][b[1]]);
    const [r,c] = open.shift();
    if(r===er && c===ec){ await animatePath(parent, er, ec); isRunning=false; return; }

    for(const [nr,nc] of getNeighbors(r,c)){
      if(cellData[nr][nc].wall) continue;
      const tentative = gScore[r][c] + (cellData[nr][nc].weight||1);
      if(tentative<gScore[nr][nc]){
        gScore[nr][nc]=tentative;
        fScore[nr][nc]=tentative+manhattan([nr,nc],[er,ec]);
        parent[`${nr},${nc}`]=`${r},${c}`;
        open.push([nr,nc]);
        const cell = cellElements[nr][nc];
        if(cell!==startCell && cell!==endCell) cell.classList.add("visited");
        await sleep(20);
      }
    }
  }
  alert("No path found."); isRunning=false;
}

// Maze Generator
function generateMaze(){
  createGrid(rows,cols);
  for(let i=0;i<rows;i++) for(let j=0;j<cols;j++){
    cellData[i][j].wall=true;
    cellElements[i][j].classList.add("wall");
  }

  const visited = Array.from({length:rows},()=>Array(cols).fill(false));
  const stack = [];
  const startR = Math.floor(Math.random()*(rows-2))+1;
  const startC = Math.floor(Math.random()*(cols-2))+1;
  visited[startR][startC]=true;
  cellData[startR][startC].wall=false;
  cellElements[startR][startC].classList.remove("wall");
  stack.push([startR,startC]);

  const dirs = [[2,0],[-2,0],[0,2],[0,-2]];

  while(stack.length){
    const [r,c] = stack[stack.length-1];
    const neighbors = [];
    for(const [dr,dc] of dirs){
      const nr=r+dr, nc=c+dc;
      if(nr>0 && nr<rows-1 && nc>0 && nc<cols-1 && !visited[nr][nc]) neighbors.push([nr,nc,dr,dc]);
    }
    if(neighbors.length===0){ stack.pop(); continue; }
    const [nr,nc,dr,dc] = neighbors[Math.floor(Math.random()*neighbors.length)];
    visited[nr][nc]=true;
    cellData[nr][nc].wall=false; cellElements[nr][nc].classList.remove("wall");
    const midR=r+dr/2, midC=c+dc/2;
    cellData[midR][midC].wall=false; cellElements[midR][midC].classList.remove("wall");
    stack.push([nr,nc]);
  }
}