const express = require("express");
const cors = require("cors");

const {
    S3Client,
    ListObjectsV2Command,
    PutObjectCommand,
    DeleteObjectCommand
} = require("@aws-sdk/client-s3");

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const app = express();

const BUCKET = "galeriax";

// 🔥 MIDDLEWARE
app.use(cors());
app.use(express.json({ limit: "25mb" }));

// 🔥 R2 CONFIG
const s3 = new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY,
        secretAccessKey: process.env.R2_SECRET_KEY
    }
});

// 🧠 helper
function generateKey() {
    return "galeria/img_" + Date.now() + ".jpg";
}

// 🧪 TEST
app.get("/", (req, res) => {
    res.json({ ok: true, message: "API funcionando 🚀" });
});


// 📸 LISTAR
app.get("/list", async (req, res) => {
    try {

        const data = await s3.send(
            new ListObjectsV2Command({ Bucket: BUCKET })
        );

        const baseUrl = "https://pub-23557c39f90d46d584f7e9b28f7dff3b.r2.dev";

        const urls = (data.Contents || [])
            .map(f => f.Key)
            .filter(k => k && /\.(jpg|jpeg|png|webp)$/i.test(k))
            .map(k => `${baseUrl}/${k}`);

        res.json(urls);

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Error listando R2" });
    }
});


// 🔐 SIGNED URL (UPLOAD DIRECTO)
app.get("/sign", async (req, res) => {
    try {

        const key = generateKey();

        const command = new PutObjectCommand({
            Bucket: BUCKET,
            Key: key,
            ContentType: "image/jpeg"
        });

        const url = await getSignedUrl(s3, command, { expiresIn: 60 });

        res.json({ url, key });

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "error generando firma" });
    }
});


// 📤 UPLOAD FALLBACK (BASE64)
app.post("/upload", async (req, res) => {
    try {

        const { base64 } = req.body;

        if (!base64) {
            return res.status(400).json({ error: "sin imagen" });
        }

        const buffer = Buffer.from(base64, "base64");

        const key = generateKey();

        await s3.send(new PutObjectCommand({
            Bucket: BUCKET,
            Key: key,
            Body: buffer,
            ContentType: "image/jpeg"
        }));

        res.json({ ok: true, key });

    } catch (e) {
        console.log(e);
        res.status(500).json({ error: e.message });
    }
});


// 🗑 DELETE
app.get("/delete", async (req, res) => {
    try {

        let file = req.query.file;

        if (!file) {
            return res.status(400).json({ error: "sin file" });
        }

        file = file.split("/").pop().trim();

        const key = file.startsWith("galeria/")
            ? file
            : "galeria/" + file;

        await s3.send(new DeleteObjectCommand({
            Bucket: BUCKET,
            Key: key
        }));

        res.json({ ok: true, deleted: key });

    } catch (e) {
        console.log(e);
        res.status(500).json({ error: e.message });
    }
});


// 🚀 SERVER
app.listen(3000, "0.0.0.0", () => {
    console.log("Servidor listo en puerto 3000 🚀");
});
