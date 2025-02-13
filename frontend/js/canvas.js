import socket from './socket.js';

const canvas = document.getElementById('drawing-board');
const toolbar = document.getElementById('toolbar');
const breakpoint = matchMedia('(max-width: 600px)');

canvas.width = 500;
canvas.height = 500;

const ctx = canvas.getContext('2d');

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

  // Send "start" action to the server
  const data = {
    type: 'draw',
    x,
    y,
    lineWidth,
    strokeStyle,
    action: 'start',
  };
  socket.send(JSON.stringify(data));
};

const stopDrawing = () => {
  isDrawing = false;

  // Send "stop" action to the server
  socket.send(JSON.stringify({
    type: 'draw',
    action: 'stop',
  }));
};

// Draw on the canvas
const draw = (evt) => {
  if (!isDrawing) {
    return;
  }

  const x = evt.pageX - canvas.offsetLeft;
  const y = evt.pageY - canvas.offsetTop;

  // Send "draw" action to the server
  const data = {
    type: 'draw',
    x,
    y,
    lineWidth,
    strokeStyle,
    action: 'draw',
  };
  socket.send(JSON.stringify(data));
};

// Adapt to touch events
const touchmove = (evt) => {
  draw(evt.touches[0]);
  evt.preventDefault();
};

// Initialize canvas size
setCanvasSize();

// Toolbox events
toolbar.addEventListener('click', e => {
  if (e.target.id === 'clear') {
    // Send "clear" action to the server
    socket.send(JSON.stringify({ type: 'draw', action: 'clear' }));
  }
});

toolbar.addEventListener('change', e => {
  if (e.target.id === 'stroke') {
    strokeStyle = e.target.value;
  }

  if (e.target.id === 'lineWidth') {
    lineWidth = e.target.value;
  }
});

// Mouse events
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mousemove', draw);

// Touch events
canvas.addEventListener('touchstart', startDrawing);
canvas.addEventListener('touchend', stopDrawing);
canvas.addEventListener('touchmove', touchmove);

// Handle screen size changes
breakpoint.addEventListener('change', setCanvasSize);
