import Plotly from 'plotly.js-dist';

export const GraphLibrary = {
    'sd-basic': {
        course: '102',
        title: 'Supply & Demand',
        desc: 'Modify all variables to see equilibrium shifts.',
        render(container, state = { dInt: 340, dSlope: -2, sInt: 60, sSlope: 1 }) {
            container.innerHTML = `
                <div class="graph-card">
                    <div class="controls-grid">
                        <div class="input-group"><label class="mono">D-Int</label><input type="number" id="di" value="${state.dInt}"></div>
                        <div class="input-group"><label class="mono">D-Slope</label><input type="number" id="ds" value="${state.dSlope}" step="0.1"></div>
                        <div class="input-group"><label class="mono">S-Int</label><input type="number" id="si" value="${state.sInt}"></div>
                        <div class="input-group"><label class="mono">S-Slope</label><input type="number" id="ss" value="${state.sSlope}" step="0.1"></div>
                    </div>
                    <div id="plot-canvas" style="height:450px;"></div>
                </div>`;

            const sync = () => window.rerender('sd-basic', {
                dInt: parseFloat(document.getElementById('di').value) || 0,
                dSlope: parseFloat(document.getElementById('ds').value) || 0,
                sInt: parseFloat(document.getElementById('si').value) || 0,
                sSlope: parseFloat(document.getElementById('ss').value) || 0
            });

            ['di','ds','si','ss'].forEach(id => document.getElementById(id).onchange = sync);

            const eqQ = (state.sInt - state.dInt) / (state.dSlope - state.sSlope);
            const eqP = (state.dSlope * eqQ) + state.dInt;

            const traces = [
                { x: [0, 100], y: [state.dInt, (state.dSlope * 100) + state.dInt], name: 'Demand', line: {color:'#5b9cf6', width:4} },
                { x: [0, 100], y: [state.sInt, (state.sSlope * 100) + state.sInt], name: 'Supply', line: {color:'#e05c6a', width:4} }
            ];

            if (eqQ >= 0 && eqQ <= 100) {
                traces.push({ x: [eqQ], y: [eqP], mode: 'markers+text', text: [`Q*:${eqQ.toFixed(1)}, P*:${eqP.toFixed(1)}`], textposition: 'top right', marker: {size:12, color:'#f7d070'} });
            }

            Plotly.newPlot('plot-canvas', traces, { paper_bgcolor:'rgba(0,0,0,0)', plot_bgcolor:'rgba(0,0,0,0)', font:{color:'#e8e4d8'}, xaxis:{title:'Quantity', gridcolor:'#2a3050'}, yaxis:{title:'Price', gridcolor:'#2a3050'} });
        }
    }
};