const GRID_SIZE = 5;
let startCell = [0, 0];
let endCell = [4, 4];
let obstacles = [[1, 1], [2, 2], [3, 3]];
let currentMode = 'obstacle'; // 'obstacle', 'start', 'end'

const ACTIONS = ['up', 'down', 'left', 'right'];
const DELTAS = {
    'up': [-1, 0],
    'down': [1, 0],
    'left': [0, -1],
    'right': [0, 1]
};
const GAMMA = 0.99;
const STEP_REWARD = -0.04;
const GOAL_REWARD = 1.0;

const gridEl = document.getElementById('grid');
const modeBtns = document.querySelectorAll('.mode-btn');
const solveBtn = document.getElementById('solveBtn');
const resetBtn = document.getElementById('resetBtn');
const showValuesCb = document.getElementById('showValues');
const showPolicyCb = document.getElementById('showPolicy');

let currentValues = null;
let currentPolicy = null;
let currentPath = null;

function is_valid(r, c) {
    if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) return false;
    if (obstacles.some(ob => ob[0] === r && ob[1] === c)) return false;
    return true;
}

function valueIteration() {
    let V = Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(0));
    let policy = Array(GRID_SIZE).fill('').map(() => Array(GRID_SIZE).fill(''));

    const max_iterations = 1000;
    const theta = 1e-4;

    for (let i = 0; i < max_iterations; i++) {
        let delta = 0;
        let new_V = V.map(row => [...row]);

        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (r === endCell[0] && c === endCell[1]) {
                    new_V[r][c] = GOAL_REWARD;
                    policy[r][c] = 'goal';
                    continue;
                }
                if (obstacles.some(ob => ob[0] === r && ob[1] === c)) {
                    new_V[r][c] = 0;
                    policy[r][c] = 'block';
                    continue;
                }

                let max_val = -Infinity;
                let best_action = null;

                for (let action of ACTIONS) {
                    let d = DELTAS[action];
                    let nr = r + d[0], nc = c + d[1];

                    if (!is_valid(nr, nc)) {
                        nr = r; nc = c;
                    }

                    let val = STEP_REWARD + GAMMA * V[nr][nc];
                    if (val > max_val) {
                        max_val = val;
                        best_action = action;
                    }
                }

                new_V[r][c] = max_val;
                policy[r][c] = best_action;
                delta = Math.max(delta, Math.abs(new_V[r][c] - V[r][c]));
            }
        }

        V = new_V;
        if (delta < theta) break;
    }

    // Path reconstruction
    let path = [];
    let curr = [...startCell];
    let visited = new Set();

    while (curr[0] !== endCell[0] || curr[1] !== endCell[1]) {
        let r = curr[0];
        let c = curr[1];
        let key = `${r},${c}`;
        path.push([r, c]);
        visited.add(key);

        let act = policy[r][c];
        if (!act || act === 'block') break;

        let d = DELTAS[act];
        let nr = r + d[0], nc = c + d[1];

        if (!is_valid(nr, nc) || visited.has(`${nr},${nc}`)) break;
        curr = [nr, nc];
    }

    if (curr[0] === endCell[0] && curr[1] === endCell[1]) {
        path.push([...endCell]);
    }

    return { values: V, policy: policy, path: path };
}

function initGrid() {
    gridEl.innerHTML = '';
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.r = r;
            cell.dataset.c = c;

            const valSpan = document.createElement('div');
            valSpan.className = 'val-text';
            valSpan.style.display = 'none';

            const arrSpan = document.createElement('div');
            arrSpan.className = 'arrow';
            arrSpan.style.display = 'none';

            cell.appendChild(valSpan);
            cell.appendChild(arrSpan);

            cell.addEventListener('click', () => handleCellClick(r, c));
            gridEl.appendChild(cell);
        }
    }
    updateGridVisuals();
}

function updateGridVisuals() {
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            const idx = r * GRID_SIZE + c;
            const cell = gridEl.children[idx];

            // clear classes
            cell.classList.remove('start', 'end', 'obstacle', 'path-cell');

            if (r === startCell[0] && c === startCell[1]) {
                cell.classList.add('start');
            } else if (r === endCell[0] && c === endCell[1]) {
                cell.classList.add('end');
            } else if (obstacles.some(ob => ob[0] === r && ob[1] === c)) {
                cell.classList.add('obstacle');
            }

            // Update values and arrows
            const valSpan = cell.querySelector('.val-text');
            const arrSpan = cell.querySelector('.arrow');

            if (currentValues && currentPolicy && !cell.classList.contains('obstacle')) {
                const val = currentValues[r][c];
                const pol = currentPolicy[r][c];

                valSpan.textContent = val.toFixed(2);
                valSpan.style.display = showValuesCb.checked && pol !== 'goal' ? 'block' : 'none';

                if (pol === 'up') arrSpan.innerHTML = '<i class="fa-solid fa-arrow-up"></i>';
                else if (pol === 'down') arrSpan.innerHTML = '<i class="fa-solid fa-arrow-down"></i>';
                else if (pol === 'left') arrSpan.innerHTML = '<i class="fa-solid fa-arrow-left"></i>';
                else if (pol === 'right') arrSpan.innerHTML = '<i class="fa-solid fa-arrow-right"></i>';
                else if (pol === 'goal') arrSpan.innerHTML = '<i class="fa-solid fa-star"></i>';
                else arrSpan.innerHTML = '';

                arrSpan.style.display = showPolicyCb.checked ? 'block' : 'none';

                // Color intensity logic based on Value
                if (!cell.classList.contains('start') && !cell.classList.contains('end') && pol !== 'goal') {
                    const maxV = 1;
                    const minV = -1;
                    let norm = (val - minV) / (maxV - minV);
                    norm = Math.max(0, Math.min(1, norm));

                    const rCol = Math.round(239 - norm * (239 - 34));
                    const gCol = Math.round(68 + norm * (197 - 68));
                    const bCol = Math.round(68 + norm * (94 - 68));

                    cell.style.background = `rgb(${rCol}, ${gCol}, ${bCol})`;
                } else {
                    cell.style.background = '';
                }

                // Highlight final path if it is part of the path
                if (currentPath && currentPath.some(p => p[0] === r && p[1] === c)) {
                    if (!cell.classList.contains('start') && !cell.classList.contains('end')) {
                        cell.classList.add('path-cell');
                    }
                }
            } else {
                valSpan.style.display = 'none';
                arrSpan.style.display = 'none';
                cell.style.background = '';
            }
        }
    }
}

function handleCellClick(r, c) {
    if (currentMode === 'start') {
        if (!obstacles.some(ob => ob[0] === r && ob[1] === c)) {
            startCell = [r, c];
        }
    } else if (currentMode === 'end') {
        if (!obstacles.some(ob => ob[0] === r && ob[1] === c)) {
            endCell = [r, c];
        }
    } else if (currentMode === 'obstacle') {
        if ((r === startCell[0] && c === startCell[1]) || (r === endCell[0] && c === endCell[1])) {
            return; // Can't place obstacle on start or end
        }
        const idx = obstacles.findIndex(ob => ob[0] === r && ob[1] === c);
        if (idx >= 0) {
            obstacles.splice(idx, 1);
        } else {
            obstacles.push([r, c]);
        }
    }

    // Clear calculation when grid modified
    currentValues = null;
    currentPolicy = null;
    currentPath = null;
    updateGridVisuals();
}

modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentMode = btn.dataset.mode;
    });
});

showValuesCb.addEventListener('change', updateGridVisuals);
showPolicyCb.addEventListener('change', updateGridVisuals);

resetBtn.addEventListener('click', () => {
    startCell = [0, 0];
    endCell = [4, 4];
    obstacles = [[1, 1], [2, 2], [3, 3]];
    currentValues = null;
    currentPolicy = null;
    currentPath = null;
    updateGridVisuals();
});

solveBtn.addEventListener('click', async () => {
    solveBtn.disabled = true;
    solveBtn.textContent = 'Calculating...';

    // Timeout applied to allow UI to render calculating state, since valueIteration blocks main thread
    setTimeout(() => {
        const data = valueIteration();
        currentValues = data.values;
        currentPolicy = data.policy;
        currentPath = data.path;
        updateGridVisuals();

        solveBtn.disabled = false;
        solveBtn.textContent = 'Run Value Iteration';
    }, 50);
});

initGrid();
