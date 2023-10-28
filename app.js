const canvas = document.getElementById("jsCanvas");
const ctx = canvas.getContext("2d");
const colors = document.getElementsByClassName("jsColor");
const range = document.getElementById("jsRange");
const mode = document.getElementById("jsMode");
const saveBtn = document.getElementById("jsSave");

const INITIAL_COLOR = "#000000";
const CANVAS_SIZE = 700;

ctx.strokeStyle = "#2c2c2c";

canvas.width = CANVAS_SIZE;
canvas.height = CANVAS_SIZE;

ctx.fillStyle = "white";
ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

ctx.strokeStyle = INITIAL_COLOR;
ctx.fillStyle = INITIAL_COLOR;
ctx.lineWidth = 2.5; /* 라인 굵기 */

let painting = false;
let filling = false;

let socket = new WebSocket("ws://localhost:8001");

let startX, startY;

function stopPainting(event) {
    painting = false;

    // TODO: 그림정보 전송 #1 or #2
    let data;
    // data = canvas.toDataURL(); // 1. canvas 데이터 통째로 이미지로 변환
    data = JSON.stringify({
        type: 'line',   // type은 선 그리기(line), 네모 그리기 (rect), 원 그리기 (circle), 지우개(erase) 대충 요정도..?
        startX: startX,
        startY: startY,
        endX: event.offsetX,
        endY: event.offsetY,
        color: ctx.strokeStyle,
        lineWidth: ctx.lineWidth
    }); // 2. 변경사항만 전달 (이 방법이 좋을듯)
    console.log('original data: ', data);

    socket.send(data);
}

function startPainting() {
    painting = true;
}

function onMouseMove(event) {
    const x = event.offsetX;
    const y = event.offsetY;
    if (!painting) {
        startX = x;
        startY = y;
        ctx.beginPath();
        ctx.moveTo(x, y);
    } else {
        ctx.lineTo(x, y);
        ctx.stroke();
    }
}

function handleColorClick(event) {
    const color = event.target.style.backgroundColor;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
}

function handleRangeChange(event) {
    const size = event.target.value;
    ctx.lineWidth = size;
}

function handleModeClick() {
    if (filling === true) {
        filling = false;
        mode.innerText = "Fill";
    } else {
        filling = true;
        mode.innerText = "Paint";
    }
}

function handleCanvasClick() {
    if (filling) {
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    }
}

// 우클릭 방지
/*
function handleCM(event) {
   event.preventDefault();
 }
 */

function handleSaveClick() {
    const image = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = image;
    link.download = "PaintJS[EXPORT]";
    link.click();
}

if (canvas) {
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mousedown", startPainting);
    canvas.addEventListener("mouseup", stopPainting);
    // canvas.addEventListener("mouseleave", stopPainting);
    canvas.addEventListener("click", handleCanvasClick);
    // canvas.addEventListener("contextmenu", handleCM);

}

Array.from(colors).forEach(color =>
    color.addEventListener("click", handleColorClick));


if (range) {
    range.addEventListener("input", handleRangeChange);
}

if (mode) {
    mode.addEventListener("click", handleModeClick);
}

if (saveBtn) {
    saveBtn.addEventListener("click", handleSaveClick);
}

// 메시지를 수신하고, 수신한 메시지를 div#messages에 보여줍니다.
socket.onmessage = function (event) {
    let message = event.data;

    // let messageElem = document.createElement("div");
    message.text().then((text) => {
        console.log('received data: ', text);
        // TODO: 받은 canvas 변경사항 정보를 ctx에 그려넣기
        if (text.type === 'line') {
            ctx.strokeStyle = text.color;
            ctx.lineWidth = text.lineWidth;
            ctx.beginPath();
            ctx.moveTo(text.startX, text.startY);
            ctx.lineTo(text.endX, text.endY);
            ctx.stroke();
        }

        // TODO:
        // Blocking point: 전송하는 데이터가 잘려서 옴 (여기서 막혀서 고민중)
        // ex)  original data:  {"type":"line","startX":215,"startY":261,"endX":267,"endY":281,"color":"#000000","lineWidth":2.5}
        //      received data:  {"type":"line","startX":215,"startY":261,"endX":26
    });
};
