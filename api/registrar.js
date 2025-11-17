import { google } from 'googleapis';

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
        GOOGLE_SHEETS_ID,
        GOOGLE_SHEETS_RANGE
    } = process.env;

    if (!GOOGLE_SERVICE_ACCOUNT_EMAIL ||
        !GOOGLE_SERVICE_ACCOUNT_KEY ||
        !GOOGLE_SHEETS_ID ||
        !GOOGLE_SHEETS_RANGE) {
        return res.status(500).json({ message: "Faltan variables de entorno" });
    }

    try {
        const auth = new google.auth.JWT(
            GOOGLE_SERVICE_ACCOUNT_EMAIL,
            null,
            normalizePrivateKey(GOOGLE_SERVICE_ACCOUNT_KEY),
            ['https://www.googleapis.com/auth/spreadsheets']
        );

        const sheets = google.sheets({ version: 'v4', auth });

        // Leer cédulas existentes
        const existentes = await sheets.spreadsheets.values.get({
            spreadsheetId: GOOGLE_SHEETS_ID,
            range: "hoja!A2:A"
        });

        const cedulas = existentes.data.values ? existentes.data.values.flat() : [];

        if (cedulas.includes(cedula.toString().trim())) {
            return res.status(409).json({ message: "duplicado" });
        }

        const fila = [
            cedula.trim(),
            nombre.trim(),
            telefono.trim(),
            ciudad.trim(),
            grooming.trim()
        ];

        await sheets.spreadsheets.values.append({
            spreadsheetId: GOOGLE_SHEETS_ID,
            range: GOOGLE_SHEETS_RANGE,   // 👈 ahora usa la variable
            valueInputOption: "USER_ENTERED",
            requestBody: { values: [fila] }
        });

        return res.status(200).json({ message: "OK" });

    } catch (err) {
        console.error("Sheets error:", err);
        return res.status(500).json({ message: "Error interno" });
    }
}