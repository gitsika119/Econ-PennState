import './styles.css';
import { GraphLibrary } from './classes/graphs.js';

const gallery102 = document.getElementById('gallery-102');
const gallery104 = document.getElementById('gallery-104');
const display = document.getElementById('graph-display');
const welcome = document.getElementById('welcome');
const content = document.getElementById('graph-content');
const header = document.getElementById('graph-header');

// THE GLOBAL BRIDGE
window.rerender = (id, state) => {
    const g = GraphLibrary[id];
    if (g) g.render(content, state);
};

window.showGallery = () => {
    welcome.style.display = 'block';
    display.style.display = 'none';
};

function init() {
    // Safety clear
    if (gallery102) gallery102.innerHTML = '';
    if (gallery104) gallery104.innerHTML = '';

    Object.keys(GraphLibrary).forEach(id => {
        const g = GraphLibrary[id];
        if (!g || !g.title) return;

        const box = document.createElement('div');
        box.className = 'graph-box'; // MUST MATCH CSS
        box.innerHTML = `
            <div class="box-content">
                <span class="box-tag">ECON ${g.course}</span>
                <h4>${g.title}</h4>
                <p>${g.desc}</p>
            </div>
            <div class="box-footer mono">SIMULATE MODULE →</div>
        `;
        box.onclick = () => loadGraph(id);
        
        const target = g.course.startsWith('1') ? (g.course === '102' ? gallery102 : gallery104) : null;
        if (target) target.appendChild(box);
    });
}

function loadGraph(id) {
    const g = GraphLibrary[id];
    welcome.style.display = 'none';
    display.style.display = 'block';

    // RENDER HEADER ONCE
    header.innerHTML = `
        <div class="graph-header-actions">
            <button class="back-btn" onclick="showGallery()">← Back to Library</button>
            <span class="course-tag-right">ECON ${g.course}</span>
        </div>
        <h2 class="playfair graph-title">${g.title}</h2>
    `;

    g.render(content, {});
}

document.addEventListener('DOMContentLoaded', init);