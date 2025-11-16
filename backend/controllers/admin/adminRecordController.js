import Record from "../../models/Record.js";
import PDFDocument from "pdfkit";
import { oauth2Client } from "../googleDriveAuthController.js";
import fs from "fs";
import path from "path";
import { google } from "googleapis";
import { createNotification } from "./notificationController.js";

// Helper function to generate tracking number
const generateTrackingNumber = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `DOC-${timestamp}-${random}`;
};

// Helper function to add header and footer
const addHeaderFooter = (doc, pageNum, totalPages, trackingNumber, reportDate) => {
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;

  // Header - Blue background
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

// Helper to get user info from request
const getUserInfo = (req) => {
  return {
    userId: req.admin?._id || req.user?._id,
    userName: req.admin?.name || req.user?.name || req.admin?.email || req.user?.email || "System",
    userRole: req.admin?.role || req.user?.role || "admin",
  };
};

// 📋 Get all records with search, filter, and pagination
export const getAllRecords = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 25,
      search = "",
      sessionType = "",
      status = "",
      counselor = "",
      startDate = "",
      endDate = "",
      sortBy = "date",
      order = "desc",
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const filter = {};

    // Search filter (client name or counselor)
    if (search) {
      filter.$or = [
        { clientName: { $regex: search, $options: "i" } },
        { counselor: { $regex: search, $options: "i" } },
      ];
    }

    // Status filter
    if (status && status !== "all") {
      filter.status = status;
    }

    // Session type filter
    if (sessionType && sessionType !== "all") {
      filter.sessionType = sessionType;
    }

    // Counselor filter
    if (counselor && counselor !== "all") {
      filter.counselor = counselor;
    }

    // Date range filter
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Sort options
    const sortOption = {};
    sortOption[sortBy] = order === "desc" ? -1 : 1;

    // Get records with pagination
    const records = await Record.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count
    const total = await Record.countDocuments(filter);

    // Get unique counselors for filter dropdown
    const counselors = await Record.distinct("counselor");

    res.status(200).json({
      records,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalRecords: total,
        limit: parseInt(limit),
      },
      filters: {
        counselors,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching records:", error);
    res.status(500).json({ message: "Failed to fetch records", error: error.message });
  }
};

// 👁️ Get single record by ID
export const getRecordById = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await Record.findById(id);

    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    res.status(200).json(record);
  } catch (error) {
    console.error("❌ Error fetching record:", error);
    res.status(500).json({ message: "Failed to fetch record", error: error.message });
  }
};

// ✏️ Update record
export const updateRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const userInfo = getUserInfo(req);

    const record = await Record.findById(id);
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
    record.auditTrail.lastModifiedBy = userInfo;
    record.auditTrail.lastModifiedAt = new Date();
    if (changes.length > 0) {
      record.auditTrail.modificationHistory.push(...changes);
    }

    await record.save();

    // Create notification
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

    res.status(200).json({
      message: "Record updated successfully",
      record,
    });
  } catch (error) {
    console.error("❌ Error updating record:", error);
    res.status(500).json({ message: "Failed to update record", error: error.message });
  }
};

// 🗑️ Delete record
export const deleteRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const userInfo = getUserInfo(req);

    const record = await Record.findById(id);
    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    // Update audit trail before deletion
    record.auditTrail.deletedBy = userInfo;
    record.auditTrail.deletedAt = new Date();
    await record.save();

    // Delete record
    await Record.findByIdAndDelete(id);

    // Create notification
    try {
      await createNotification({
        title: "Record Deleted",
        description: `${userInfo.userName} (${userInfo.userRole}) deleted record for client: ${record.clientName} - Session ${record.sessionNumber}`,
        category: "User Activity",
        priority: "high",
        metadata: {
          clientName: record.clientName,
          recordId: id,
          deletedBy: userInfo.userName,
          deletedByRole: userInfo.userRole,
        },
        relatedType: "record",
      });
    } catch (notificationError) {
      console.error("⚠️ Notification creation failed (non-critical):", notificationError);
    }

    res.status(200).json({
      message: "Record deleted successfully",
      recordId: id,
    });
  } catch (error) {
    console.error("❌ Error deleting record:", error);
    res.status(500).json({ message: "Failed to delete record", error: error.message });
  }
};

// 📄 Generate PDF for a record
export const generatePDF = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await Record.findById(id);

    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    // Generate tracking number and dates
    const trackingNumber = generateTrackingNumber();
    const reportDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const reportDateTime = new Date().toLocaleString();

    // Sanitize names for filename
    const sanitizedCounselorName = (record.counselor || "Unknown_Counselor").replace(/[^a-zA-Z0-9]/g, '_');
    const sanitizedClientName = record.clientName.replace(/\s+/g, '_');

    // Create temp directory
    const tempDir = path.join(process.cwd(), "temp");
    fs.mkdirSync(tempDir, { recursive: true });
    const pdfPath = path.join(tempDir, `${sanitizedCounselorName}_${sanitizedClientName}_record_${trackingNumber}.pdf`);

    // Create PDF
    const doc = new PDFDocument({ margin: 0 });
    const writeStream = fs.createWriteStream(pdfPath);
    doc.pipe(writeStream);

    // Page 1: Summary Statistics
    addHeaderFooter(doc, 1, 2, trackingNumber, reportDate);
    let finalY = 50;
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    doc.fillColor('black')
       .fontSize(20)
       .font('Helvetica-Bold')
       .text("COUNSELING RECORDS REPORT", pageWidth / 2, finalY, { align: 'center' });
    finalY += 15;

    doc.fontSize(12)
       .font('Helvetica')
       .text(`Report Generated: ${reportDateTime}`, pageWidth / 2, finalY, { align: 'center' });
    finalY += 10;
    doc.text(`Document Tracking Number: ${trackingNumber}`, pageWidth / 2, finalY, { align: 'center' });
    finalY += 20;

    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text("Summary Statistics", pageWidth / 2, finalY, { align: 'center' });
    finalY += 15;

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

    // Page 2: Detailed Records
    doc.addPage();
    addHeaderFooter(doc, 2, 2, trackingNumber, reportDate);
    finalY = 50;

    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text("DETAILED RECORDS", pageWidth / 2, finalY, { align: 'center' });
    finalY += 15;

    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text("Record Details", 14, finalY);
    finalY += 10;

    doc.fontSize(11)
       .font('Helvetica');

    const details = [
      { label: "Client Name", value: record.clientName || "N/A" },
      { label: "Date", value: record.date ? new Date(record.date).toLocaleDateString() : "N/A" },
      { label: "Session Type", value: record.sessionType || "N/A" },
      { label: "Session Number", value: record.sessionNumber || "N/A" },
      { label: "Status", value: record.status || "N/A" },
      { label: "Counselor", value: record.counselor || "N/A" },
    ];

    details.forEach((detail) => {
      doc.font('Helvetica-Bold')
         .text(`${detail.label}:`, 14, finalY);
      doc.font('Helvetica')
         .text(detail.value, 14 + 80, finalY);
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
         align: 'left',
       });
    finalY += (record.notes ? record.notes.split('\n').length * 5 : 5) + 7;

    // Outcomes
    doc.font('Helvetica-Bold')
       .text("Outcome:", 14, finalY);
    finalY += 7;
    doc.font('Helvetica')
       .text(record.outcomes || "No outcome recorded", 14, finalY, {
         width: pageWidth - 28,
         align: 'left',
       });

    doc.end();

    // Wait for PDF generation
    await new Promise((resolve, reject) => {
      writeStream.on("finish", resolve);
      writeStream.on("error", reject);
    });

    // Send PDF as response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${sanitizedCounselorName}_${sanitizedClientName}_record_${trackingNumber}.pdf"`);
    
    const fileStream = fs.createReadStream(pdfPath);
    fileStream.pipe(res);

    // Clean up after sending
    fileStream.on('end', () => {
      fs.unlinkSync(pdfPath);
    });
  } catch (error) {
    console.error("❌ Error generating PDF:", error);
    res.status(500).json({ message: "Failed to generate PDF", error: error.message });
  }
};

// ☁️ Upload record to Google Drive
export const uploadToDrive = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await Record.findById(id);

    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    if (!oauth2Client.credentials?.access_token) {
      return res.status(401).json({ message: "Google Drive not connected" });
    }

    // Generate tracking number and dates
    const trackingNumber = generateTrackingNumber();
    const reportDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const reportDateTime = new Date().toLocaleString();

    // Sanitize names for filename
    const sanitizedCounselorName = (record.counselor || "Unknown_Counselor").replace(/[^a-zA-Z0-9]/g, '_');
    const sanitizedClientName = record.clientName.replace(/\s+/g, '_');

    // Create temp directory
    const tempDir = path.join(process.cwd(), "temp");
    fs.mkdirSync(tempDir, { recursive: true });
    const pdfPath = path.join(tempDir, `${sanitizedCounselorName}_${sanitizedClientName}_record_${trackingNumber}.pdf`);

    // Create PDF (same as generatePDF)
    const doc = new PDFDocument({ margin: 0 });
    const writeStream = fs.createWriteStream(pdfPath);
    doc.pipe(writeStream);

    addHeaderFooter(doc, 1, 2, trackingNumber, reportDate);
    let finalY = 50;
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    doc.fillColor('black')
       .fontSize(20)
       .font('Helvetica-Bold')
       .text("COUNSELING RECORDS REPORT", pageWidth / 2, finalY, { align: 'center' });
    finalY += 15;

    doc.fontSize(12)
       .font('Helvetica')
       .text(`Report Generated: ${reportDateTime}`, pageWidth / 2, finalY, { align: 'center' });
    finalY += 10;
    doc.text(`Document Tracking Number: ${trackingNumber}`, pageWidth / 2, finalY, { align: 'center' });
    finalY += 20;

    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text("Summary Statistics", pageWidth / 2, finalY, { align: 'center' });
    finalY += 15;

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

    doc.addPage();
    addHeaderFooter(doc, 2, 2, trackingNumber, reportDate);
    finalY = 50;

    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text("DETAILED RECORDS", pageWidth / 2, finalY, { align: 'center' });
    finalY += 15;

    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text("Record Details", 14, finalY);
    finalY += 10;

    doc.fontSize(11)
       .font('Helvetica');

    const details = [
      { label: "Client Name", value: record.clientName || "N/A" },
      { label: "Date", value: record.date ? new Date(record.date).toLocaleDateString() : "N/A" },
      { label: "Session Type", value: record.sessionType || "N/A" },
      { label: "Session Number", value: record.sessionNumber || "N/A" },
      { label: "Status", value: record.status || "N/A" },
      { label: "Counselor", value: record.counselor || "N/A" },
    ];

    details.forEach((detail) => {
      doc.font('Helvetica-Bold')
         .text(`${detail.label}:`, 14, finalY);
      doc.font('Helvetica')
         .text(detail.value, 14 + 80, finalY);
      finalY += 7;
    });

    finalY += 5;

    doc.font('Helvetica-Bold')
       .text("Notes:", 14, finalY);
    finalY += 7;
    doc.font('Helvetica')
       .text(record.notes || "No notes available", 14, finalY, {
         width: pageWidth - 28,
         align: 'left',
       });
    finalY += (record.notes ? record.notes.split('\n').length * 5 : 5) + 7;

    doc.font('Helvetica-Bold')
       .text("Outcome:", 14, finalY);
    finalY += 7;
    doc.font('Helvetica')
       .text(record.outcomes || "No outcome recorded", 14, finalY, {
         width: pageWidth - 28,
         align: 'left',
       });

    doc.end();

    await new Promise((resolve, reject) => {
      writeStream.on("finish", resolve);
      writeStream.on("error", reject);
    });

    // Upload to Google Drive
    const drive = google.drive({ version: "v3", auth: oauth2Client });
    const fileName = `${sanitizedCounselorName}_${sanitizedClientName}_record_${trackingNumber}.pdf`;
    const fileMetadata = {
      name: fileName,
      parents: process.env.GOOGLE_DRIVE_FOLDER_ID ? [process.env.GOOGLE_DRIVE_FOLDER_ID] : undefined,
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

    // Update record
    record.driveLink = driveLink;
    await record.save();

    // Clean up
    fs.unlinkSync(pdfPath);

    const userInfo = getUserInfo(req);
    try {
      await createNotification({
        title: "PDF Uploaded to Google Drive",
        description: `${userInfo.userName} uploaded PDF for client: ${record.clientName} - Session ${record.sessionNumber}`,
        category: "User Activity",
        priority: "low",
        metadata: {
          clientName: record.clientName,
          recordId: record._id.toString(),
          pdfFileName: fileName,
          driveLink: driveLink,
        },
        relatedId: record._id,
        relatedType: "record",
      });
    } catch (notificationError) {
      console.error("⚠️ Notification creation failed (non-critical):", notificationError);
    }

    res.status(200).json({
      message: "PDF uploaded to Google Drive successfully",
      driveLink,
      fileName,
    });
  } catch (error) {
    console.error("❌ Error uploading to Drive:", error);
    res.status(500).json({ message: "Failed to upload to Google Drive", error: error.message });
  }
};

