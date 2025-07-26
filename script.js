// script.js

// Objeto para guardar la posición actual de cada carrito (almacenará píxeles)
const carPositions = {
    colombia: 0,
    mexico: 0,
    espana: 0,
    argentina: 0,
    chile: 0
};

// Objeto para guardar el conteo de victorias de cada país
const winnerScores = {
    colombia: 0,
    mexico: 0,
    espana: 0,
    argentina: 0,
    chile: 0
};

// --- CONSTANTES CRÍTICAS: ASEGÚRATE DE QUE COINCIDAN CON TU CSS ---
const CAR_WIDTH_PX = 70;
const CAR_INITIAL_LEFT_PX = 100;
const FINISH_LINE_RIGHT_PX = 0; // Línea de meta pegada a la derecha
const FINISH_LINE_WIDTH_PX = 50; // Ancho de la línea de meta para el texto

let TARGET_CAR_LEFT_POSITION_PX = 0;

const connectionStatusElement = document.getElementById('connection-status');

function updateConnectionStatus(message, color = '#bbb') {
    if (connectionStatusElement) {
        connectionStatusElement.textContent = `Estado de conexión: ${message}`;
        connectionStatusElement.style.color = color;
    }
}

function calculateTargetPosition() {
    const trackElement = document.querySelector('.track');
    let trackWidthPx = 0;
    if (trackElement) {
        trackWidthPx = trackElement.clientWidth;
        console.log(`Debug: Ancho de pista (clientWidth) = ${trackWidthPx}px`);
    } else {
        console.log("Debug: No se encontró el elemento .track.");
        return;
    }

    // Calcula el borde izquierdo absoluto de la línea de meta
    const finishLineAbsoluteLeftPx = trackWidthPx - FINISH_LINE_RIGHT_PX - FINISH_LINE_WIDTH_PX;
    console.log(`Debug: Borde izquierdo de la meta (absoluto) = ${finishLineAbsoluteLeftPx}px`);

    // La posición objetivo para el translateX del carrito
    TARGET_CAR_LEFT_POSITION_PX = finishLineAbsoluteLeftPx - CAR_INITIAL_LEFT_PX;

    if (TARGET_CAR_LEFT_POSITION_PX < 0) TARGET_CAR_LEFT_POSITION_PX = 0;

    console.log(`Debug: Distancia final a traducir (TARGET_CAR_LEFT_POSITION_PX) = ${TARGET_CAR_LEFT_POSITION_PX}px`);
}

const hasFinished = {
    colombia: false,
    mexico: false,
    espana: false,
    argentina: false,
    chile: false
};

function updateWinnerPanel() {
    let maxScore = -1;
    let leaders = [];

    for (const country in winnerScores) {
        document.getElementById(`crown-${country}`).style.visibility = 'hidden';
    }

    for (const country in winnerScores) {
        const scoreElement = document.getElementById(`score-${country}`);
        scoreElement.textContent = winnerScores[country];

        if (winnerScores[country] > maxScore) {
            maxScore = winnerScores[country];
            leaders = [country];
        } else if (winnerScores[country] === maxScore && maxScore > 0) {
            leaders.push(country);
        }
    }

    if (maxScore > 0) {
        leaders.forEach(leaderCountry => {
            document.getElementById(`crown-${leaderCountry}`).style.visibility = 'visible';
        });
    }
}

function simulateGift(country) {
    if (hasFinished[country]) {
        console.log(`${country.charAt(0).toUpperCase() + country.slice(1)} ya ha llegado a la meta.`);
        return;
    }

    const carElement = document.getElementById(`car-${country}`);
    if (carElement) {
        const advancePerGift = 15; // Mueve el carrito 15 píxeles por cada "regalo". Ajusta este valor.

        carPositions[country] += advancePerGift;

        if (carPositions[country] >= TARGET_CAR_LEFT_POSITION_PX) {
            carPositions[country] = TARGET_CAR_LEFT_POSITION_PX;
            if (!hasFinished[country]) {
                console.log(`${country.charAt(0).toUpperCase() + country.slice(1)} ha cruzado la meta!`);
                // alert(`${country.charAt(0).toUpperCase() + country.slice(1)} ha cruzado la meta! ¡Felicidades!`); // Considera quitar esta alerta en producción
                
                winnerScores[country]++;
                updateWinnerPanel();

                hasFinished[country] = true;
            }
        }

        carElement.style.transform = `translateY(-50%) translateX(${carPositions[country]}px) scaleX(-1)`;
    } else {
        console.error(`Elemento del carrito para ${country} no encontrado.`);
    }
}

function resetRace() {
    for (const country in carPositions) {
        carPositions[country] = 0;
        const carElement = document.getElementById(`car-${country}`);
        if (carElement) {
            carElement.style.transform = `translateY(-50%) translateX(0px) scaleX(-1)`;
        }
        hasFinished[country] = false;
    }
    console.log("Carrera reiniciada.");
    // Si quieres reiniciar también los scores de ganadores, descomenta las siguientes líneas:
    // for (const country in winnerScores) {
    //     winnerScores[country] = 0;
    // }
    // updateWinnerPanel();
}


// --- CONEXIÓN A TU SERVIDOR FLASK VIA SOCKET.IO ---
const FLASK_SOCKETIO_URL = "http://localhost:5000"; // Asegúrate de que este puerto coincida con tu app.py
let socket;

function connectToBackend() {
    socket = io(FLASK_SOCKETIO_URL);

    socket.on('connect', () => {
        console.log('Conectado al servidor Flask (Socket.IO)!');
        updateConnectionStatus('Conectado', '#0f0'); // Verde
    });

    socket.on('tiktok_event', (eventData) => {
        console.log('Evento de TikTok recibido de Flask:', eventData);

        // La lógica para manejar los eventos sigue siendo similar
        if (eventData.event === "gift") {
            const giftData = eventData.data;
            const giftName = giftData.giftName;
            const uniqueId = giftData.uniqueId;

            console.log(`🎁 Regalo '${giftName}' de @${uniqueId}`);

            // --- Lógica para mapear regalos a países ---
            // ESTA ES LA CLAVE. Necesitas adaptar esto según lo que tu app.py te envíe.
            // Si app.py te envía 'rosa' y quieres que la rosa mueva a Colombia:
            let countryToMove = null;

            if (giftName === 'Rosa') { // 'Rosa' porque app.py lo capitalize
                countryToMove = 'colombia';
            } else if (giftName === 'Finger Heart') {
                countryToMove = 'mexico';
            } else if (giftName === 'Lion') {
                countryToMove = 'espana';
            } else if (giftName === 'Pizza') {
                countryToMove = 'argentina';
            } else if (giftName === 'Fireworks' || giftName === 'Chili') {
                countryToMove = 'chile';
            }
            // Agrega más condiciones según tus necesidades

            if (countryToMove) {
                simulateGift(countryToMove);
            } else {
                console.warn(`Regalo '${giftName}' no mapeado a ningún país.`);
            }

        } else if (eventData.event === "chat") {
            // Manejar eventos de chat si los recibes y son relevantes
            console.log(`💬 Chat recibido: ${eventData.data.comment}`);
        }
        // ... otros tipos de eventos ...
    });

    socket.on('disconnect', () => {
        console.log('Desconectado del servidor Flask (Socket.IO). Intentando reconectar...');
        updateConnectionStatus('Desconectado. Reconectando...', '#ff0'); // Amarillo
        // No necesitamos un setTimeout aquí; Socket.IO tiene reconexión automática por defecto
    });

    socket.on('connect_error', (error) => {
        console.error('Error de conexión a Socket.IO:', error);
        updateConnectionStatus('Error de conexión', '#f00'); // Rojo
    });
}

// Inicialización al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    calculateTargetPosition();
    updateWinnerPanel();
    connectToBackend(); // Inicia la conexión con tu servidor Flask
});

window.addEventListener('resize', calculateTargetPosition);



 