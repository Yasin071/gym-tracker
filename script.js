(function() {
    // --- Main Variables ---
    let currentWeight = 20; // Starting weight (20kg barbell)
    let sets = [];
    let restStartTime = null;
    let platesLeft = [];
    let platesRight = [];
    let isMenuOpen = false;
    let holdTimeout;

    // --- DOM Elements ---
    const totalWeightEl = document.getElementById("totalWeight");
    const setsListEl = document.getElementById("setsList");
    const repInput = document.getElementById("repInput");
    const restTimerEl = document.getElementById("restTimer");
    const weightBtn = document.getElementById("weightBtn");
    const weightOptions = document.getElementById("weightOptions");
    const leftPlatesContainer = document.getElementById("leftPlates");
    const rightPlatesContainer = document.getElementById("rightPlates");
    const trashArea = document.getElementById("trashArea");

    // --- Core Functions ---
    function calculateCurrentWeight() {
        let sumPlates = 0;
        platesLeft.forEach(p => sumPlates += p.weight);
        platesRight.forEach(p => sumPlates += p.weight);
        return 20 + sumPlates; // 20kg barbell
    }

    function updateTotalWeight() {
        currentWeight = calculateCurrentWeight();
        totalWeightEl.textContent = `Total: ${currentWeight} kg`;
        totalWeightEl.classList.add("highlight");
        setTimeout(() => totalWeightEl.classList.remove("highlight"), 600);
    }

    function createPlateElement(weight, side, index) {
        const plateEl = document.createElement("div");
        plateEl.classList.add("plate");
        plateEl.textContent = weight;
        plateEl.setAttribute("draggable", "true");
        plateEl.dataset.side = side;
        plateEl.dataset.index = index;
        plateEl.addEventListener("dragstart", dragStart);
        plateEl.addEventListener("dragend", dragEnd);
        return plateEl;
    }

    function renderPlates() {
        leftPlatesContainer.innerHTML = "";
        rightPlatesContainer.innerHTML = "";

        platesLeft.forEach((plate, index) => {
            const plateEl = createPlateElement(plate.weight, "left", index);
            leftPlatesContainer.appendChild(plateEl);
        });

        platesRight.forEach((plate, index) => {
            const plateEl = createPlateElement(plate.weight, "right", index);
            rightPlatesContainer.appendChild(plateEl);
        });
    }

    // --- Drag & Drop Functions ---
    function dragStart(event) {
        const plateEl = event.target;
        event.dataTransfer.setData("text/plain", JSON.stringify({
            side: plateEl.dataset.side,
            index: plateEl.dataset.index
        }));
        trashArea.classList.add("dragover");
    }

    function dragEnd() {
        trashArea.classList.remove("dragover");
    }

    function openWeightMenu() {
    weightOptions.classList.add("show");
    isMenuOpen = true;
    
    // Auto-scroll to show all weights
    setTimeout(() => {
        weightOptions.scrollLeft = weightOptions.scrollWidth;
    }, 50);
}

    function closeWeightMenu() {
        weightOptions.classList.remove("show");
        isMenuOpen = false;
    }

    function addPlates(weightPerPlate) {
    platesLeft.push({weight: weightPerPlate});
    platesRight.push({weight: weightPerPlate});
    updateTotalWeight();
    renderPlates();
}

    // --- Set Management ---
    function renderSets() {
    if (sets.length === 0) {
        setsListEl.innerHTML = '<div class="no-sets">No sets yet</div>';
        restTimerEl.textContent = "First set";
        restStartTime = null;
        return;
    }

    setsListEl.innerHTML = "";
    sets.forEach((set, i) => {
        const div = document.createElement("div");
        div.classList.add("set-item");
        
        // Calculate time since previous set with minutes/seconds formatting
        let timeText = "First set";
        if (i > 0) {
            const prevTime = sets[i-1].time;
            const timeDiffSec = Math.floor((set.time - prevTime) / 1000);
            
            if (timeDiffSec >= 60) {
                const minutes = Math.floor(timeDiffSec / 60);
                const seconds = timeDiffSec % 60;
                timeText = `${minutes}m ${seconds}s rest`;
            } else {
                timeText = `${timeDiffSec}s rest`;
            }
        }
        
        div.textContent = `${i + 1}. ${set.weight}kg × ${set.reps} reps (${timeText})`;
        setsListEl.appendChild(div);
    });
}
    function updateRestTimer() {
        if (!restStartTime) {
            restTimerEl.textContent = "First set";
            return;
        }
        const now = Date.now();
        const diffSec = Math.floor((now - restStartTime) / 1000);
        restTimerEl.textContent = `Rest: ${diffSec} sec`;
    }

    // --- Event Listeners ---
    // Weight Button
    weightBtn.addEventListener("mousedown", (e) => {
        e.preventDefault();
        holdTimeout = setTimeout(openWeightMenu, 200);
    });

    weightBtn.addEventListener("touchstart", (e) => {
        e.preventDefault();
        holdTimeout = setTimeout(openWeightMenu, 200);
    }, { passive: false });

    // Cancel hold if released early
    ["mouseup", "mouseleave", "touchend", "touchcancel"].forEach((evt) => {
        weightBtn.addEventListener(evt, () => {
            clearTimeout(holdTimeout);
        });
    });

    // Weight selection
    document.addEventListener("mouseup", (e) => {
        if (isMenuOpen) {
            const target = e.target;
            if (target.classList.contains("weight-option")) {
                const w = parseInt(target.dataset.weight);
                addPlates(w);
                closeWeightMenu();
            } else {
                closeWeightMenu();
            }
        }
    });

    document.addEventListener("touchend", (e) => {
        if (isMenuOpen) {
            const touch = e.changedTouches[0];
            const el = document.elementFromPoint(touch.clientX, touch.clientY);
            if (el && el.classList.contains("weight-option")) {
                const w = parseInt(el.dataset.weight);
                addPlates(w);
                closeWeightMenu();
            } else {
                closeWeightMenu();
            }
        }
    });

    // Trash area
    trashArea.addEventListener("dragover", (e) => {
        e.preventDefault();
        trashArea.classList.add("dragover");
    });

    trashArea.addEventListener("dragleave", () => {
        trashArea.classList.remove("dragover");
    });

    trashArea.addEventListener("drop", (e) => {
        e.preventDefault();
        trashArea.classList.remove("dragover");

        const data = e.dataTransfer.getData("text/plain");
        if (!data) return;

        const {side, index} = JSON.parse(data);
        if (side === "left") {
            platesLeft.splice(index, 1);
        } else if (side === "right") {
            platesRight.splice(index, 1);
        }

        updateTotalWeight();
        renderPlates();
    });

    // Control buttons
    document.getElementById("saveBtn").addEventListener("click", () => {
        const reps = parseInt(repInput.value);
        if (!reps || reps < 1) {
            alert("Please enter valid reps!");
            return;
        }
        sets.push({ weight: currentWeight, reps: reps, time: Date.now() });
        repInput.value = "";
        renderSets();
        restStartTime = Date.now();
        updateRestTimer();
    });

    document.getElementById("resetBtn").addEventListener("click", () => {
        platesLeft = [];
        platesRight = [];
        updateTotalWeight();
        renderPlates();
        repInput.value = "";
    });

    document.getElementById("deleteBtn").addEventListener("click", () => {
        if (sets.length > 0) {
            sets.pop();
            renderSets();
        }
    });

    // Timer
    setInterval(updateRestTimer, 1000);

    // Initialization
    updateTotalWeight();
    renderPlates();
    renderSets();
})();
