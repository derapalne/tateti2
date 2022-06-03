
const logica = [];
const celulas = [];

const texto = document.getElementById("texto");
const reset = document.getElementById("reset");

let player = "o";

const mOver = (obj) => {
    if (player == "o") {
        obj.setAttribute("src", "/images/circle.png");
    } else {
        obj.setAttribute("src", "/images/cross.png");
    }
};

const mOut = (obj) => {
    obj.setAttribute("src", "/images/blank.png");
};

const cambiarJugador = () => {
    if (player == "o") {
        player = "x";
    } else {
        player = "o";
    }
};

reset.setAttribute("onclick", "inicializar()");

const victoria = () => {
    texto.innerText = `JUGADOR ${player} GANA`;
    document.getElementsByClassName("actual").item(0).classList.remove("actual");
    celulas.forEach((mt) => {
        mt.forEach((c) => {
            c.removeAttribute("onclick");
            c.removeAttribute("onmouseover");
        });
    });
};

// Jugadas ganadoras
const jg = ["012", "048", "036", "147", "258", "246", "345", "678"];

const chequear = (tateti) => {
    //console.log(tateti);
    let win = false;
    jg.forEach((j) => {
        if (
            tateti[j[0]].jugador == player &&
            tateti[j[1]].jugador == player &&
            tateti[j[2]].jugador == player
        ) {
            win = true;
        }
    });
    return win;
};

const chequearGlobal = () => {
    jg.forEach((j) => {
        // console.log(logica[j[0]].jugador);
        // console.log(logica[j[1]].jugador);
        // console.log(logica[j[2]].jugador);
        if (
            logica[j[0]].jugador == player &&
            logica[j[1]].jugador == player &&
            logica[j[2]].jugador == player
        ) {
            victoria();
            for (let n = 0; n < 3; n++) {
                document.getElementById(`tateti${j[n]}`).classList.add(`ganador${player}`);
            }
        }
    });
};

const estaLleno = (tateti) => {
    let lleno = true;
    for(let i = 0; i < 9; i++) {
        if(!tateti[i].estado) {
            lleno = false;
            break;
        }
    }
    return lleno;
}

const jugada = (numeroCelula) => {
    console.log(numeroCelula);
    if(estaLleno(logica[numeroCelula[1]].mini)) {
        console.log("lleno");
        for(let i = 0; i < 8; i++) {
            if(!estaLleno(logica[i].mini)) {
                numeroCelula = numeroCelula[0] + i;
                break;
            }
        }
        console.log(numeroCelula);
    }
    // Iterar todos los tateties
    for (let i = 0; i < celulas.length; i++) {
        const tatetiActual = document.getElementById(`tateti${i}`);
        // Si no es el tateti objetivo deshabilitalo
        if (i != numeroCelula[1]) {
            for (let j = 0; j < 9; j++) {
                const c = document.getElementById(`celula${i}${j}`);
                c.removeAttribute("onmouseover");
                c.removeAttribute("onmouseout");
                c.removeAttribute("onclick");
            }
            tatetiActual.classList.remove("actual");
        }
        // Si es el tateti objetivo habilitalo
        else {
            console.log("hola");
            tatetiActual.classList.add("actual");
            for (let j = 0; j < 9; j++) {
                const celula = document.getElementById(`celula${i}${j}`);
                // Habilitar solo las casillas vacías
                if (celula.getAttribute("src") == "/images/blank.png") {
                    celula.setAttribute("onmouseover", "mOver(this)");
                    celula.setAttribute("onmouseout", "mOut(this)");
                    celula.setAttribute("onclick", `jugada("${i}${j}")`);
                }
            }
        }
    }
    // Si el tateti objetivo y el de partida coinciden
    // hay que bloquear la célula donde se jugó
    if (numeroCelula[0] == numeroCelula[1]) {
        console.log("iguales", numeroCelula);
        const c = document.getElementById(`celula${numeroCelula}`);
        c.removeAttribute("onmouseover");
        c.removeAttribute("onmouseout");
        c.removeAttribute("onclick");
    }
    // Actualizar el estado de la célula
    logica[numeroCelula[0]].mini[numeroCelula[1]].estado =
        !logica[numeroCelula[0]].mini[numeroCelula[1]].estado;
    logica[numeroCelula[0]].mini[numeroCelula[1]].jugador = player;
    if (chequear(logica[numeroCelula[0]].mini) && !logica[numeroCelula[0]].estado) {
        console.log(logica[numeroCelula[0]]);
        logica[numeroCelula[0]].jugador = player;
        logica[numeroCelula[0]].estado = true;
        chequearGlobal();
        const tatetiActual = document.getElementById(`tateti${numeroCelula[0]}`);
        tatetiActual.classList.add(`punto${player}`);
    }
    cambiarJugador();
};

const inicializar = () => {
    celulas.length = 0;
    // Visuales
    for (let i = 0; i < 9; i++) {
        const miniTateti = [];
        for (let j = 0; j < 9; j++) {
            const celula = document.getElementById(`celula${i}${j}`);
            celula.setAttribute("onmouseover", "mOver(this)");
            celula.setAttribute("onmouseout", "mOut(this)");
            celula.setAttribute("onclick", `jugada("${i}${j}")`);
            celula.setAttribute("src", "/images/blank.png");
            miniTateti.push(celula);
        }
        celulas.push(miniTateti);
        const tateti = document.getElementById(`tateti${i}`);
        tateti.classList.remove("actual", "puntoo", "puntox", "ganadoro", "ganadorx");
    }
    texto.innerText = "- - - - - - - - - - -";
    // Lógica
    logica.length = 0;
    for (let i = 0; i < 9; i++) {
        const mini = [];
        for (let j = 0; j < 9; j++) {
            mini.push({
                jugador: 0,
                estado: false,
            });
        }
        logica.push({
            mini: mini,
            jugador: 0,
            estado: false,
        });
    }
};

inicializar();

// console.log(celulas);
