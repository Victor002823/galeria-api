const express = require("express");
const cors = require("cors");

const {
    S3Client,
    ListObjectsV2Command,
    PutObjectCommand,
    DeleteObjectCommand
} = require("@aws-sdk/client-s3");

const app = express();

const BUCKET = "galeriax";

// 🔥 MIDDLEWARE
app.use(cors());
app.use(express.json({ limit: "25mb" }));

// 🔥 CONEXIÓN R2
const s3 = new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY,
        secretAccessKey: process.env.R2_SECRET_KEY
    }
});

// 🧪 TEST
app.get("/", (req, res) => {
    res.json({ ok: true, message: "API funcionando 🚀" });
});


// 📸 LISTAR IMÁGENES
app.get("/list", async (req, res) => {
    try {

        const data = await s3.send(
            new ListObjectsV2Command({
                Bucket: BUCKET
            })
        );

        const baseUrl = "https://pub-23557c39f90d46d584f7e9b28f7dff3b.r2.dev";

        const urls = (data.Contents || [])
            .map(file => file.Key)
            .filter(key => key && key.endsWith(".jpg"))
            .map(key => `${baseUrl}/${key}`);

        res.json(urls);

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Error listando R2" });
    }
});


// 📤 UPLOAD IMAGEN
app.post("/upload", async (req, res) => {
    try {

        const { name, base64 } = req.body;

        if (!base64) {
            return res.status(400).json({ error: "sin imagen" });
        }

        const buffer = Buffer.from(base64, "base64");

        await s3.send(new PutObjectCommand({
            Bucket: BUCKET,
            Key: "galeria/" + name,
            Body: buffer,
            ContentType: "image/jpeg"
        }));

        res.json({ ok: true });

    } catch (e) {
        console.log(e);
        res.status(500).json({ error: e.message });
    }
});


// 🗑 DELETE FIJO (CORREGIDO)
app.get("/delete", async (req, res) => {
    try {

        let file = req.query.file;

        if (!file) {
            return res.status(400).json({ error: "sin file" });
        }

        // 🔥 limpiar si viene URL
        if (file.includes("http")) {
            file = file.substring(file.lastIndexOf("/") + 1);
        }

        file = file.trim();

        // 💣 IMPORTANTE: reconstruir KEY EXACTO
        const key = "galeria/" + file;

        console.log("🧨 KEY FINAL:", key);

        const result = await s3.send(new DeleteObjectCommand({
            Bucket: BUCKET,
            Key: key
        }));

        console.log("✔ R2 RESPONSE:", result);

        res.json({ ok: true, deleted: key });

    } catch (e) {
        console.log("❌ ERROR DELETE:", e);
        res.status(500).json({ error: e.message });
    }
});


// 🚀 SERVER
app.listen(3000, "0.0.0.0", () => {
    console.log("Servidor listo en puerto 3000 🚀");
});
