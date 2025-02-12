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
  const x = evt.pageX - canvas.offsetLeft;
  const y = evt.pageY - canvas.offsetTop;
  ctx.beginPath();
  ctx.moveTo(x, y);
};

const stopDrawing = () => {
  isDrawing = false;
  ctx.stroke();
};

// Draw on the canvas
const draw = (evt) => {
  if (!isDrawing) {
    return;
  }

  const x = evt.pageX - canvas.offsetLeft;
  const y = evt.pageY - canvas.offsetTop;


  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';

  ctx.lineTo(x, y);
  ctx.stroke();
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
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
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
