import Plotly from 'plotly.js-dist';

// ─── Shared Plotly layout base ────────────────────────────────────────────────
const baseLayout = (xTitle, yTitle, extras = {}) => ({
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor:  'rgba(0,0,0,0)',
    font:   { color: '#e8e4d8', family: 'IBM Plex Sans, sans-serif' },
    legend: { bgcolor: 'rgba(0,0,0,0)', bordercolor: '#2a3050', borderwidth: 1 },
    xaxis:  { title: xTitle, gridcolor: '#2a3050', zerolinecolor: '#2a3050', range: [0, 120] },
    yaxis:  { title: yTitle, gridcolor: '#2a3050', zerolinecolor: '#2a3050' },
    margin: { t: 30, r: 20, b: 60, l: 60 },
    ...extras
});

const eqMarker = (x, y, label) => ({
    x: [x], y: [y],
    mode: 'markers+text',
    text: [label],
    textposition: 'top right',
    textfont: { size: 12, color: '#f7d070' },
    marker: { size: 12, color: '#f7d070', symbol: 'circle' },
    showlegend: false,
    hoverinfo: 'skip'
});

// Dashed annotation line helper (horizontal or vertical)
const dottedLine = (x0, x1, y0, y1, color = '#f7d07066') => ({
    x: [x0, x1], y: [y0, y1],
    mode: 'lines',
    line: { color, dash: 'dot', width: 1.5 },
    showlegend: false,
    hoverinfo: 'skip'
});

// ─── Controls builder helper ──────────────────────────────────────────────────
function buildControls(fields) {
    // fields: [{id, label, value, step?, min?, max?}]
    return `<div class="controls-grid">${fields.map(f => `
        <div class="input-group">
            <label class="mono">${f.label}</label>
            <input type="number" id="${f.id}" value="${f.value}"
                   step="${f.step ?? 1}"
                   ${f.min != null ? `min="${f.min}"` : ''}
                   ${f.max != null ? `max="${f.max}"` : ''}>
        </div>`).join('')}
    </div>`;
}

// ─── Color palette ────────────────────────────────────────────────────────────
const C = {
    demand:  '#5b9cf6',
    supply:  '#e05c6a',
    eq:      '#f7d070',
    neutral: '#4fc3a1',
    purple:  '#b57bee',
    orange:  '#f0956a',
    gray:    '#9097b0'
};

export const GraphLibrary = {

    // ══════════════════════════════════════════════════════════════════════════
    // ECON 102 ─ INTRO MICROECONOMICS
    // ══════════════════════════════════════════════════════════════════════════

    // 1. Supply & Demand ──────────────────────────────────────────────────────
    'sd-basic': {
        course: '102',
        title:  'Supply & Demand',
        desc:   'Shift supply and demand curves to find the new equilibrium price and quantity.',
        render(container, state = { dInt: 340, dSlope: -2, sInt: 60, sSlope: 1.5 }) {
            container.innerHTML = `<div class="graph-card">
                ${buildControls([
                    { id:'di', label:'Demand Intercept', value: state.dInt },
                    { id:'ds', label:'Demand Slope',     value: state.dSlope, step: 0.1 },
                    { id:'si', label:'Supply Intercept', value: state.sInt },
                    { id:'ss', label:'Supply Slope',     value: state.sSlope, step: 0.1, min: 0.01 }
                ])}
                <div id="plot-canvas" style="height:450px;"></div>
            </div>`;

            const sync = () => window.rerender('sd-basic', {
                dInt:   parseFloat(document.getElementById('di').value) || 0,
                dSlope: parseFloat(document.getElementById('ds').value) || 0,
                sInt:   parseFloat(document.getElementById('si').value) || 0,
                sSlope: parseFloat(document.getElementById('ss').value) || 0
            });
            ['di','ds','si','ss'].forEach(id => document.getElementById(id).onchange = sync);

            const Q = Array.from({length: 121}, (_,i) => i);
            const dY = Q.map(q => state.dInt + state.dSlope * q);
            const sY = Q.map(q => state.sInt + state.sSlope * q);

            const eqQ = (state.sInt - state.dInt) / (state.dSlope - state.sSlope);
            const eqP = state.dInt + state.dSlope * eqQ;

            const traces = [
                { x: Q, y: dY, name: 'Demand', line: { color: C.demand, width: 3 } },
                { x: Q, y: sY, name: 'Supply', line: { color: C.supply, width: 3 } }
            ];

            if (eqQ >= 0 && eqQ <= 120 && eqP > 0) {
                traces.push(dottedLine(0, eqQ, eqP, eqP));
                traces.push(dottedLine(eqQ, eqQ, 0, eqP));
                traces.push(eqMarker(eqQ, eqP, `  Q*=${eqQ.toFixed(1)}, P*=${eqP.toFixed(1)}`));
            }

            Plotly.newPlot('plot-canvas', traces,
                baseLayout('Quantity', 'Price', { yaxis: { ...baseLayout().yaxis, range: [0, state.dInt * 1.1] } }),
                { responsive: true, displayModeBar: false });
        }
    },

    // 2. Price Elasticity of Demand ───────────────────────────────────────────
    'elasticity': {
        course: '102',
        title:  'Price Elasticity of Demand',
        desc:   'Compare elastic vs. inelastic demand and see how elasticity affects revenue.',
        render(container, state = { p1: 50, p2: 60, q1: 100, q2: 80 }) {
            container.innerHTML = `<div class="graph-card">
                <p class="mono" style="color:var(--text-dim);font-size:0.75rem;margin:0 0 10px">
                    Enter two price-quantity points to compute elasticity.
                </p>
                ${buildControls([
                    { id:'p1', label:'Price 1 (P₁)',    value: state.p1, min: 0 },
                    { id:'q1', label:'Quantity 1 (Q₁)', value: state.q1, min: 0 },
                    { id:'p2', label:'Price 2 (P₂)',    value: state.p2, min: 0 },
                    { id:'q2', label:'Quantity 2 (Q₂)', value: state.q2, min: 0 }
                ])}
                <div id="plot-canvas" style="height:450px;"></div>
            </div>`;

            const sync = () => window.rerender('elasticity', {
                p1: parseFloat(document.getElementById('p1').value) || 0,
                q1: parseFloat(document.getElementById('q1').value) || 0,
                p2: parseFloat(document.getElementById('p2').value) || 0,
                q2: parseFloat(document.getElementById('q2').value) || 0
            });
            ['p1','q1','p2','q2'].forEach(id => document.getElementById(id).onchange = sync);

            const { p1, p2, q1, q2 } = state;
            const pctQ = (q2 - q1) / ((q1 + q2) / 2);
            const pctP = (p2 - p1) / ((p1 + p2) / 2);
            const ped  = pctP !== 0 ? Math.abs(pctQ / pctP) : Infinity;
            const label = ped > 1 ? 'Elastic' : ped < 1 ? 'Inelastic' : 'Unit Elastic';
            const color = ped > 1 ? C.demand : ped < 1 ? C.supply : C.eq;

            // Revenue bars
            const r1 = p1 * q1;
            const r2 = p2 * q2;

            const traces = [
                // Demand segment
                {
                    x: [q1, q2], y: [p1, p2],
                    mode: 'lines+markers',
                    name: 'Demand Segment',
                    line: { color, width: 4 },
                    marker: { size: 10, color: C.eq }
                },
                // Revenue bar 1
                {
                    x: ['P₁ Revenue', 'P₂ Revenue'],
                    y: [r1, r2],
                    type: 'bar',
                    name: 'Revenue',
                    marker: { color: [C.neutral + 'cc', C.purple + 'cc'] },
                    xaxis: 'x2', yaxis: 'y2',
                    text: [`$${r1.toLocaleString()}`, `$${r2.toLocaleString()}`],
                    textposition: 'outside',
                    textfont: { color: '#e8e4d8', size: 11 }
                }
            ];

            const layout = {
                ...baseLayout('Quantity', 'Price'),
                title: {
                    text: `PED = ${isFinite(ped) ? ped.toFixed(3) : '∞'} → <b>${label}</b>`,
                    font: { color, size: 16 }
                },
                grid: { rows: 1, columns: 2, pattern: 'independent' },
                xaxis:  { title: 'Quantity', gridcolor: '#2a3050', domain: [0, 0.55] },
                yaxis:  { title: 'Price',    gridcolor: '#2a3050' },
                xaxis2: { gridcolor: '#2a3050', domain: [0.65, 1] },
                yaxis2: { title: 'Revenue ($)', gridcolor: '#2a3050' },
                margin: { t: 60, r: 20, b: 60, l: 60 }
            };

            Plotly.newPlot('plot-canvas', traces, layout, { responsive: true, displayModeBar: false });
        }
    },

    // 3. Production Costs ─────────────────────────────────────────────────────
    'prod-costs': {
        course: '102',
        title:  'Production Costs',
        desc:   'Visualize TC, FC, VC, MC, ATC, and AVC as output changes.',
        render(container, state = { fc: 100, vc1: 10, vc2: 0.5 }) {
            container.innerHTML = `<div class="graph-card">
                <p class="mono" style="color:var(--text-dim);font-size:0.75rem;margin:0 0 10px">
                    TC = FC + VC₁·Q + VC₂·Q². Marginal & average costs derived automatically.
                </p>
                ${buildControls([
                    { id:'fc',  label:'Fixed Cost (FC)',  value: state.fc,  min: 0 },
                    { id:'vc1', label:'VC₁ (linear)',     value: state.vc1, step: 0.5 },
                    { id:'vc2', label:'VC₂ (quadratic)',  value: state.vc2, step: 0.1, min: 0.01 }
                ])}
                <div id="plot-canvas" style="height:480px;"></div>
            </div>`;

            const sync = () => window.rerender('prod-costs', {
                fc:  parseFloat(document.getElementById('fc').value)  || 0,
                vc1: parseFloat(document.getElementById('vc1').value) || 0,
                vc2: parseFloat(document.getElementById('vc2').value) || 0.01
            });
            ['fc','vc1','vc2'].forEach(id => document.getElementById(id).onchange = sync);

            const { fc, vc1, vc2 } = state;
            const Q   = Array.from({length: 51}, (_,i) => i);
            const TC  = Q.map(q => fc + vc1 * q + vc2 * q * q);
            const VC  = Q.map(q => vc1 * q + vc2 * q * q);
            const MC  = Q.map(q => q === 0 ? vc1 : vc1 + 2 * vc2 * q);
            const ATC = Q.map(q => q === 0 ? null : TC[q] / q);
            const AVC = Q.map(q => q === 0 ? null : VC[q] / q);

            const traces = [
                { x: Q, y: TC,  name: 'TC',  line: { color: C.supply,  width: 3 }, yaxis: 'y' },
                { x: Q, y: VC,  name: 'VC',  line: { color: C.orange,  width: 3 }, yaxis: 'y' },
                { x: Q, y: MC,  name: 'MC',  line: { color: C.demand,  width: 2.5, dash: 'dot' }, yaxis: 'y2' },
                { x: Q, y: ATC, name: 'ATC', line: { color: C.neutral, width: 2.5 }, yaxis: 'y2' },
                { x: Q, y: AVC, name: 'AVC', line: { color: C.purple,  width: 2.5 }, yaxis: 'y2' }
            ];

            const layout = {
                ...baseLayout('Quantity (Q)', 'Cost ($)'),
                yaxis:  { title: 'Total Cost ($)', gridcolor: '#2a3050', side: 'left' },
                yaxis2: { title: 'Per-Unit Cost ($)', gridcolor: '#2a3050', overlaying: 'y', side: 'right' },
                xaxis:  { title: 'Quantity (Q)', gridcolor: '#2a3050', range: [0, 50] },
                margin: { t: 30, r: 70, b: 60, l: 70 }
            };

            Plotly.newPlot('plot-canvas', traces, layout, { responsive: true, displayModeBar: false });
        }
    },

    // 4. Perfect Competition – Firm vs. Market ────────────────────────────────
    'perf-comp': {
        course: '102',
        title:  'Perfect Competition',
        desc:   'See how market price becomes the firm\'s demand curve; find profit-maximizing Q where P = MC.',
        render(container, state = { mktD: 500, mktS: 50, fc: 80, vc1: 5, vc2: 0.8 }) {
            container.innerHTML = `<div class="graph-card">
                ${buildControls([
                    { id:'mD',  label:'Market Demand Intercept', value: state.mktD },
                    { id:'mS',  label:'Market Supply Intercept', value: state.mktS, min: 0 },
                    { id:'fc',  label:'Firm FC',  value: state.fc,  min: 0 },
                    { id:'vc1', label:'Firm VC₁', value: state.vc1, step: 0.5 },
                    { id:'vc2', label:'Firm VC₂', value: state.vc2, step: 0.1, min: 0.01 }
                ])}
                <div id="plot-canvas" style="height:480px;"></div>
            </div>`;

            const sync = () => window.rerender('perf-comp', {
                mktD: parseFloat(document.getElementById('mD').value)  || 0,
                mktS: parseFloat(document.getElementById('mS').value)  || 0,
                fc:   parseFloat(document.getElementById('fc').value)  || 0,
                vc1:  parseFloat(document.getElementById('vc1').value) || 0,
                vc2:  parseFloat(document.getElementById('vc2').value) || 0.01
            });
            ['mD','mS','fc','vc1','vc2'].forEach(id => document.getElementById(id).onchange = sync);

            const { mktD, mktS, fc, vc1, vc2 } = state;

            // Market equilibrium: Demand P = mktD - Q,  Supply P = mktS + Q
            const mktQ_eq = (mktD - mktS) / 2;
            const mktP_eq = mktS + mktQ_eq;

            // Firm: MC = vc1 + 2*vc2*q,  set MC = P  →  q* = (P - vc1) / (2*vc2)
            const firmQ_star = Math.max(0, (mktP_eq - vc1) / (2 * vc2));
            const profit = mktP_eq * firmQ_star - (fc + vc1 * firmQ_star + vc2 * firmQ_star ** 2);

            const Qm = Array.from({length: 201}, (_,i) => i);
            const Qf = Array.from({length: 51},  (_,i) => i);

            const traces = [
                // Market panel
                { x: Qm, y: Qm.map(q => mktD - q), name: 'Market Demand', line: { color: C.demand, width: 3 }, xaxis: 'x',  yaxis: 'y' },
                { x: Qm, y: Qm.map(q => mktS + q), name: 'Market Supply', line: { color: C.supply, width: 3 }, xaxis: 'x',  yaxis: 'y' },
                eqMarker(mktQ_eq, mktP_eq, `  P*=${mktP_eq.toFixed(1)}`),

                // Firm panel
                { x: [0, 50], y: [mktP_eq, mktP_eq], name: 'Price (P=AR=MR)', line: { color: C.eq, width: 2.5, dash: 'dash' }, xaxis: 'x2', yaxis: 'y2' },
                { x: Qf, y: Qf.map(q => vc1 + 2 * vc2 * q), name: 'MC',  line: { color: C.neutral, width: 3 }, xaxis: 'x2', yaxis: 'y2' },
                { x: Qf, y: Qf.map(q => q === 0 ? null : (fc + vc1*q + vc2*q*q)/q), name: 'ATC', line: { color: C.purple,  width: 2.5 }, xaxis: 'x2', yaxis: 'y2' },
                { x: [firmQ_star], y: [mktP_eq], mode: 'markers+text',
                  text: [`  q*=${firmQ_star.toFixed(1)}\n  π=${profit.toFixed(0)}`],
                  textposition: 'top right', textfont: { color: C.eq, size: 11 },
                  marker: { size: 12, color: C.eq }, showlegend: false, xaxis: 'x2', yaxis: 'y2' }
            ];

            const layout = {
                paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
                font: { color: '#e8e4d8', family: 'IBM Plex Sans' },
                grid: { rows: 1, columns: 2, pattern: 'independent', columnwidth: [0.5, 0.5] },
                xaxis:  { title: 'Market Quantity', gridcolor: '#2a3050', domain: [0, 0.46] },
                yaxis:  { title: 'Price',           gridcolor: '#2a3050' },
                xaxis2: { title: 'Firm Quantity',   gridcolor: '#2a3050', domain: [0.54, 1] },
                yaxis2: { title: 'Price / Cost',    gridcolor: '#2a3050' },
                annotations: [
                    { text: 'Market', x: 0.23, y: 1.04, xref: 'paper', yref: 'paper', showarrow: false, font: { color: C.gray, size: 12 } },
                    { text: 'Firm',   x: 0.77, y: 1.04, xref: 'paper', yref: 'paper', showarrow: false, font: { color: C.gray, size: 12 } }
                ],
                legend: { bgcolor: 'rgba(0,0,0,0)' },
                margin: { t: 40, r: 20, b: 60, l: 60 }
            };

            Plotly.newPlot('plot-canvas', traces, layout, { responsive: true, displayModeBar: false });
        }
    },

    // 5. Monopoly ─────────────────────────────────────────────────────────────
    'monopoly': {
        course: '102',
        title:  'Monopoly',
        desc:   'Find the monopolist\'s profit-maximizing output where MR = MC, and the deadweight loss.',
        render(container, state = { dInt: 200, dSlope: -1.5, fc: 100, vc1: 20, vc2: 0.3 }) {
            container.innerHTML = `<div class="graph-card">
                ${buildControls([
                    { id:'di',  label:'Demand Intercept', value: state.dInt },
                    { id:'ds',  label:'Demand Slope',     value: state.dSlope, step: 0.1 },
                    { id:'fc',  label:'Fixed Cost',       value: state.fc, min: 0 },
                    { id:'vc1', label:'VC₁ (linear)',     value: state.vc1, step: 1 },
                    { id:'vc2', label:'VC₂ (quadratic)',  value: state.vc2, step: 0.1, min: 0 }
                ])}
                <div id="plot-canvas" style="height:480px;"></div>
            </div>`;

            const sync = () => window.rerender('monopoly', {
                dInt:   parseFloat(document.getElementById('di').value)  || 0,
                dSlope: parseFloat(document.getElementById('ds').value)  || -0.01,
                fc:     parseFloat(document.getElementById('fc').value)  || 0,
                vc1:    parseFloat(document.getElementById('vc1').value) || 0,
                vc2:    parseFloat(document.getElementById('vc2').value) || 0
            });
            ['di','ds','fc','vc1','vc2'].forEach(id => document.getElementById(id).onchange = sync);

            const { dInt, dSlope, fc, vc1, vc2 } = state;

            // Demand: P = dInt + dSlope*Q  →  MR = dInt + 2*dSlope*Q
            // MC = vc1 + 2*vc2*Q
            // MR = MC  →  dInt + 2*dSlope*Q = vc1 + 2*vc2*Q
            // Q* = (vc1 - dInt) / (2*dSlope - 2*vc2)
            const Qm_star = (vc1 - dInt) / (2 * dSlope - 2 * vc2);
            const Pm_star = dInt + dSlope * Qm_star;

            // Competitive equilibrium: P = MC  → dInt + dSlope*Q = vc1 + 2*vc2*Q
            const Qc_star = (vc1 - dInt) / (dSlope - 2 * vc2);
            const Pc_star = dInt + dSlope * Qc_star;

            const profit = Pm_star * Qm_star - (fc + vc1 * Qm_star + vc2 * Qm_star ** 2);

            const Q = Array.from({length: 121}, (_,i) => i);
            const demandP = Q.map(q => dInt + dSlope * q);
            const mrP     = Q.map(q => dInt + 2 * dSlope * q);
            const mcP     = Q.map(q => vc1 + 2 * vc2 * q);

            const traces = [
                { x: Q, y: demandP, name: 'Demand (AR)', line: { color: C.demand, width: 3 } },
                { x: Q, y: mrP,     name: 'MR',          line: { color: C.orange, width: 3 } },
                { x: Q, y: mcP,     name: 'MC',          line: { color: C.supply, width: 3 } },
                dottedLine(0, Qm_star, Pm_star, Pm_star, C.eq + '99'),
                dottedLine(Qm_star, Qm_star, 0, Pm_star, C.eq + '99'),
            ];

            // DWL triangle
            if (Qm_star > 0 && Qc_star > Qm_star) {
                traces.push({
                    x: [Qm_star, Qc_star, Qc_star, Qm_star],
                    y: [Pm_star, Pc_star, Pc_star, Pm_star],
                    fill: 'toself', fillcolor: C.supply + '33',
                    line: { color: C.supply, width: 1, dash: 'dot' },
                    name: 'Deadweight Loss', mode: 'lines'
                });
            }

            traces.push(eqMarker(Qm_star, Pm_star, `  Q*=${Qm_star.toFixed(1)}, P*=${Pm_star.toFixed(1)}\n  π=${profit.toFixed(0)}`));

            Plotly.newPlot('plot-canvas', traces,
                { ...baseLayout('Quantity', 'Price'), yaxis: { ...baseLayout().yaxis, range: [0, dInt * 1.1] } },
                { responsive: true, displayModeBar: false });
        }
    },

    // 6. Consumer & Producer Surplus ──────────────────────────────────────────
    'surplus': {
        course: '102',
        title:  'Consumer & Producer Surplus',
        desc:   'Visualize CS, PS, and total surplus at equilibrium.',
        render(container, state = { dInt: 300, dSlope: -2, sInt: 50, sSlope: 1.5 }) {
            container.innerHTML = `<div class="graph-card">
                ${buildControls([
                    { id:'di', label:'Demand Intercept', value: state.dInt },
                    { id:'ds', label:'Demand Slope',     value: state.dSlope, step: 0.1 },
                    { id:'si', label:'Supply Intercept', value: state.sInt },
                    { id:'ss', label:'Supply Slope',     value: state.sSlope, step: 0.1, min: 0.01 }
                ])}
                <div id="plot-canvas" style="height:450px;"></div>
            </div>`;

            const sync = () => window.rerender('surplus', {
                dInt:   parseFloat(document.getElementById('di').value) || 0,
                dSlope: parseFloat(document.getElementById('ds').value) || 0,
                sInt:   parseFloat(document.getElementById('si').value) || 0,
                sSlope: parseFloat(document.getElementById('ss').value) || 0
            });
            ['di','ds','si','ss'].forEach(id => document.getElementById(id).onchange = sync);

            const { dInt, dSlope, sInt, sSlope } = state;
            const eqQ = (sInt - dInt) / (dSlope - sSlope);
            const eqP = dInt + dSlope * eqQ;

            const cs = eqQ > 0 ? 0.5 * (dInt - eqP) * eqQ : 0;
            const ps = eqQ > 0 ? 0.5 * (eqP - sInt) * eqQ : 0;

            const Q = Array.from({length: 121}, (_,i) => i);

            const traces = [
                // CS shading
                { x: [0, eqQ, 0], y: [dInt, eqP, eqP],
                  fill: 'toself', fillcolor: C.demand + '33',
                  line: { color: C.demand + '88', width: 1 },
                  name: `CS = ${cs.toFixed(0)}`, mode: 'lines' },
                // PS shading
                { x: [0, eqQ, 0], y: [sInt, eqP, eqP],
                  fill: 'toself', fillcolor: C.supply + '33',
                  line: { color: C.supply + '88', width: 1 },
                  name: `PS = ${ps.toFixed(0)}`, mode: 'lines' },
                // Curves
                { x: Q, y: Q.map(q => dInt + dSlope * q), name: 'Demand', line: { color: C.demand, width: 3 } },
                { x: Q, y: Q.map(q => sInt + sSlope * q), name: 'Supply', line: { color: C.supply, width: 3 } },
                eqMarker(eqQ, eqP, `  Q*=${eqQ.toFixed(1)}, P*=${eqP.toFixed(1)}\n  TS=${(cs+ps).toFixed(0)}`)
            ];

            Plotly.newPlot('plot-canvas', traces,
                { ...baseLayout('Quantity', 'Price'), yaxis: { ...baseLayout().yaxis, range: [0, dInt * 1.1] } },
                { responsive: true, displayModeBar: false });
        }
    },

    // ══════════════════════════════════════════════════════════════════════════
    // ECON 104 ─ INTRO MACROECONOMICS
    // ══════════════════════════════════════════════════════════════════════════

    // 7. Aggregate Supply & Aggregate Demand ──────────────────────────────────
    'as-ad': {
        course: '104',
        title:  'AS–AD Model',
        desc:   'Shift Aggregate Demand (AD) and Short/Long-Run Aggregate Supply (SRAS/LRAS).',
        render(container, state = { adInt: 500, adSlope: -1.5, srasInt: 50, srasSlope: 2, lrasQ: 200 }) {
            container.innerHTML = `<div class="graph-card">
                ${buildControls([
                    { id:'adI',  label:'AD Intercept',    value: state.adInt },
                    { id:'adS',  label:'AD Slope',        value: state.adSlope, step: 0.1 },
                    { id:'srI',  label:'SRAS Intercept',  value: state.srasInt },
                    { id:'srS',  label:'SRAS Slope',      value: state.srasSlope, step: 0.1, min: 0.01 },
                    { id:'lras', label:'LRAS (Potential GDP)', value: state.lrasQ, min: 1 }
                ])}
                <div id="plot-canvas" style="height:480px;"></div>
            </div>`;

            const sync = () => window.rerender('as-ad', {
                adInt:     parseFloat(document.getElementById('adI').value)  || 0,
                adSlope:   parseFloat(document.getElementById('adS').value)  || -0.01,
                srasInt:   parseFloat(document.getElementById('srI').value)  || 0,
                srasSlope: parseFloat(document.getElementById('srS').value)  || 0.01,
                lrasQ:     parseFloat(document.getElementById('lras').value) || 100
            });
            ['adI','adS','srI','srS','lras'].forEach(id => document.getElementById(id).onchange = sync);

            const { adInt, adSlope, srasInt, srasSlope, lrasQ } = state;

            // SR Equilibrium: AD = SRAS
            const srEqQ = (srasInt - adInt) / (adSlope - srasSlope);
            const srEqP = adInt + adSlope * srEqQ;
            const lrasP  = adInt + adSlope * lrasQ;

            const Q = Array.from({length: 401}, (_,i) => i);
            const maxP = adInt * 1.1;

            const traces = [
                { x: Q, y: Q.map(q => adInt + adSlope * q),     name: 'AD',   line: { color: C.demand, width: 3 } },
                { x: Q, y: Q.map(q => srasInt + srasSlope * q), name: 'SRAS', line: { color: C.supply, width: 3 } },
                // LRAS — vertical line
                { x: [lrasQ, lrasQ], y: [0, maxP], name: 'LRAS (Potential)',
                  line: { color: C.eq, width: 2.5, dash: 'dash' }, mode: 'lines' },
            ];

            if (srEqQ > 0) {
                traces.push(dottedLine(0, srEqQ, srEqP, srEqP));
                traces.push(dottedLine(srEqQ, srEqQ, 0, srEqP));
                traces.push(eqMarker(srEqQ, srEqP, `  Y*=${srEqQ.toFixed(0)}, PL*=${srEqP.toFixed(1)}`));
            }

            // Inflationary / recessionary gap label
            const gap = srEqQ - lrasQ;
            const gapLabel = Math.abs(gap) < 2 ? '' : gap > 0 ? '↑ Inflationary Gap' : '↓ Recessionary Gap';

            const layout = {
                ...baseLayout('Real GDP (Y)', 'Price Level (PL)'),
                xaxis: { title: 'Real GDP (Y)', gridcolor: '#2a3050', range: [0, 400] },
                yaxis: { title: 'Price Level (PL)', gridcolor: '#2a3050', range: [0, maxP] },
                annotations: gapLabel ? [{
                    x: (srEqQ + lrasQ) / 2, y: srEqP * 0.85,
                    text: gapLabel, showarrow: false,
                    font: { color: gap > 0 ? C.supply : C.demand, size: 13 }
                }] : []
            };

            Plotly.newPlot('plot-canvas', traces, layout, { responsive: true, displayModeBar: false });
        }
    },

    // 8. Phillips Curve ───────────────────────────────────────────────────────
    'phillips': {
        course: '104',
        title:  'Phillips Curve',
        desc:   'Explore the short-run trade-off between inflation and unemployment. Shift SRPC and LRPC.',
        render(container, state = { nairu: 4, infExp: 2, slope: -0.8, shockInf: 0 }) {
            container.innerHTML = `<div class="graph-card">
                <p class="mono" style="color:var(--text-dim);font-size:0.75rem;margin:0 0 10px">
                    π = πᵉ + slope·(u − NAIRU) + supply shock
                </p>
                ${buildControls([
                    { id:'nairu', label:'NAIRU (%)',           value: state.nairu,   step: 0.5, min: 0 },
                    { id:'piE',   label:'Expected Inflation (πᵉ)', value: state.infExp, step: 0.5 },
                    { id:'sl',    label:'Slope',               value: state.slope,   step: 0.1 },
                    { id:'shock', label:'Supply Shock (±)',    value: state.shockInf, step: 0.5 }
                ])}
                <div id="plot-canvas" style="height:450px;"></div>
            </div>`;

            const sync = () => window.rerender('phillips', {
                nairu:    parseFloat(document.getElementById('nairu').value) || 0,
                infExp:   parseFloat(document.getElementById('piE').value)   || 0,
                slope:    parseFloat(document.getElementById('sl').value)    || -0.1,
                shockInf: parseFloat(document.getElementById('shock').value) || 0
            });
            ['nairu','piE','sl','shock'].forEach(id => document.getElementById(id).onchange = sync);

            const { nairu, infExp, slope, shockInf } = state;
            const U = Array.from({length: 151}, (_,i) => i * 0.1); // 0–15%

            const srpc  = U.map(u => infExp + slope * (u - nairu) + shockInf);
            const srpc0 = U.map(u => infExp + slope * (u - nairu));           // no shock

            const traces = [
                { x: U, y: srpc0, name: 'SRPC (no shock)', line: { color: C.demand, width: 2.5, dash: 'dot' } },
                { x: U, y: srpc,  name: `SRPC (+shock)`,   line: { color: C.supply, width: 3 } },
                // LRPC — vertical at NAIRU
                { x: [nairu, nairu], y: [-4, 12], name: `LRPC (NAIRU=${nairu}%)`,
                  line: { color: C.eq, width: 2.5, dash: 'dash' }, mode: 'lines' },
                // Current expected inflation horizontal
                { x: [0, 15], y: [infExp, infExp], name: `πᵉ = ${infExp}%`,
                  line: { color: C.neutral, width: 1.5, dash: 'dot' }, mode: 'lines' }
            ];

            Plotly.newPlot('plot-canvas', traces,
                { ...baseLayout('Unemployment Rate (%)', 'Inflation Rate (%)'),
                  xaxis: { title: 'Unemployment Rate (%)', gridcolor: '#2a3050', range: [0, 15] },
                  yaxis: { title: 'Inflation Rate (%)',    gridcolor: '#2a3050', range: [-4, 12] }
                },
                { responsive: true, displayModeBar: false });
        }
    },

    // 9. Money Market ─────────────────────────────────────────────────────────
    'money-market': {
        course: '104',
        title:  'Money Market',
        desc:   'Shift money supply (MS) and money demand (MD) to find equilibrium interest rate.',
        render(container, state = { mdInt: 400, mdSlope: -20, ms: 200 }) {
            container.innerHTML = `<div class="graph-card">
                <p class="mono" style="color:var(--text-dim);font-size:0.75rem;margin:0 0 10px">
                    Money demand slopes down (higher i → lower Md). Money supply is vertical (fixed by Fed).
                </p>
                ${buildControls([
                    { id:'mdI', label:'MD Intercept',           value: state.mdInt },
                    { id:'mdS', label:'MD Slope (per % rate)',  value: state.mdSlope, step: 1 },
                    { id:'ms',  label:'Money Supply (MS)',      value: state.ms,     min: 1 }
                ])}
                <div id="plot-canvas" style="height:450px;"></div>
            </div>`;

            const sync = () => window.rerender('money-market', {
                mdInt:  parseFloat(document.getElementById('mdI').value) || 0,
                mdSlope: parseFloat(document.getElementById('mdS').value) || -1,
                ms:     parseFloat(document.getElementById('ms').value) || 1
            });
            ['mdI','mdS','ms'].forEach(id => document.getElementById(id).onchange = sync);

            const { mdInt, mdSlope, ms } = state;

            // x-axis = Money Quantity, y-axis = Interest Rate (i)
            // MD: i = (Q - mdInt) / mdSlope  →  Q = mdInt + mdSlope * i
            // Equilibrium: MS = MD → i* = (ms - mdInt) / mdSlope
            const i_star = (ms - mdInt) / mdSlope;

            const I = Array.from({length: 201}, (_,i) => i * 0.1); // interest rates 0–20%
            const mdQ = I.map(i => mdInt + mdSlope * i);

            const traces = [
                { x: mdQ, y: I, name: 'Money Demand (MD)', line: { color: C.demand, width: 3 } },
                // MS: vertical line at Q = ms
                { x: [ms, ms], y: [0, 20], name: 'Money Supply (MS)',
                  line: { color: C.supply, width: 3 }, mode: 'lines' },
                dottedLine(0, ms, i_star, i_star),
                dottedLine(ms, ms, 0, i_star),
                { x: [ms], y: [i_star], mode: 'markers+text',
                  text: [`  i*=${i_star.toFixed(2)}%`],
                  textposition: 'top right', textfont: { color: C.eq, size: 12 },
                  marker: { size: 12, color: C.eq }, showlegend: false }
            ];

            Plotly.newPlot('plot-canvas', traces,
                { ...baseLayout('Money Quantity ($)', 'Interest Rate (%)'),
                  xaxis: { title: 'Money Quantity ($)', gridcolor: '#2a3050', range: [0, mdInt * 1.2] },
                  yaxis: { title: 'Interest Rate (%)',  gridcolor: '#2a3050', range: [0, 20] }
                },
                { responsive: true, displayModeBar: false });
        }
    },

    // 10. GDP Components (Expenditure Approach) ───────────────────────────────
    'gdp-components': {
        course: '104',
        title:  'GDP Expenditure Approach',
        desc:   'Break down GDP = C + I + G + (X − M) and see how each component drives growth.',
        render(container, state = { C: 1200, I: 400, G: 600, X: 300, M: 250 }) {
            container.innerHTML = `<div class="graph-card">
                ${buildControls([
                    { id:'gc', label:'Consumption (C)',     value: state.C, min: 0 },
                    { id:'gi', label:'Investment (I)',      value: state.I, min: 0 },
                    { id:'gg', label:'Gov. Spending (G)',   value: state.G, min: 0 },
                    { id:'gx', label:'Exports (X)',         value: state.X, min: 0 },
                    { id:'gm', label:'Imports (M)',         value: state.M, min: 0 }
                ])}
                <div id="plot-canvas" style="height:450px;"></div>
            </div>`;

            const sync = () => window.rerender('gdp-components', {
                C: parseFloat(document.getElementById('gc').value) || 0,
                I: parseFloat(document.getElementById('gi').value) || 0,
                G: parseFloat(document.getElementById('gg').value) || 0,
                X: parseFloat(document.getElementById('gx').value) || 0,
                M: parseFloat(document.getElementById('gm').value) || 0
            });
            ['gc','gi','gg','gx','gm'].forEach(id => document.getElementById(id).onchange = sync);

            const { C, I, G, X, M } = state;
            const NX  = X - M;
            const GDP = C + I + G + NX;

            const traces = [{
                type: 'waterfall',
                orientation: 'v',
                x: ['C', 'I', 'G', 'NX (X−M)', 'GDP'],
                y: [C, I, G, NX, GDP],
                measure: ['relative', 'relative', 'relative', 'relative', 'total'],
                text: [C, I, G, NX, GDP].map(v => `$${v.toLocaleString()}`),
                textposition: 'outside',
                textfont: { color: '#e8e4d8' },
                connector: { line: { color: '#2a3050', dash: 'dot' } },
                increasing: { marker: { color: C.neutral + 'cc' } },
                decreasing: { marker: { color: C.supply + 'cc' } },
                totals:     { marker: { color: C.demand + 'cc' } }
            }];

            const layout = {
                ...baseLayout('Component', 'Value ($)'),
                xaxis: { gridcolor: '#2a3050' },
                yaxis: { title: 'Value ($)', gridcolor: '#2a3050' },
                title: { text: `GDP = $${GDP.toLocaleString()}`, font: { color: C.eq, size: 16 } }
            };

            Plotly.newPlot('plot-canvas', traces, layout, { responsive: true, displayModeBar: false });
        }
    },

    // 11. Loanable Funds Market ───────────────────────────────────────────────
    'loanable-funds': {
        course: '104',
        title:  'Loanable Funds Market',
        desc:   'Shifts in savings supply and investment demand determine the real interest rate.',
        render(container, state = { sInt: 20, sSlope: 8, dInt: 400, dSlope: -8 }) {
            container.innerHTML = `<div class="graph-card">
                ${buildControls([
                    { id:'sI', label:'Supply Intercept', value: state.sInt },
                    { id:'sS', label:'Supply Slope',     value: state.sSlope, step: 0.5, min: 0.01 },
                    { id:'dI', label:'Demand Intercept', value: state.dInt },
                    { id:'dS', label:'Demand Slope',     value: state.dSlope, step: 0.5 }
                ])}
                <div id="plot-canvas" style="height:450px;"></div>
            </div>`;

            const sync = () => window.rerender('loanable-funds', {
                sInt:  parseFloat(document.getElementById('sI').value) || 0,
                sSlope: parseFloat(document.getElementById('sS').value) || 0.01,
                dInt:  parseFloat(document.getElementById('dI').value) || 0,
                dSlope: parseFloat(document.getElementById('dS').value) || -0.01
            });
            ['sI','sS','dI','dS'].forEach(id => document.getElementById(id).onchange = sync);

            const { sInt, sSlope, dInt, dSlope } = state;

            // Q (funds) on x-axis, real interest rate r on y-axis
            // Supply: r = sInt + sSlope * Q  →  Q = (r - sInt) / sSlope
            // Demand: r = dInt + dSlope * Q
            // Eq: sInt + sSlope*Q = dInt + dSlope*Q  → Q* = (dInt-sInt)/(sSlope-dSlope)
            const eqQ = (dInt - sInt) / (sSlope - dSlope);
            const eqR = sInt + sSlope * eqQ;

            const Q = Array.from({length: 101}, (_,i) => i);

            const traces = [
                { x: Q, y: Q.map(q => sInt + sSlope * q), name: 'Supply of Loanable Funds', line: { color: C.supply, width: 3 } },
                { x: Q, y: Q.map(q => dInt + dSlope * q), name: 'Demand for Loanable Funds', line: { color: C.demand, width: 3 } },
                dottedLine(0, eqQ, eqR, eqR),
                dottedLine(eqQ, eqQ, 0, eqR),
                eqMarker(eqQ, eqR, `  Q*=${eqQ.toFixed(1)}, r*=${eqR.toFixed(1)}%`)
            ];

            Plotly.newPlot('plot-canvas', traces,
                { ...baseLayout('Quantity of Loanable Funds', 'Real Interest Rate (%)'),
                  xaxis: { title: 'Quantity of Loanable Funds', gridcolor: '#2a3050', range: [0, 100] },
                  yaxis: { title: 'Real Interest Rate (%)', gridcolor: '#2a3050', range: [0, dInt * 1.1] }
                },
                { responsive: true, displayModeBar: false });
        }
    }
};