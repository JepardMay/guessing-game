import socket from './socket.js';
import { DATA_TYPES, DRAW_ACTIONS } from './consts.js';

const canvas = document.getElementById('drawing-board');
const toolbar = document.getElementById('toolbar');
const breakpoint = matchMedia('(max-width: 600px)');

// Drawing State
let isDrawing = false;
let lineWidth = 5;
let strokeStyle = 'black';

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
};

// Draw on the canvas
const draw = (evt) => {
  if (!isDrawing) {
    return;
  }

  const { x, y } = getEventCoordinates(evt);

  // Send "draw" action to the server
  sendDrawingData(DRAW_ACTIONS.DRAW, x, y);
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
  try {
    const data = {
      type: DATA_TYPES.DRAW,
      action,
      x,
      y,
      lineWidth,
      strokeStyle,
    };
    socket.send(JSON.stringify(data));
  } catch (error) {
    console.error('Error sending drawing data:', error);
  }
};

// Handle toolbar events
const handleToolbarClick = (e) => {
  if (e.target.id === 'clear') {
    // Send "clear" action to the server
    sendDrawingData(DRAW_ACTIONS.CLEAR);
  }
};

const handleToolbarChange = (e) => {
  if (e.target.id === 'stroke') {
    strokeStyle = e.target.value;
  } else if (e.target.id === 'lineWidth') {
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
