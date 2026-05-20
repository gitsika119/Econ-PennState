import './styles.css';
import { GraphLibrary } from './classes/graphs.js';

const gallery102 = document.getElementById('gallery-102');
const gallery104 = document.getElementById('gallery-104');
const display    = document.getElementById('graph-display');
const welcome    = document.getElementById('welcome');
const content    = document.getElementById('graph-content');
const header     = document.getElementById('graph-header');

// ─── Plot height helpers ───────────────────────────────────────────────────
window.plotHeight = () => {
    const w = window.innerWidth;
    if (w <= 480) return Math.round(window.innerHeight * 0.52);
    if (w <= 768) return 380;
    return 460;
};

window.plotHeightDual = () => {
    if (window.innerWidth <= 480) return Math.round(window.innerHeight * 0.78);
    return window.plotHeight();
};

// ─── State ────────────────────────────────────────────────────────────────
let activeId    = null;   // currently open graph id
let activeState = {};     // last known input state

// ─── Global bridge (called by each graph's onchange) ──────────────────────
window.rerender = (id, state) => {
    activeState = state;
    const g = GraphLibrary[id];
    if (g) g.render(content, state);
};

window.showGallery = () => {
    activeId    = null;
    activeState = {};
    welcome.style.display = 'block';
    display.style.display = 'none';
};

// ─── Gallery init ─────────────────────────────────────────────────────────
function init() {
    if (gallery102) gallery102.innerHTML = '';
    if (gallery104) gallery104.innerHTML = '';

    Object.keys(GraphLibrary).forEach(id => {
        const g = GraphLibrary[id];
        if (!g || !g.title) return;

        const box = document.createElement('div');
        box.className = 'graph-box';
        box.innerHTML = `
            <div class="box-content">
                <span class="box-tag">ECON ${g.course}</span>
                <h4>${g.title}</h4>
                <p>${g.desc}</p>
            </div>
            <div class="box-footer mono">SIMULATE MODULE →</div>
        `;
        box.onclick = () => loadGraph(id);

        const target = g.course === '102' ? gallery102
                     : g.course === '104' ? gallery104
                     : null;
        if (target) target.appendChild(box);
    });
}

// ─── Load a graph ─────────────────────────────────────────────────────────
function loadGraph(id) {
    const g = GraphLibrary[id];
    activeId    = id;
    activeState = {};          // fresh state — graph uses its own defaults

    welcome.style.display = 'none';
    display.style.display = 'block';

    header.innerHTML = `
        <div class="graph-header-actions">
            <button class="back-btn" onclick="showGallery()">← Back to Library</button>
            <span class="course-tag-right">ECON ${g.course}</span>
        </div>
        <h2 class="playfair graph-title">${g.title}</h2>
    `;

    g.render(content, {});
}

// ─── Resize handler ───────────────────────────────────────────────────────
// Debounced so we don't hammer Plotly on every pixel change
let resizeTimer = null;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        if (activeId && display.style.display !== 'none') {
            // Re-render with the last known state so inputs are preserved
            const g = GraphLibrary[activeId];
            if (g) g.render(content, activeState);
        }
    }, 150);
});

document.addEventListener('DOMContentLoaded', init);