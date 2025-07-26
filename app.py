# app.py
from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit
from flask_cors import CORS

app = Flask(__name__)
# Permitir CORS desde cualquier origen para desarrollo.
# En producción, considera restringir a un origen específico.
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

@app.route('/')
def index():
    return "Servidor Flask para eventos de TikTok."

# Este es el endpoint que StreamToEarn llamará con una solicitud POST
@app.route('/tiktok_event', methods=['POST'])
def receive_tiktok_event():
    if request.is_json:
        data_from_streamearn = request.get_json()
        print(f"JSON recibido de StreamToEarn: {data_from_streamearn}")

        # Aquí verificamos el tipo de evento que nos envía StreamToEarn
        event_type = data_from_streamearn.get('tiktok_event_type')

        if event_type == "gift":
            # Si es un regalo, reenviamos los datos al frontend
            # con la estructura que tu script.js ya espera.
            # Los nombres de las claves (giftName, uniqueId, repeatCount) deben coincidir.
            
            # Mapeamos los datos de StreamToEarn a la estructura de TikTok-Live-Connector
            # que tu script.js está utilizando actualmente.
            event_for_frontend = {
                "event": "gift",
                "data": {
                    "giftName": data_from_streamearn.get('gift_name'),
                    "uniqueId": data_from_streamearn.get('sender_nickname'),
                    "repeatCount": data_from_streamearn.get('gift_count', 1), # Default a 1 si no viene
                    # Puedes añadir más campos si los necesitas y StreamToEarn los envía:
                    # "diamondCount": data_from_streamearn.get('coins', 0)
                }
            }
            print(f"Emitiendo evento 'gift' a clientes (Socket.IO): {event_for_frontend}")
            socketio.emit('tiktok_event', event_for_frontend) # 'tiktok_event' es el nombre del evento de Socket.IO
            
            return jsonify({"status": "success", "message": "Evento de regalo procesado y enviado."}), 200
        
        # Puedes añadir manejo para otros tipos de eventos que StreamToEarn pueda enviar,
        # si los configuras y los necesitas en tu frontend.
        # Por ejemplo, para comentarios:
        # elif event_type == "comment":
        #    event_for_frontend = {
        #        "event": "chat", # Usamos 'chat' para coincidir con tu script.js
        #        "data": {
        #            "uniqueId": data_from_streamearn.get('sender_nickname'),
        #            "comment": data_from_streamearn.get('comment') # Asumiendo que StreamToEarn envía {comment}
        #        }
        #    }
        #    print(f"Emitiendo evento 'chat' a clientes: {event_for_frontend}")
        #    socketio.emit('tiktok_event', event_for_frontend)
        #    return jsonify({"status": "success", "message": "Evento de comentario procesado y enviado."}), 200

        else:
            print(f"Tipo de evento desconocido o no manejado: {event_type}. Reenviando tal cual.")
            # Si no es un tipo de evento que manejemos específicamente, lo reenviamos directamente
            socketio.emit('tiktok_event', data_from_streamearn)
            return jsonify({"status": "success", "message": "Evento desconocido reenviado."}), 200
    else:
        return jsonify({"status": "error", "message": "Request must be JSON"}), 400

@socketio.on('connect')
def test_connect():
    print("Cliente Socket.IO conectado")
    emit('my response', {'data': 'Conectado al servidor Flask'})

@socketio.on('disconnect')
def test_disconnect():
    print("Cliente Socket.IO desconectado")

if __name__ == '__main__':
    # En desarrollo local, usamos socketio.run
    socketio.run(app, debug=True, port=5000)
else:
    # En producción (como en Render), usamos un WSGI server como Gunicorn
    # Render asignará un puerto a través de la variable de entorno PORT
    # Flask-SocketIO internamente usa werkzeug o gevent para el WSGI server
    # Si usas gunicorn, el comando de inicio en Render será 'gunicorn app:app --worker-class geventwebsocket.gunicorn.workers.GeventWebSocketWorker -b 0.0.0.0:$PORT'
    pass # No necesitas poner nada aquí si el comando de inicio en Render es el que maneja todo.
         # Esto solo es para aclarar que el if __name__ == '__main__' es para local.

  