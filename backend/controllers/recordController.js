import Record from "../models/Record.js";
import PDFDocument from "pdfkit";
import { oauth2Client } from "./googleDriveAuthController.js";
import fs from "fs";
import path from "path";
import { google } from "googleapis";


// 📋 1️⃣ Fetch all records (with query filters)
export const getRecords = async (req, res) => {
  try {
    const { search, sessionType, status, startDate, endDate, sortBy, order } = req.query;
    const filter = {};

    if (search) filter.clientName = { $regex: search, $options: "i" };
    if (sessionType) filter.sessionType = sessionType;
    if (status) filter.status = status;
    if (startDate && endDate) filter.date = { $gte: startDate, $lte: endDate };

    const sortOption = {};
    if (sortBy) sortOption[sortBy] = order === "desc" ? -1 : 1;

    const records = await Record.find(filter).sort(sortOption);
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch records", error: err.message });
  }
};

// ✏️ 2️⃣ Update a record
export const updateRecord = async (req, res) => {
  try {
    const record = await Record.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!record) return res.status(404).json({ message: "Record not found" });
    res.json(record);
  } catch (err) {
    res.status(500).json({ message: "Failed to update record", error: err.message });
  }
};

// ➕ 3️⃣ Create a new counseling record
export const createRecord = async (req, res) => {
  try {
    const counselorName = req.user?.name || req.user?.email || "Unknown Counselor"; // ✅ Auto from auth
    const record = new Record({
      clientName: req.body.clientName,
      date: req.body.date,
      sessionType: req.body.sessionType,
      status: req.body.status,
      notes: req.body.notes,
      outcomes: req.body.outcomes,
      driveLink: req.body.driveLink,
      counselor: counselorName, // ✅ Set automatically
    });

    await record.save();
    res.status(201).json(record);
  } catch (err) {
    console.error("Error creating record:", err);
    res.status(500).json({ message: "Failed to create record", error: err.message });
  }
};


// ☁️ 4️⃣ Upload to Google Drive (PDF)

// ☁️ Upload counseling session PDF to Google Drive


export const uploadToDrive = async (req, res) => {
  try {
    const record = await Record.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ error: "Record not found" });
    }

    if (!oauth2Client.credentials?.access_token) {
      console.error("❌ Google Drive not connected — no tokens saved");
      return res.status(401).json({ error: "Google Drive not connected — no tokens saved" });
    }

    // ✅ Generate PDF file locally
    const tempDir = path.join(process.cwd(), "temp");
    fs.mkdirSync(tempDir, { recursive: true });
    const pdfPath = path.join(tempDir, `${record.clientName}-${Date.now()}.pdf`);

    const doc = new PDFDocument();
    const writeStream = fs.createWriteStream(pdfPath);
    doc.pipe(writeStream);

    // Header
    doc.fontSize(20).text("Counseling Record", { align: "center" });
    doc.moveDown();

    // Client info
    doc.fontSize(12);
    doc.text(`Client Name: ${record.clientName}`);
    doc.text(`Date: ${new Date(record.date).toLocaleDateString()}`);
    doc.text(`Session Type: ${record.sessionType}`);
    doc.text(`Status: ${record.status}`);
    doc.text(`Counselor: ${record.counselor}`);
    doc.moveDown();

    // Notes and Outcomes
    doc.text("Session Notes:");
    doc.text(record.notes || "N/A", { indent: 20 });
    doc.moveDown();

    doc.text("Outcomes:");
    doc.text(record.outcomes || "N/A", { indent: 20 });
    doc.end();

    // Wait for PDF generation
    await new Promise((resolve, reject) => {
      writeStream.on("finish", resolve);
      writeStream.on("error", reject);
    });

    // ✅ Upload PDF to Google Drive
    const drive = google.drive({ version: "v3", auth: oauth2Client });
    const fileMetadata = {
      name: `${record.clientName}-${record.date}.pdf`,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
    };
    const media = {
      mimeType: "application/pdf",
      body: fs.createReadStream(pdfPath),
    };

    const file = await drive.files.create({
      resource: fileMetadata,
      media,
      fields: "id, webViewLink",
    });

    const driveLink = file.data.webViewLink;

    // ✅ Update record in DB
    record.driveLink = driveLink;
    await record.save();

    // ✅ Clean up local PDF
    fs.unlinkSync(pdfPath);

    res.json({
      success: true,
      message: "Uploaded to Google Drive successfully",
      driveLink,
    });
  } catch (err) {
    console.error("❌ Drive upload error:", err);
    res.status(500).json({ error: err.message });
  }
};