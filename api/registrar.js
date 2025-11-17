import { google } from 'googleapis';

// Convierte "\\n" a saltos reales
function normalizePrivateKey(key) {
    return key?.replace(/\\n/g, '\n');
}

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Método no permitido" });
    }

    const { cedula, nombre, telefono, ciudad, grooming } = req.body || {};

    if (!cedula || !nombre || !telefono || !ciudad || !grooming) {
        return res.status(400).json({ message: "Faltan datos" });
    }

    const {
        GOOGLE_SERVICE_ACCOUNT_EMAIL,
        GOOGLE_SERVICE_ACCOUNT_KEY,
        GOOGLE_SHEETS_ID
    } = process.env;

    if (!GOOGLE_SERVICE_ACCOUNT_EMAIL ||
        !GOOGLE_SERVICE_ACCOUNT_KEY ||
        !GOOGLE_SHEETS_ID) {
        return res.status(500).json({ message: "Faltan variables de entorno" });
    }

    try {
        // Autenticación con Service Account
        const auth = new google.auth.JWT(
            GOOGLE_SERVICE_ACCOUNT_EMAIL,
            null,
            normalizePrivateKey(GOOGLE_SERVICE_ACCOUNT_KEY),
            ['https://www.googleapis.com/auth/spreadsheets']
        );

        const sheets = google.sheets({ version: 'v4', auth });

        // Leer cédulas ya registradas
        const existentes = await sheets.spreadsheets.values.get({
            spreadsheetId: GOOGLE_SHEETS_ID,
            range: "hoja!A2:A" // SOLO cédulas
        });

        const cedulas = existentes.data.values ? existentes.data.values.flat() : [];

        // Cédula duplicada
        if (cedulas.includes(cedula.toString().trim())) {
            return res.status(409).json({ message: "duplicado" });
        }

        // Guardar
        const fila = [
            cedula.toString().trim(),
            nombre.toString().trim(),
            telefono.toString().trim(),
            ciudad.toString().trim(),
            grooming.toString().trim()
        ];

        await sheets.spreadsheets.values.append({
            spreadsheetId: GOOGLE_SHEETS_ID,
            range: "hoja!A:E",
            valueInputOption: "USER_ENTERED",
            requestBody: { values: [fila] }
        });

        return res.status(200).json({ message: "OK" });

    } catch (err) {
        console.error("Sheets error:", err);
        return res.status(500).json({ message: "Error interno" });
    }
}