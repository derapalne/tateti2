import express from "express";
import { Server as HttpServer } from "http";
import { Server as IOServer } from "socket.io";

const app = express();
const httpServer = new HttpServer(app);
const io = new IOServer(httpServer);
const PORT = 8080;

// MEMORIA IDS
let idsActivas = [];

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static("./public"));
app.set("views", "./src/views");
app.set("view engine", "ejs");

// RUTAS

app.get("/", (req, res) => {
    res.render("index");
});

app.get("/local", (req, res) => {
    res.render("local");
});

app.get("/online", (req, res) => {
    res.render("online", { idsActivas: idsActivas });
});

httpServer.listen(PORT, () => {
    console.log("OwO running on port ", PORT);
});

io.on("connection", (socket) => {
    console.log("nuevo cliente conectado:", socket.id);
    socket.on("idGenerada", (nuevoId) => {
        idsActivas.push(nuevoId);
        console.log(idsActivas);
        io.sockets.emit("nuevaPartida", idsActivas);
    });
    socket.on("partidaElegida", (data) => {
        io.sockets.emit("partidaRecibida", data);
    });
    socket.on("partidaConfirmada", (data) => {
        console.log(data);
        idsActivas = idsActivas.filter((e) => e.id != data.id);
        console.log(idsActivas);
        io.sockets.emit("partidaConfirmada", data.confirmacion);
        io.sockets.emit("nuevaPartida", idsActivas);
    });
    socket.on("partidaIniciada", (id) => {
        io.sockets.emit("partidaIniciada", id);
    });
    socket.on("primeraJugada", (data) => {
        io.sockets.emit("primeraJugada", data);
    });
    socket.on("jugadaRealizada", (data) => {
        io.sockets.emit("jugadaRealizada", data);
    })
    socket.on("victoria", (data) => {
        io.sockets.emit("victoria", (data));
    })
});
