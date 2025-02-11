const canvas = document.getElementById('drawing-board');
const toolbar = document.getElementById('toolbar');

canvas.width = 500;
canvas.height = 500;

const ctx = canvas.getContext('2d');

let isDrawing = false;
let lineWidth = 5;

const startDrawing = () => {
  isDrawing = true;
};

const stopDrawing = () => {
  isDrawing = false;
  ctx.stroke();
  ctx.beginPath();
};

const draw = (evt) => {
  if (!isDrawing) {
    return;
  }

  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';

  ctx.lineTo(evt.pageX - canvas.offsetLeft, evt.pageY - canvas.offsetTop);
  ctx.stroke();
};

const touchmove = (evt) => {
  draw(evt.touches[0]);
  evt.preventDefault();
};

// Toolbox events
toolbar.addEventListener('click', e => {
  if (e.target.id === 'clear') {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
});

toolbar.addEventListener('change', e => {
  if (e.target.id === 'stroke') {
    ctx.strokeStyle = e.target.value;
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

