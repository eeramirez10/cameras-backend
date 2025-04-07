const express = require('express');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const cors = require('cors'); 
const { config } = require('dotenv');

const app = express();
const port = process.env.PORT;
config()


app.use(cors());

// Define la carpeta donde se guardarán los archivos HLS
const hlsFolder = path.join(__dirname, 'hls');

// Crea la carpeta "hls" si no existe
if (!fs.existsSync(hlsFolder)) {
  fs.mkdirSync(hlsFolder);
}

// URL del stream RTSP
const rtspUrl = process.env.RTSP_URL;

console.log(rtspUrl)

// Opciones de FFmpeg para convertir RTSP a HLS
const ffmpegArgs = [
  '-rtsp_transport', 'tcp',                   // Forzar el uso de TCP
  '-i', rtspUrl,                              // URL de entrada RTSP
  '-c:v', 'libx264',                          // Usar el encoder H264
  '-preset', 'veryfast',                      // Ajuste para baja latencia
  '-tune', 'zerolatency',                     // Tuning para streaming en vivo
  '-r', '30',                                 // 30 fps
  '-b:v', '1000k',                            // Bitrate de video
  '-pix_fmt', 'yuv420p',                      // Formato de píxel compatible
  '-f', 'hls',                                // Formato de salida HLS
  '-hls_time', '4',                           // Duración de cada segmento en segundos
  '-hls_list_size', '5',                      // Cantidad de segmentos en la playlist
  '-hls_flags', 'delete_segments',            // Eliminar segmentos viejos
  path.join(hlsFolder, 'output.m3u8')           // Archivo de playlist de salida
];

// Inicia el proceso de FFmpeg
const ffmpeg = spawn('ffmpeg', ffmpegArgs);



// Captura y muestra los logs de FFmpeg para depuración
ffmpeg.stderr.on('data', (data) => {
  console.log(`FFmpeg: ${data}`);
});

ffmpeg.on('exit', (code, signal) => {
  console.log(`FFmpeg terminó con código ${code} y señal ${signal}`);
});

// Sirve la carpeta HLS de forma estática
app.use('/hls', express.static(hlsFolder));

// Endpoint simple para confirmar que el servidor funciona
app.get('/', (req, res) => {
  res.send('Servidor HLS funcionando');
});

// Inicia el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
