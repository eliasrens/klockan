// ========================================
// KLOCKSPLET - Interaktioner (Drag & Drop)
// ========================================

// --- DRAG AND DROP (Mouse + Touch) ---
let isDragging = false;
let activeHand = null;
const clock = document.querySelector('.clock');

function getAngle(e) {
    const r = clock.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = clientX - (r.left + r.width/2);
    const y = clientY - (r.top + r.height/2);
    let a = Math.atan2(y, x) * (180/Math.PI) + 90;
    return a < 0 ? a + 360 : a;
}

function startDrag(e, hand) {
    isDragging = true;
    activeHand = hand;
    document.getElementById("meddelande").innerText = "";
}

document.getElementById('minuteHand').onmousedown = (e) => startDrag(e, 'min');
document.getElementById('hourHand').onmousedown = (e) => startDrag(e, 'hour');
document.getElementById('minuteHand').ontouchstart = (e) => startDrag(e, 'min');
document.getElementById('hourHand').ontouchstart = (e) => startDrag(e, 'hour');

function doDrag(e) {
    if (!isDragging) return;
    const a = getAngle(e);
    if (activeHand === 'min') gameMinutes = (Math.round(a/30)*30/6)%60;
    else gameHours = Math.round(a/30) || 12;
    updateClock();
}

document.addEventListener('mousemove', doDrag);
document.addEventListener('touchmove', (e) => { if(isDragging) e.preventDefault(); doDrag(e); }, {passive: false});
document.addEventListener('mouseup', () => isDragging = false);
document.addEventListener('touchend', () => isDragging = false);

updateClock();
