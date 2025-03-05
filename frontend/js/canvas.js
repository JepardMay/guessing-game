import sendMessage from './socket.js';
import { user } from "./user.js";
import { DATA_TYPES, DRAW_ACTIONS } from './consts.js';

const canvas = document.getElementById('drawing-board');
const toolbar = document.getElementById('toolbar');
const colorInput = document.getElementById('strokeColor');
const sizeInput = document.getElementById('lineWidth');
const breakpoint = matchMedia('(max-width: 600px)');

const ctx = canvas.getContext('2d');

// Drawing State
let isDrawing = false;
let lineWidth = sizeInput.value;
let strokeStyle = colorInput.value;

// Set canvas size based on screen width
const setCanvasSize = () => {
  if (breakpoint.matches) {
    canvas.width = 300;
    canvas.height = 300;
  } else {
    canvas.width = 500;
    canvas.height = 500;
  }
};

const startDrawing = (evt) => {
  isDrawing = true;
};

const stopDrawing = () => {
  isDrawing = false;

  // Send "stop" action to the server
  sendDrawingData(DRAW_ACTIONS.STOP);
  ctx.stroke();
  ctx.beginPath();
};

// Draw on the canvas
const draw = (evt) => {
  if (!isDrawing || !user.isActive) {
    return;
  }

  const { x, y } = getEventCoordinates(evt);

  // Send "draw" action to the server
  sendDrawingData(DRAW_ACTIONS.DRAW, x, y);
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';

  ctx.lineTo(x, y);
  ctx.stroke();
};

// Get event coordinates
const getEventCoordinates = (evt) => {
  const { pageX, pageY } = evt.touches ? evt.touches[0] : evt;
  return {
    x: pageX - canvas.offsetLeft,
    y: pageY - canvas.offsetTop,
  };
};

// Send drawing data to the server
const sendDrawingData = (action, x, y) => {
  const data = {
    type: DATA_TYPES.DRAW,
    action,
    x,
    y,
    lineWidth,
    strokeStyle,
    sender: user
  };
  sendMessage(data);
};


// Handle toolbar events
const handleToolbarClick = (e) => {
  if (e.target.id === 'clear' && user.isActive) {
    // Send "clear" action to the server
    sendDrawingData(DRAW_ACTIONS.CLEAR);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
  } else if (e.target.id === 'reduceWidth') {
    lineWidth = lineWidth-- > 1 ? lineWidth-- : 1;
    sizeInput.value = lineWidth;
  } else if (e.target.id === 'increaseWidth') {
    lineWidth = lineWidth++ < 300 ? lineWidth++ : 300;
    sizeInput.value = lineWidth;
  }
};

const handleToolbarChange = (e) => {
  if (e.target.id === 'strokeColor') {
    strokeStyle = e.target.value;
  } else if (e.target.id === 'lineWidth') {
    e.target.value = e.target.value > 1 ? e.target.value : 1;
    e.target.value = e.target.value < 300 ? e.target.value : 300;
    lineWidth = e.target.value;
  }
};

// Initialize canvas size
setCanvasSize();

// Event Listeners
toolbar.addEventListener('click', handleToolbarClick);
toolbar.addEventListener('change', handleToolbarChange);

canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mousemove', draw);

canvas.addEventListener('touchstart', startDrawing);
canvas.addEventListener('touchend', stopDrawing);
canvas.addEventListener('touchmove', (evt) => {
  draw(evt.touches[0]);
  evt.preventDefault();
});

breakpoint.addEventListener('change', setCanvasSize);
