process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");

const s3 = new S3Client({
  region: "auto",
  endpoint: "https://TU-ENDPOINT.r2.cloudflarestorage.com",
  credentials: {
    accessKeyId: "TU_KEY",
    secretAccessKey: "TU_SECRET"
  }
});

const BUCKET = "galeriax";

// 👇 nombre del archivo
const file = "galeria/img_1777098285881.jpg";

async function del() {
  try {

    const res = await s3.send(
      new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: file
      })
    );

    console.log("✔ Eliminado:", file);
    console.log(res);

  } catch (e) {
    console.log("ERROR:", e);
  }
}

del();
