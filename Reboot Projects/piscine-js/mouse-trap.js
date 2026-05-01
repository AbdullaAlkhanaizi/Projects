let box;
let flag = true;
let x;
let y;

export function createCircle() {
    addEventListener("click", () => {
        const circle = document.createElement("div");
        circle.className = "circle";
        circle.style.background = flag ? "white" : "var(--purple)";
        circle.style.left = x;
        circle.style.top = y;
        document.body.appendChild(circle);
        flag = true;
    });
}

export function moveCircle() {
    addEventListener("mousemove", (e) => {
        document.querySelectorAll(".circleRem").forEach(elem => elem.remove());
        x = e.clientX - 25 + "px";
        y = e.clientY - 25 + "px";
        const ghost = document.createElement("div");
        ghost.className = "circle circleRem";
        ghost.style.background = flag ? "white" : "var(--purple)";
        ghost.style.left = x;
        ghost.style.top = y;
        document.body.appendChild(ghost);

        const rect = box.getBoundingClientRect();
        if (
            e.clientX >= rect.left + 25 &&
            e.clientX <= rect.right - 25 &&
            e.clientY >= rect.top + 25 &&
            e.clientY <= rect.bottom - 25
        ) {
            document.querySelector(".circle").style.background = "var(--purple)";
            flag = false;
        }

        if (!flag) {
            if (e.clientX - 25 < rect.left) {
                ghost.style.left = rect.left + "px";
            }
            if (e.clientX + 25 > rect.right) {
                ghost.style.left = rect.right - 50 + "px";
            }
            if (e.clientY - 25 < rect.top) {
                ghost.style.top = rect.top + "px";
            }
            if (e.clientY + 25 > rect.bottom) {
                ghost.style.top = rect.bottom - 50 + "px";
            }
            document.querySelector(".circle").style.background = "var(--purple)";
        }
    });
}

export function setBox() {
    box = document.createElement("div");
    box.className = "box";
    document.body.appendChild(box);
}
