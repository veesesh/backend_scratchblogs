import express from "express";
import multer from "multer";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();
const app = express();
const port = 8080;

app.use(cors());

const upload = multer({ dest: "uploads/" });

const fileManager = new GoogleAIFileManager(process.env.API_KEY);
const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

app.post("/upload", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded." });
        }

        const filePath = req.file.path;
        const mimeType = req.file.mimetype;

        console.log("File uploaded:", filePath);

        const uploadResult = await fileManager.uploadFile(filePath, {
            mimeType,
            displayName: req.file.originalname,
        });

        console.log(
            `File uploaded to Gemini: ${uploadResult.file.displayName} as ${uploadResult.file.uri}`,
        );

        const result = await model.generateContent([
            req.body.prompt,
            {
                fileData: {
                    fileUri: uploadResult.file.uri,
                    mimeType,
                },
            },
        ]);

        console.log("Gemini API Response:", result.response.text());

        res.json({
            blog: result.response.text(),
            prompt: req.body.prompt,
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({
            error: "Failed to generate blog content.",
            details: error.message,
        });
    }
});

app.listen(port, () => {
    console.log(`✅ Server is running on http://localhost:${port}`);
});
