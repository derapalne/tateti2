const socket = io();

const logica = [];
const celulas = [];
let idExistente = false;
let estaJugando = false;
let topPlayer = false;
let nombreJugador = "";
let nombreContrincante = "";
let idPartidaActual = "";
let player = "o";

// ICONO
const dynamicIcon = document.getElementById("dynamic-icon");
console.log(dynamicIcon);
// SUBTITULO
const texto = document.getElementById("texto");
// GENERAR PARTIDA (TOP)
const divGenerarPartida = document.getElementById("divGenerarPartida");
const generate = document.getElementById("generate");
const idPartidaNombre = document.getElementById("idPartidaNombre");
const idPartidaGenerada = document.getElementById("idPartidaGenerada");
const esperandoContrincante = document.getElementById("esperandoContrincante");
// BUSCAR PARTIDA (BOTTOM)
const divBuscarPartida = document.getElementById("divBuscarPartida");
const partidasActuales = document.getElementById("partidasActuales");
const nombreJugadorInput = document.getElementById("nombreJugador");
const okId = document.getElementById("okId");
// INFO PARTIDA
const divPartidaElegida = document.getElementById("divPartidaElegida");
const partidaElegida = document.getElementById("partidaElegida");
// ABANDONAR
const leave = document.getElementById("leave");
const contadorTurnos = document.getElementById("contadorTurnos");

const pantallaJuego = document.getElementById("pantallaJuego");

const sonidos = {
    start: new Audio("/audio/start.mp3"),
    loss: new Audio("/audio/loss.mp3"),
    win: new Audio("/audio/win.mp3"),
    moveGood: new Audio("/audio/move-good.mp3"),
    moveBad: new Audio("/audio/move-bad.mp3"),
    pointGood: new Audio("/audio/point-good.mp3"),
    pointBad: new Audio("/audio/point-bad.mp3"),
};

// ---- LOGICA DE PARTIDAS ---- //

generate.setAttribute("onclick", "generarId()");

// TOP
const generarId = () => {
    const nombrePartida = idPartidaNombre.value.trim();
    console.log(nombrePartida);
    if (nombrePartida.length > 3) {
        if (!idExistente) {
            const time = Date.now().toString().slice(10);
            const id = nombrePartida + "-" + time;
            socket.emit("idGenerada", {
                id: id,
            });
            idExistente = true;
            idPartidaActual = id;
            topPlayer = true;
            idPartidaGenerada.innerHTML = `Tu id es: <strong>${id}</strong>`;
            esperandoContrincante.classList.remove("invisible");
            divBuscarPartida.classList.add("invisible");
            divGenerarPartida.classList.add("invisible");
            player = "o";
            console.log("id generada");
        }
    } else {
        idPartidaGenerada.innerText = `Tu nombre debe tener cuatro caracteres o m??s`;
    }
};

// BOTTOM
socket.on("nuevaPartida", (idsActivas) => {
    if (!estaJugando) {
        partidasActuales.innerHTML = "";
        idsActivas.forEach((id) => {
            const option = document.createElement("option");
            option.innerText = id.id;
            partidasActuales.appendChild(option);
        });
    }
});

okId.setAttribute("onclick", `elegirPartida()`);

// BOTTOM
const elegirPartida = () => {
    if (nombreJugadorInput.value.trim().length > 3) {
        // l??gica
        const elegida = partidasActuales.value;
        idPartidaActual = elegida;
        nombreJugador = nombreJugadorInput.value.trim();
        player = "x";
        // visuales
        divGenerarPartida.classList.add("invisible");
        divBuscarPartida.classList.add("invisible");
        partidaElegida.innerHTML = `Tu partida es: <strong>${elegida}<strong/>`;
        // socket
        socket.emit("partidaElegida", { id: elegida, nombreJugador: nombreJugador });
    } else {
        divPartidaElegida.innerText = "Tu nombre debe tener cuatro caracteres o m??s";
    }
};

// TOP
socket.on("partidaRecibida", (data) => {
    // agregar data nombre contrincante
    if (!estaJugando && topPlayer) {
        if (idPartidaActual == data.id) {
            nombreContrincante = data.nombreJugador;
            esperandoContrincante.classList.add("invisible");
            partidaElegida.innerHTML = `Est??s jugando contra <strong>${nombreContrincante}<strong/>`;
            const confirmacion = `OK-${data.id}`;
            socket.emit("partidaConfirmada", { confirmacion: confirmacion, id: data.id });
            estaJugando = true;
            console.log("partida recibida");
        }
    }
});

// BOTTOM
socket.on("partidaConfirmada", (confirmacion) => {
    if (!estaJugando && !topPlayer) {
        console.log(confirmacion, "confirmacion");
        if (confirmacion.substring(3) == idPartidaActual) {
            estaJugando = true;
            pantallaJuego.classList.remove("invisible");
            inicializar(topPlayer);
            socket.emit("partidaIniciada", idPartidaActual);
            sonidos.start.play();
        }
    }
});

// TOP (primera jugada)
socket.on("partidaIniciada", (id) => {
    if (estaJugando && id == idPartidaActual && topPlayer) {
        pantallaJuego.classList.remove("invisible");
        inicializar(topPlayer);
        console.log("top iniciada");
        contadorTurnos.innerText = "Tu turno";
        sonidos.start.play();
    }
});

// BOTTOM (primera jugada)
socket.on("primeraJugada", (data) => {
    if (estaJugando && data.id == idPartidaActual && !topPlayer) {
        iniciarJugada(data.numeroCelula, false);
        // visuales
        contadorTurnos.innerText = "Tu turno";
        contadorTurnos.classList.remove("turnoo");
        contadorTurnos.classList.add("turnox");
        dynamicIcon.setAttribute("href", "/images/cross.png");
    }
});

// BOTH
socket.on("jugadaRealizada", (data) => {
    if (estaJugando && data.id == idPartidaActual && data.jugador != player) {
        iniciarJugada(data.numeroCelula, data.punto);
        contadorTurnos.innerText = "Tu turno";
        contadorTurnos.classList.remove("turno" + data.jugador);
        contadorTurnos.classList.add("turno" + player);
        const favIconLink = player == "x" ? "/images/cross.png" : "/images/circle.png";
        dynamicIcon.setAttribute("href", favIconLink);
    }
});

// BOTH
socket.on("victoria", (data) => {
    if (estaJugando && data.id == idPartidaActual) {
        estaJugando = false;
        if (data.jugador == player) {
            contadorTurnos.innerText = "Ganaste!";
            document.getElementById(`tateti${data.numeroCelula[0]}`).classList.remove("actual");
            deshabilitarTodo();
            sonidos.win.play();
        } else {
            for (let n = 0; n < 3; n++) {
                document
                    .getElementById(`tateti${data.jugada[n]}`)
                    .classList.add(`ganador${data.player}`);
            }
            contadorTurnos.innerText = "Perdiste!";
            iniciarJugada(data.numeroCelula);
            document.getElementById(`tateti${data.numeroCelula[0]}`).classList.remove("actual");
            deshabilitarTodo();
            sonidos.loss.play();
        }
    }
});

// LOGICA DE JUEGO

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

// const victoria = () => {
//     texto.innerText = `JUGADOR ${player} GANA`;
//     document.getElementsByClassName("actual").item(0).classList.remove("actual");
//     celulas.forEach((mt) => {
//         mt.forEach((c) => {
//             c.removeAttribute("onclick");
//             c.removeAttribute("onmouseover");
//         });
//     });
// };

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

const chequearGlobal = (numeroCelula) => {
    let victoriaGlobal = false;
    jg.forEach((j) => {
        if (
            logica[j[0]].jugador == player &&
            logica[j[1]].jugador == player &&
            logica[j[2]].jugador == player
        ) {
            victoriaGlobal = true;
            for (let n = 0; n < 3; n++) {
                document.getElementById(`tateti${j[n]}`).classList.add(`ganador${player}`);
            }
            socket.emit("victoria", {
                jugador: player,
                id: idPartidaActual,
                numeroCelula: numeroCelula,
                jugada: j,
            });
        }
    });
    if (!victoriaGlobal) {
        sonidos.pointGood.play();
    }
};

const estaLleno = (tateti) => {
    let lleno = true;
    for (let i = 0; i < 9; i++) {
        if (!tateti[i].estado) {
            lleno = false;
            break;
        }
    }
    return lleno;
};

const iniciarJugada = (numeroCelula, punto) => {
    const contrincante = player == "x" ? "o" : "x";
    // Mostrar jugada anterior
    logica[numeroCelula[0]].mini[numeroCelula[1]].estado = true;
    logica[numeroCelula[0]].mini[numeroCelula[1]].jugador = contrincante;
    const celulaJugada = document.getElementById(`celula${numeroCelula}`);
    celulaJugada.setAttribute("src", contrincante == "x" ? "/images/cross.png" : "/images/circle.png");
    if (punto) {
        document.getElementById(`tateti${numeroCelula[0]}`).classList.add(`punto${contrincante}`);
        sonidos.pointBad.play();
    } else {
        sonidos.moveBad.play();
    }
    // Jugada actual
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
            tatetiActual.classList.add("actual");
            for (let j = 0; j < 9; j++) {
                const celula = document.getElementById(`celula${i}${j}`);
                // Habilitar solo las casillas vac??as
                if (celula.getAttribute("src") == "/images/blank.png") {
                    celula.setAttribute("onmouseover", "mOver(this)");
                    celula.setAttribute("onmouseout", "mOut(this)");
                    celula.setAttribute("onclick", `jugada("${i}${j}")`);
                }
            }
        }
    }
};

const jugada = (numeroCelula) => {
    // Actualizar el estado de la c??lula
    logica[numeroCelula[0]].mini[numeroCelula[1]].estado =
        !logica[numeroCelula[0]].mini[numeroCelula[1]].estado;
    logica[numeroCelula[0]].mini[numeroCelula[1]].jugador = player;
    // Confirmar si se marc?? un punto
    let punto = false;
    // Si chequear devuelve verdadero y no se marc?? un punto antes en ese casillero
    // marc?? el punto
    if (chequear(logica[numeroCelula[0]].mini) && !logica[numeroCelula[0]].estado) {
        logica[numeroCelula[0]].jugador = player;
        logica[numeroCelula[0]].estado = true;
        punto = true;
        chequearGlobal(numeroCelula);
        document.getElementById(`tateti${numeroCelula[0]}`).classList.add(`punto${player}`);
    } else {
        sonidos.moveGood.play();
    }
    // Visuales
    deshabilitarTodo();
    // Hac?? que no se muestre el tateti viejo
    document.getElementById(`tateti${numeroCelula[0]}`).classList.remove("actual");
    // y que se muestre el tateti actual pero fijate que no est?? lleno
    if (estaLleno(logica[numeroCelula[1]].mini)) {
        for (let i = 0; i < 8; i++) {
            if (!estaLleno(logica[i].mini)) {
                numeroCelula = numeroCelula[0] + i;
                break;
            }
        }
    }
    document.getElementById(`tateti${numeroCelula[1]}`).classList.add("actual");
    contadorTurnos.innerText = "Turno de tu oponente";
    const contrincante = player == "x" ? "o" : "x";
    contadorTurnos.classList.remove("turno" + player);
    contadorTurnos.classList.add("turno" + contrincante);
    const favIconLink = contrincante == "x" ? "/images/cross.png" : "/images/circle.png";
    dynamicIcon.setAttribute("href", favIconLink);

    // Socket
    socket.emit("jugadaRealizada", {
        numeroCelula: numeroCelula,
        id: idPartidaActual,
        jugador: player,
        punto: punto,
    });
};

const primeraJugada = (numeroCelula) => {
    logica[numeroCelula[0]].mini[numeroCelula[1]].estado =
        !logica[numeroCelula[0]].mini[numeroCelula[1]].estado;
    logica[numeroCelula[0]].mini[numeroCelula[1]].jugador = player;
    socket.emit("primeraJugada", { numeroCelula: numeroCelula, id: idPartidaActual });
    deshabilitarTodo();
    // Hac?? que se muestre el tateti actual
    document.getElementById(`tateti${numeroCelula[0]}`).classList.remove("actual");
    // y que no se muestre el viejo
    document.getElementById(`tateti${numeroCelula[1]}`).classList.add("actual");
    contadorTurnos.innerText = "Turno de tu oponente";
    const contrincante = player == "x" ? "o" : "x";
    contadorTurnos.classList.remove("turno" + player);
    contadorTurnos.classList.add("turno" + contrincante);
    const favIconLink = contrincante == "x" ? "/images/cross.png" : "/images/circle.png";
    dynamicIcon.setAttribute("href", favIconLink);
    sonidos.moveGood.play();
};

const deshabilitarTodo = () => {
    celulas.forEach((mini) => {
        mini.forEach((c) => {
            c.removeAttribute("onmouseover");
            c.removeAttribute("onmouseout");
            c.removeAttribute("onclick");
        });
    });
};

const inicializar = (isTop) => {
    celulas.length = 0;
    // Visuales
    for (let i = 0; i < 9; i++) {
        const miniTateti = [];
        for (let j = 0; j < 9; j++) {
            const celula = document.getElementById(`celula${i}${j}`);
            if (isTop) {
                celula.setAttribute("onmouseover", "mOver(this)");
                celula.setAttribute("onmouseout", "mOut(this)");
                celula.setAttribute("onclick", `primeraJugada("${i}${j}")`);
            }
            celula.setAttribute("src", "/images/blank.png");
            miniTateti.push(celula);
        }
        celulas.push(miniTateti);
        const tateti = document.getElementById(`tateti${i}`);
        tateti.classList.remove("actual", "puntoo", "puntox", "ganadoro", "ganadorx");
    }
    texto.innerText = "- - - - - - - - - - -";
    // L??gica
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
