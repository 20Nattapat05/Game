const numbersEl = document.getElementById("numbers");
const statusEl = document.getElementById("status");
const historyEl = document.getElementById("history");
const newGameBtn = document.getElementById("newGameBtn");
const resetBtn = document.getElementById("resetBtn");
const opButtons = document.querySelectorAll(".op");

let originalNumbers = [];
let currentNumbers = [];
let selectedIndexes = [];  // index ของเลขที่เลือกใน currentNumbers
let selectedOp = null;
let history = [];

// แสดงเลขบนการ์ด
function renderNumbers() {
    numbersEl.innerHTML = "";
    currentNumbers.forEach((value, index) => {
        const card = document.createElement("div");
        card.className = "card";
        if (selectedIndexes.includes(index)) {
            card.classList.add("selected");
        }
        card.textContent = Number.isInteger(value) ? value : value.toFixed(2);
        card.addEventListener("click", () => onNumberClick(index));
        numbersEl.appendChild(card);
    });
}

// แสดงข้อความสถานะ
function setStatus(message, isWin = false, isError = false) {
    statusEl.innerHTML = message;
    if (isWin) {
        statusEl.style.color = "#bbf7d0"; // เขียว
    } else if (isError) {
        statusEl.style.color = "#fecaca"; // แดง
    } else {
        statusEl.style.color = "#d1d5db"; // ปกติ
    }
}

// เพิ่มประวัติการคิด
function addHistoryStep(text) {
    history.push(text);
    historyEl.innerHTML = history.map((line, i) => (i + 1) + ". " + line).join("<br/>");
    historyEl.scrollTop = historyEl.scrollHeight;
}

// ล้างการเลือกเลขและปุ่ม
function clearSelection() {
    selectedIndexes = [];
    selectedOp = null;
    opButtons.forEach(btn => btn.classList.remove("selected"));
    renderNumbers();
}

// คลิกเลือกเลข
function onNumberClick(index) {
    if (selectedIndexes.includes(index)) {
        selectedIndexes = selectedIndexes.filter(i => i !== index);
    } else {
        selectedIndexes.push(index);
    }

    const op = selectedOp;
    if (op === "sqrt") {
        // sqrt ใช้เลขได้แค่ตัวเดียว
        if (selectedIndexes.length > 1) {
            selectedIndexes = [selectedIndexes[selectedIndexes.length - 1]];
        }
    } else {
        // + - * / pow ใช้เลข 2 ตัว
        if (selectedIndexes.length > 2) {
            selectedIndexes = selectedIndexes.slice(-2);
        }
    }

    renderNumbers();
    tryApplyOperation();
}

// คลิกเลือกเครื่องหมาย
function onOpClick(op) {
    if (selectedOp === op) {
        // ถ้ากดซ้ำ = ยกเลิก
        selectedOp = null;
        opButtons.forEach(btn => btn.classList.remove("selected"));
    } else {
        selectedOp = op;
        opButtons.forEach(btn => {
            btn.classList.toggle("selected", btn.dataset.op === op);
        });
    }
    tryApplyOperation();
}

// พยายามคำนวณตามที่เลือกอยู่ (เลข + เครื่องหมาย)
function tryApplyOperation() {
    if (!selectedOp) return;

    const op = selectedOp;

    // กรณี sqrt
    if (op === "sqrt") {
        if (selectedIndexes.length === 1) {
            const idx = selectedIndexes[0];
            const a = currentNumbers[idx];
            if (a < 0) {
                setStatus("รูทจำนวนลบไม่ได้ (ในเกมนี้)", false, true);
                return;
            }
            const result = Math.sqrt(a);
            addHistoryStep(`√(${formatNum(a)}) = ${formatNum(result)}`);
            currentNumbers.splice(idx, 1, result);
            checkWinOrContinue();
            clearSelection();
        }
    } else {
        // กรณี + - * / pow ใช้เลข 2 ตัว
        if (selectedIndexes.length === 2) {
            // ✅ ใช้ลำดับที่คลิกจริง ๆ: ตัวแรกที่คลิก = a, ตัวที่สอง = b
            const [firstIdx, secondIdx] = selectedIndexes;
            const a = currentNumbers[firstIdx];
            const b = currentNumbers[secondIdx];

            let result;
            let expression = "";

            if (op === "+") {
                result = a + b;
                expression = `${formatNum(a)} + ${formatNum(b)} = ${formatNum(result)}`;
            } else if (op === "-") {
                // เช่น คลิก 7 แล้วคลิก 1 → 7 - 1
                result = a - b;
                expression = `${formatNum(a)} - ${formatNum(b)} = ${formatNum(result)}`;
            } else if (op === "*") {
                result = a * b;
                expression = `${formatNum(a)} × ${formatNum(b)} = ${formatNum(result)}`;
            } else if (op === "/") {
                if (Math.abs(b) < 1e-9) {
                    setStatus("หารด้วยศูนย์ไม่ได้", false, true);
                    return;
                }
                result = a / b;
                expression = `${formatNum(a)} ÷ ${formatNum(b)} = ${formatNum(result)}`;
            } else if (op === "pow") {
                if (Math.abs(a) > 100 || Math.abs(b) > 5) {
                    setStatus("ยกกำลังเลขนี้อาจใหญ่เกินไป ขอให้เลือกคู่เลขอื่น", false, true);
                    return;
                }
                result = Math.pow(a, b);
                expression = `${formatNum(a)} ^ ${formatNum(b)} = ${formatNum(result)}`;
            }

            addHistoryStep(expression);

            // ลบเลขสองตัวออกแล้วใส่ผลลัพธ์ตัวใหม่เข้าไป
            // ต้องลบ index ใหญ่ก่อนกัน index ขยับ
            const maxIdx = Math.max(firstIdx, secondIdx);
            const minIdx = Math.min(firstIdx, secondIdx);
            currentNumbers.splice(maxIdx, 1);
            currentNumbers.splice(minIdx, 1);
            currentNumbers.push(result);

            checkWinOrContinue();
            clearSelection();
        }
    }
}

// ฟอร์แมตตัวเลขให้สวย
function formatNum(n) {
    return Number.isInteger(n) ? n.toString() : n.toFixed(2);
}

// เช็คว่าชนะ (เหลือตัวเดียว = 24) หรือยังเล่นต่อได้
function checkWinOrContinue() {
    renderNumbers();
    if (currentNumbers.length === 1) {
        const val = currentNumbers[0];
        if (Math.abs(val - 24) < 1e-6) {
            setStatus(`เยี่ยม! คุณทำได้เป็น 24 (ผลลัพธ์ = ${formatNum(val)}) 🎉`, true);
        } else {
            setStatus(`ยังไม่ใช่ 24 (ได้ ${formatNum(val)}) ลองสุ่มด่านใหม่หรือเริ่มด่านนี้ใหม่ดู`, false, true);
        }
    } else {
        setStatus("เลือกเลข 2 ตัว แล้วเลือกเครื่องหมาย (√ ใช้เลือกเลขตัวเดียว)");
    }
}

// ---------- ตัวเช็คว่าเลข 4 ตัวนี้สามารถทำให้ได้ 24 จริงไหม (ด้วย + − × ÷) ----------

function canMake24(nums) {
    const EPS = 1e-6;

    function helper(arr) {
        if (arr.length === 1) {
            return Math.abs(arr[0] - 24) < EPS;
        }

        for (let i = 0; i < arr.length; i++) {
            for (let j = i + 1; j < arr.length; j++) {
                const a = arr[i];
                const b = arr[j];
                const next = [];

                for (let k = 0; k < arr.length; k++) {
                    if (k !== i && k !== j) {
                        next.push(arr[k]);
                    }
                }

                const candidates = [];
                candidates.push(a + b);
                candidates.push(a - b);
                candidates.push(b - a);
                candidates.push(a * b);
                if (Math.abs(b) > EPS) candidates.push(a / b);
                if (Math.abs(a) > EPS) candidates.push(b / a);

                for (const c of candidates) {
                    if (helper(next.concat([c]))) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    return helper(nums);
}

// สุ่มด่านที่ทำให้ได้ 24 ได้แน่นอน
function generateSolvablePuzzle() {
    let nums;
    do {
        nums = [];
        for (let i = 0; i < 4; i++) {
            nums.push(1 + Math.floor(Math.random() * 9)); // 1-9
        }
    } while (!canMake24(nums));
    return nums;
}

// เริ่มด่านใหม่ (สุ่มเลขใหม่)
function startNewGame() {
    originalNumbers = generateSolvablePuzzle();
    currentNumbers = [...originalNumbers];
    history = [];
    historyEl.innerHTML = "";
    renderNumbers();
    clearSelection();
    setStatus("เริ่มด่านใหม่แล้ว ลองทำให้ได้ 24 ดู!");
}

// เริ่มด่านเดิมใหม่ (ใช้เลขชุดเดิม)
function resetCurrentGame() {
    currentNumbers = [...originalNumbers];
    history = [];
    historyEl.innerHTML = "";
    clearSelection();
    renderNumbers();
    setStatus("เริ่มด่านนี้ใหม่แล้ว");
}

// event listeners
opButtons.forEach(btn => {
    btn.addEventListener("click", () => onOpClick(btn.dataset.op));
});

newGameBtn.addEventListener("click", startNewGame);
resetBtn.addEventListener("click", resetCurrentGame);

// เริ่มเกมรอบแรก
startNewGame();
