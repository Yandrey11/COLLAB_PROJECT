import Record from "../models/Record.js";
import PDFDocument from "pdfkit";
import { oauth2Client } from "./googleDriveAuthController.js";
import fs from "fs";
import path from "path";
import { google } from "googleapis";
import { createNotification } from "./admin/notificationController.js";

// Helper to get user info from request
const getUserInfo = (req) => {
  return {
    userId: req.user?._id || req.admin?._id,
    userName: req.user?.name || req.user?.email || req.admin?.name || req.admin?.email || "Unknown User",
    userRole: req.user?.role || req.admin?.role || "counselor",
  };
};

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
    const userInfo = getUserInfo(req);
    const record = await Record.findById(req.params.id);
    
    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    // Track changes for audit trail
    const changes = [];
    const updateData = { ...req.body };

    // Compare old and new values
    Object.keys(updateData).forEach((key) => {
      if (key !== "auditTrail" && key !== "attachments" && record[key] !== updateData[key]) {
        changes.push({
          field: key,
          oldValue: record[key],
          newValue: updateData[key],
          changedBy: userInfo,
          changedAt: new Date(),
        });
      }
    });

    // Update record
    Object.assign(record, updateData);

    // Update audit trail
    if (!record.auditTrail) {
      record.auditTrail = {
        createdBy: userInfo,
        createdAt: record.createdAt || new Date(),
        lastModifiedBy: userInfo,
        lastModifiedAt: new Date(),
        modificationHistory: [],
      };
    } else {
      record.auditTrail.lastModifiedBy = userInfo;
      record.auditTrail.lastModifiedAt = new Date();
    }
    
    if (changes.length > 0) {
      if (!record.auditTrail.modificationHistory) {
        record.auditTrail.modificationHistory = [];
      }
      record.auditTrail.modificationHistory.push(...changes);
    }

    await record.save();

    // ✅ Create notification for admins
    try {
      await createNotification({
        title: "Record Updated",
        description: `${userInfo.userName} (${userInfo.userRole}) updated record for client: ${record.clientName} - Session ${record.sessionNumber}`,
        category: "User Activity",
        priority: "medium",
        metadata: {
          clientName: record.clientName,
          recordId: record._id.toString(),
          updatedBy: userInfo.userName,
          updatedByRole: userInfo.userRole,
          changes: changes.map((c) => c.field),
        },
        relatedId: record._id,
        relatedType: "record",
      });
    } catch (notificationError) {
      console.error("⚠️ Notification creation failed (non-critical):", notificationError);
    }

    res.json(record);
  } catch (err) {
    res.status(500).json({ message: "Failed to update record", error: err.message });
  }
};

// Helper function to generate tracking number
const generateTrackingNumber = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `DOC-${timestamp}-${random}`;
};

// Helper function to add header and footer (matching report format)
const addHeaderFooter = (doc, pageNum, totalPages, trackingNumber, reportDate) => {
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;

  // Header - Blue background (#667eea = rgb(102, 126, 234))
  doc.rect(0, 0, pageWidth, 30)
     .fillColor('rgb(102, 126, 234)')
     .fill();
  
  doc.fillColor('white')
     .fontSize(16)
     .font('Helvetica-Bold')
     .text("COUNSELING RECORDS REPORT", pageWidth / 2, 12, { align: 'center' });
  
  doc.fontSize(9)
     .font('Helvetica')
     .text(`Document Tracking: ${trackingNumber}`, 14, 22);
  
  doc.text(`Date: ${reportDate}`, pageWidth - 14, 22, { align: 'right' });

  // Footer - Blue background
  doc.rect(0, pageHeight - 35, pageWidth, 35)
     .fillColor('rgb(102, 126, 234)')
     .fill();
  
  doc.fillColor('white')
     .fontSize(8)
     .font('Helvetica')
     .text("CONFIDENTIAL - This document contains sensitive information and is protected under client confidentiality agreements.", 
       pageWidth / 2, pageHeight - 28, { align: 'center', width: pageWidth - 28 });
  
  doc.fontSize(7)
     .text("Counseling Services Management System", 14, pageHeight - 18)
     .text(`Page ${pageNum} of ${totalPages}`, pageWidth / 2, pageHeight - 18, { align: 'center' })
     .text(`Tracking: ${trackingNumber}`, pageWidth - 14, pageHeight - 18, { align: 'right' });
  
  doc.fontSize(6)
     .text("For inquiries, contact your system administrator. This report is generated electronically.", 
       pageWidth / 2, pageHeight - 10, { align: 'center', width: pageWidth - 28 });

  // Reset text color for content
  doc.fillColor('black');
};

// Helper function to upload record to drive
const uploadRecordToDrive = async (record, req) => {
  try {
    if (!oauth2Client.credentials?.access_token) {
      console.warn("⚠️ Google Drive not connected — skipping auto-upload");
      return null;
    }

    // Get counselor name for filename
    const counselorName = record.counselor || req.user?.name || req.user?.email || "Unknown_Counselor";
    const sanitizedCounselorName = counselorName.replace(/[^a-zA-Z0-9]/g, '_');

    // Generate tracking number and dates
    const trackingNumber = generateTrackingNumber();
    const reportDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const reportDateTime = new Date().toLocaleString();

    // ✅ Generate PDF file locally with report format
    const tempDir = path.join(process.cwd(), "temp");
    fs.mkdirSync(tempDir, { recursive: true });
    const pdfPath = path.join(tempDir, `${sanitizedCounselorName}_${record.clientName.replace(/\s+/g, '_')}_${trackingNumber}.pdf`);

    const doc = new PDFDocument({ margin: 0 });
    const writeStream = fs.createWriteStream(pdfPath);
    doc.pipe(writeStream);

    // Page 1: Summary Statistics Page
    addHeaderFooter(doc, 1, 2, trackingNumber, reportDate);
    
    let finalY = 50; // Start below header
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    // Title
    doc.fillColor('black')
       .fontSize(20)
       .font('Helvetica-Bold')
       .text("COUNSELING RECORDS REPORT", pageWidth / 2, finalY, { align: 'center' });
    finalY += 15;

    // Report Information
    doc.fontSize(12)
       .font('Helvetica')
       .text(`Report Generated: ${reportDateTime}`, pageWidth / 2, finalY, { align: 'center' });
    finalY += 10;
    doc.text(`Document Tracking Number: ${trackingNumber}`, pageWidth / 2, finalY, { align: 'center' });
    finalY += 10;
    doc.text(`Total Records: 1`, pageWidth / 2, finalY, { align: 'center' });
    finalY += 20;

    // Summary Statistics Section
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text("Summary Statistics", pageWidth / 2, finalY, { align: 'center' });
    finalY += 15;

    // Calculate statistics
    const completed = record.status === "Completed" ? 1 : 0;
    const ongoing = record.status === "Ongoing" ? 1 : 0;
    const referred = record.status === "Referred" ? 1 : 0;

    doc.fontSize(11)
       .font('Helvetica')
       .text(`Completed Sessions: ${completed}`, 14, finalY);
    finalY += 8;
    doc.text(`Ongoing Sessions: ${ongoing}`, 14, finalY);
    finalY += 8;
    doc.text(`Referred Sessions: ${referred}`, 14, finalY);

    // Add second page with detailed records
    doc.addPage();
    addHeaderFooter(doc, 2, 2, trackingNumber, reportDate);
    finalY = 50;

    // Detailed Records Title
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text("DETAILED RECORDS", pageWidth / 2, finalY, { align: 'center' });
    finalY += 15;

    // Record 1 heading
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text("Record 1", 14, finalY);
    finalY += 10;

    // Record details
    doc.fontSize(11)
       .font('Helvetica');
    
    const details = [
      { label: "Client Name", value: record.clientName || "N/A" },
      { label: "Date", value: record.date ? new Date(record.date).toLocaleDateString() : "N/A" },
      { label: "Status", value: record.status || "N/A" },
      { label: "Counselor", value: record.counselor || "N/A" },
    ];

    details.forEach(detail => {
      doc.font('Helvetica-Bold')
         .text(`${detail.label}:`, 14, finalY);
      doc.font('Helvetica')
         .text(detail.value, 14 + 60, finalY);
      finalY += 7;
    });

    finalY += 5;

    // Notes
    doc.font('Helvetica-Bold')
       .text("Notes:", 14, finalY);
    finalY += 7;
    doc.font('Helvetica')
       .text(record.notes || "No notes available", 14, finalY, { 
         width: pageWidth - 28,
         align: 'left'
       });
    finalY += (record.notes ? record.notes.split('\n').length * 5 : 5) + 7;

    // Outcome (singular, not plural)
    doc.font('Helvetica-Bold')
       .text("Outcome:", 14, finalY);
    finalY += 7;
    doc.font('Helvetica')
       .text(record.outcomes || "No outcome recorded", 14, finalY, { 
         width: pageWidth - 28,
         align: 'left'
       });

    doc.end();

    // Wait for PDF generation
    await new Promise((resolve, reject) => {
      writeStream.on("finish", resolve);
      writeStream.on("error", reject);
    });

    // ✅ Upload PDF to Google Drive with counselor name in filename
    const drive = google.drive({ version: "v3", auth: oauth2Client });
    const fileName = `${sanitizedCounselorName}_${record.clientName.replace(/\s+/g, '_')}_record_${trackingNumber}.pdf`;
    const fileMetadata = {
      name: fileName,
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

    // ✅ Create notification for admin about PDF generation
    try {
      const userRole = req.user?.role || "counselor";
      const userName = req.user?.name || req.user?.email || record.counselor || "Unknown User";
      
      await createNotification({
        title: "PDF Generated and Uploaded",
        description: `${userName} (${userRole}) has generated and uploaded a PDF for client: ${record.clientName} - Session ${record.sessionNumber}. File: ${fileName}`,
        category: "User Activity",
        priority: "low",
        metadata: {
          clientName: record.clientName,
          recordId: record._id.toString(),
          pdfFileName: fileName,
          driveLink: driveLink,
          generatedBy: userName,
          generatedByRole: userRole,
        },
        relatedId: record._id.toString(),
        relatedType: "record",
      });
    } catch (notificationError) {
      console.error("⚠️ Notification creation failed (non-critical):", notificationError);
    }

    // ✅ Clean up local PDF
    fs.unlinkSync(pdfPath);

    return driveLink;
  } catch (err) {
    console.error("❌ Drive upload error:", err);
    return null;
  }
};

// ➕ 3️⃣ Create a new counseling record
export const createRecord = async (req, res) => {
  try {
    const userInfo = getUserInfo(req);
    
    // Get counselor name - prioritize from authenticated user, then from request body, then fallback
    let counselorName = userInfo.userName;
    
    // If userName is "Unknown User", try to get from request body
    if (counselorName === "Unknown User" && req.body.counselor) {
      counselorName = req.body.counselor;
    }
    
    // If still unknown, try to get from req.user or req.admin directly
    if (counselorName === "Unknown User") {
      if (req.user?.name) {
        counselorName = req.user.name;
      } else if (req.user?.email) {
        counselorName = req.user.email;
      } else if (req.admin?.name) {
        counselorName = req.admin.name;
      } else if (req.admin?.email) {
        counselorName = req.admin.email;
      }
    }
    
    // Calculate session number for this client
    const existingRecordsCount = await Record.countDocuments({ 
      clientName: req.body.clientName 
    });
    const sessionNumber = existingRecordsCount + 1;
    
    const record = new Record({
      clientName: req.body.clientName,
      date: req.body.date,
      sessionType: req.body.sessionType,
      sessionNumber: sessionNumber,
      status: req.body.status,
      notes: req.body.notes,
      outcomes: req.body.outcomes,
      driveLink: req.body.driveLink,
      counselor: counselorName, // ✅ Set automatically from authenticated user
      auditTrail: {
        createdBy: userInfo,
        createdAt: new Date(),
        lastModifiedBy: userInfo,
        lastModifiedAt: new Date(),
        modificationHistory: [],
      },
    });

    await record.save();
    
    // ✅ Create notification for admins
    try {
      await createNotification({
        title: "New Record Created",
        description: `${userInfo.userName} (${userInfo.userRole}) created a new record for client: ${record.clientName} - Session ${record.sessionNumber}`,
        category: "User Activity",
        priority: "medium",
        metadata: {
          clientName: record.clientName,
          recordId: record._id.toString(),
          createdBy: userInfo.userName,
          createdByRole: userInfo.userRole,
          sessionNumber: record.sessionNumber,
        },
        relatedId: record._id,
        relatedType: "record",
      });
    } catch (notificationError) {
      console.error("⚠️ Notification creation failed (non-critical):", notificationError);
    }
    
    // ✅ Automatically upload to drive after saving
    const driveLink = await uploadRecordToDrive(record, req);
    if (driveLink) {
      console.log("✅ Record automatically uploaded to Google Drive");
    }

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

    // Get counselor name for filename
    const counselorName = record.counselor || req.user?.name || req.user?.email || "Unknown_Counselor";
    const sanitizedCounselorName = counselorName.replace(/[^a-zA-Z0-9]/g, '_');

    // Generate tracking number and dates
    const trackingNumber = generateTrackingNumber();
    const reportDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const reportDateTime = new Date().toLocaleString();

    // ✅ Generate PDF file locally with report format
    const tempDir = path.join(process.cwd(), "temp");
    fs.mkdirSync(tempDir, { recursive: true });
    const pdfPath = path.join(tempDir, `${sanitizedCounselorName}_${record.clientName.replace(/\s+/g, '_')}_${trackingNumber}.pdf`);

    const doc = new PDFDocument({ margin: 0 });
    const writeStream = fs.createWriteStream(pdfPath);
    doc.pipe(writeStream);

    // Page 1: Summary Statistics Page
    addHeaderFooter(doc, 1, 2, trackingNumber, reportDate, counselorName);
    
    let finalY = 60;
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    // Title
    doc.fillColor('black')
       .fontSize(20)
       .font('Helvetica-Bold')
       .text("COUNSELING RECORDS REPORT", pageWidth / 2, finalY, { align: 'center' });
    finalY += 15;

    // Report Information
    doc.fontSize(12)
       .font('Helvetica')
       .text(`Report Generated: ${reportDateTime}`, pageWidth / 2, finalY, { align: 'center' });
    finalY += 10;
    doc.text(`Document Tracking Number: ${trackingNumber}`, pageWidth / 2, finalY, { align: 'center' });
    finalY += 10;
    doc.text(`Total Records: 1`, pageWidth / 2, finalY, { align: 'center' });
    finalY += 20;

    // Summary Statistics Section
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text("Summary Statistics", pageWidth / 2, finalY, { align: 'center' });
    finalY += 15;

    // Calculate statistics
    const completed = record.status === "Completed" ? 1 : 0;
    const ongoing = record.status === "Ongoing" ? 1 : 0;
    const referred = record.status === "Referred" ? 1 : 0;

    doc.fontSize(11)
       .font('Helvetica')
       .text(`Completed Sessions: ${completed}`, 14, finalY);
    finalY += 8;
    doc.text(`Ongoing Sessions: ${ongoing}`, 14, finalY);
    finalY += 8;
    doc.text(`Referred Sessions: ${referred}`, 14, finalY);

    // Add second page with detailed records
    doc.addPage();
    addHeaderFooter(doc, 2, 2, trackingNumber, reportDate);
    finalY = 50;

    // Detailed Records Title
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text("DETAILED RECORDS", pageWidth / 2, finalY, { align: 'center' });
    finalY += 15;

    // Record 1 heading
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text("Record 1", 14, finalY);
    finalY += 10;

    // Record details
    doc.fontSize(11)
       .font('Helvetica');
    
    const details = [
      { label: "Client Name", value: record.clientName || "N/A" },
      { label: "Date", value: record.date ? new Date(record.date).toLocaleDateString() : "N/A" },
      { label: "Status", value: record.status || "N/A" },
      { label: "Counselor", value: record.counselor || "N/A" },
    ];

    details.forEach(detail => {
      doc.font('Helvetica-Bold')
         .text(`${detail.label}:`, 14, finalY);
      doc.font('Helvetica')
         .text(detail.value, 14 + 60, finalY);
      finalY += 7;
    });

    finalY += 5;

    // Notes
    doc.font('Helvetica-Bold')
       .text("Notes:", 14, finalY);
    finalY += 7;
    doc.font('Helvetica')
       .text(record.notes || "No notes available", 14, finalY, { 
         width: pageWidth - 28,
         align: 'left'
       });
    finalY += (record.notes ? record.notes.split('\n').length * 5 : 5) + 7;

    // Outcome (singular, not plural)
    doc.font('Helvetica-Bold')
       .text("Outcome:", 14, finalY);
    finalY += 7;
    doc.font('Helvetica')
       .text(record.outcomes || "No outcome recorded", 14, finalY, { 
         width: pageWidth - 28,
         align: 'left'
       });

    doc.end();

    // Wait for PDF generation
    await new Promise((resolve, reject) => {
      writeStream.on("finish", resolve);
      writeStream.on("error", reject);
    });

    // ✅ Upload PDF to Google Drive with counselor name in filename
    const drive = google.drive({ version: "v3", auth: oauth2Client });
    const fileName = `${sanitizedCounselorName}_${record.clientName.replace(/\s+/g, '_')}_record_${trackingNumber}.pdf`;
    const fileMetadata = {
      name: fileName,
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

    // ✅ Create notification for admin about PDF generation
    try {
      const userRole = req.user?.role || "counselor";
      const userName = req.user?.name || req.user?.email || record.counselor || "Unknown User";
      
      await createNotification({
        title: "PDF Generated and Uploaded",
        description: `${userName} (${userRole}) has generated and uploaded a PDF for client: ${record.clientName}. File: ${fileName}`,
        category: "User Activity",
        priority: "low",
        metadata: {
          clientName: record.clientName,
          recordId: record._id.toString(),
          pdfFileName: fileName,
          driveLink: driveLink,
          generatedBy: userName,
          generatedByRole: userRole,
        },
        relatedId: record._id.toString(),
        relatedType: "record",
      });
    } catch (notificationError) {
      console.error("⚠️ Notification creation failed (non-critical):", notificationError);
    }

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