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
let pathPoints = [];

function stopPainting(event) {
    painting = false;

    // TODO: 그림정보 전송 #1 or #2
    let data;
    // 1. canvas 데이터 통째로 이미지로 변환
    // data = canvas.toDataURL();
    // 2. 변경사항만 전달 (이 방법이 좋을듯)
    // type은 선 그리기(line), 네모 그리기 (rect), 원 그리기 (circle), 지우개(erase) 대충 요정도..?
    // data = JSON.stringify({
    //     type: 'line',
    //     startX: startX,
    //     startY: startY,
    //     endX: event.offsetX,
    //     endY: event.offsetY,
    //     strokeColor: ctx.strokeStyle,
    //     lineWidth: ctx.lineWidth
    // });

    data = JSON.stringify({
        type: 'free',
        points: pathPoints,
        strokeColor: ctx.strokeStyle,
        lineWidth: ctx.lineWidth
    });
    console.log('original data: ', data);

    socket.send(data);
    pathPoints = [];
}

function startPainting() {
    painting = true;
}

function onMouseMove(event) {
    const x = event.offsetX;
    const y = event.offsetY;
    if (!painting) {
        pathPoints.push({ x, y }); // 점을 배열에 저장
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
        let data = JSON.parse(text);
        // TODO: 받은 canvas 변경사항 정보를 ctx에 그려넣기
        switch (data.type) {
            case 'free': // 자유곡선
                ctx.strokeStyle = data.strokeColor;
                ctx.lineWidth = data.lineWidth;
                ctx.beginPath();
                ctx.moveTo(data.points[0].x, data.points[0].y);
                data.points.forEach(point => {
                    ctx.lineTo(point.x, point.y);
                    ctx.stroke();
                });
                break;
            case 'line':    //직선
                ctx.strokeStyle = data.strokeColor;
                ctx.lineWidth = data.lineWidth;
                ctx.beginPath();
                ctx.moveTo(data.startX, data.startY);
                ctx.lineTo(data.endX, data.endY);
                ctx.stroke();
                break;
            case 'rect':    // 사각형
                break;
            case 'circle':  //원
                break;
            case 'eraser':  //지우개 (자유곡선과 동일한 방식)
                break;
        }
    });
};
