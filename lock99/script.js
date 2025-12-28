let answer = Math.floor(Math.random() * 100);
let chances = 5;
let history = [];

const input = document.getElementById("guess");
input.focus();
input.addEventListener("keyup", e => { if (e.key === "Enter") checkGuess(); });

function checkGuess() {
    let guess = parseInt(input.value);
    let result = document.getElementById("result");

    if (isNaN(guess) || guess < 0 || guess > 99) {
        result.innerHTML = "❗ ใส่เลข 0–99 เท่านั้น";
        result.className = "";
        return;
    }

    if (chances <= 0) return;

    chances--;
    document.getElementById("chance").innerText = chances;

    let status = "";
    if (guess === answer) status = "win";
    else if (guess > answer) status = "down";
    else status = "up";

    history.push({ number: guess, status: status });
    renderHistory();

    if (status === "win") {
        result.innerHTML = "🎉 ถูกต้อง! คุณชนะ!";
        result.className = "result-win";
        endGame();
    }
    else if (status === "down") {
        result.innerHTML = "📉 น้อยกว่านี้";
        result.className = "result-down";
    }
    else {
        result.innerHTML = "📈 มากกว่านี้";
        result.className = "result-up";
    }

    if (chances === 0 && status !== "win") {
        result.innerHTML = "💀 แพ้แล้ว! เลขคือ " + answer;
        result.className = "result-lose";
        endGame();
    }

    input.value = "";
}

function renderHistory() {
    let html = "";
    history.forEach((i, n) => {
        let c = "";
        if (i.status === "up") c = "his-up";
        if (i.status === "down") c = "his-down";
        if (i.status === "win") c = "his-win";
        html += `<span class="badge ${c}">${n + 1}. ${i.number}</span>`;
    });
    document.getElementById("history").innerHTML = html;
}

function endGame() { input.disabled = true; }

function resetGame() {
    answer = Math.floor(Math.random() * 100);
    chances = 5;
    history = [];
    document.getElementById("chance").innerText = 5;
    document.getElementById("result").innerHTML = "";
    document.getElementById("history").innerHTML = "";
    input.disabled = false;
    input.value = "";
    input.focus();
}
