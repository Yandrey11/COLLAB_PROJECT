import Record from "../models/Record.js";
import PDFDocument from "pdfkit";
import { oauth2Client } from "./googleDriveAuthController.js";
import fs from "fs";
import path from "path";
import { google } from "googleapis";
import { createNotification } from "./admin/notificationController.js";
import { createCounselorNotification } from "./counselorNotificationController.js";

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
      console.error("⚠️ Admin notification creation failed (non-critical):", notificationError);
    }

    // ✅ Create notification for the counselor who updated the record
    try {
      if (req.user?._id || req.user?.id) {
        await createCounselorNotification({
          counselorId: req.user._id || req.user.id,
          counselorEmail: req.user.email,
          title: "Record Updated Successfully",
          description: `Your record for ${record.clientName} (Session ${record.sessionNumber}) has been updated.`,
          category: "Updated Record",
          priority: "medium",
          metadata: {
            clientName: record.clientName,
            recordId: record._id.toString(),
            sessionNumber: record.sessionNumber,
            updatedFields: changes.map((c) => c.field),
          },
          relatedId: record._id,
          relatedType: "record",
        });
      }
    } catch (notificationError) {
      console.error("⚠️ Counselor notification creation failed (non-critical):", notificationError);
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
  // Set blue fill color and draw rectangle
  doc.fillColor(102, 126, 234);
  doc.rect(0, 0, pageWidth, 30).fill();
  
  // Header text in white (use numeric RGB for reliability)
  doc.fillColor(255, 255, 255);
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .text("COUNSELING RECORDS REPORT", pageWidth / 2, 12, { align: 'center' });
  
  doc.fontSize(9)
     .font('Helvetica')
     .fillColor(255, 255, 255);
  doc.text(`Document Tracking: ${trackingNumber}`, 14, 22);
  doc.fillColor(255, 255, 255);
  doc.text(`Date: ${reportDate}`, pageWidth - 14, 22, { align: 'right' });

  // Footer - Blue background
  // Set blue fill color and draw rectangle
  doc.fillColor(102, 126, 234);
  doc.rect(0, pageHeight - 35, pageWidth, 35).fill();
  
  // Footer text in white
  doc.fillColor(255, 255, 255);
  doc.fontSize(8)
     .font('Helvetica')
     .text("CONFIDENTIAL - This document contains sensitive information and is protected under client confidentiality agreements.", 
       pageWidth / 2, pageHeight - 28, { align: 'center', width: pageWidth - 28 });
  
  doc.fontSize(7)
     .fillColor(255, 255, 255);
  doc.text("Counseling Services Management System", 14, pageHeight - 18);
  doc.fillColor(255, 255, 255);
  doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth / 2, pageHeight - 18, { align: 'center' });
  doc.fillColor(255, 255, 255);
  doc.text(`Tracking: ${trackingNumber}`, pageWidth - 14, pageHeight - 18, { align: 'right' });
  
  doc.fontSize(6)
     .fillColor(255, 255, 255);
  doc.text("For inquiries, contact your system administrator. This report is generated electronically.", 
    pageWidth / 2, pageHeight - 10, { align: 'center', width: pageWidth - 28 });
  
  // CRITICAL: Reset fillColor to black after header/footer (which uses white)
  // This ensures all subsequent content text is visible
  doc.fillColor(0, 0, 0);
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

    // Generate tracking number
    const trackingNumber = generateTrackingNumber();

    // ✅ Generate PDF file locally with simple single-page format
    const tempDir = path.join(process.cwd(), "temp");
    fs.mkdirSync(tempDir, { recursive: true });
    const pdfPath = path.join(tempDir, `${sanitizedCounselorName}_${record.clientName.replace(/\s+/g, '_')}_${trackingNumber}.pdf`);

    const doc = new PDFDocument({ 
      margin: 72, // 1 inch margins on all sides
      size: 'LETTER'
    });
    const writeStream = fs.createWriteStream(pdfPath);
    doc.pipe(writeStream);

    // Get page dimensions
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const leftMargin = 72;
    const rightMargin = 72;
    const contentWidth = pageWidth - leftMargin - rightMargin;
    
    // Start from top with some spacing
    let finalY = 100;

    // Set black color for all text
    doc.fillColor(0, 0, 0);

    // Main Title - "Counseling Record" (centered, large, bold)
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .fillColor(0, 0, 0)
       .text("Counseling Record", pageWidth / 2, finalY, { align: 'center' });
    finalY += 50;

    // Client Details Section (left-aligned)
    doc.fontSize(12)
       .font('Helvetica')
       .fillColor(0, 0, 0);
    
    doc.text(`Client Name: ${record.clientName || "N/A"}`, leftMargin, finalY);
    finalY += 20;
    
    doc.text(`Date: ${record.date ? new Date(record.date).toLocaleDateString() : "N/A"}`, leftMargin, finalY);
    finalY += 20;
    
    doc.text(`Session Type: ${record.sessionType || "N/A"}`, leftMargin, finalY);
    finalY += 20;
    
    doc.text(`Status: ${record.status || "N/A"}`, leftMargin, finalY);
    finalY += 20;
    
    doc.text(`Counselor: ${record.counselor || "Unknown Counselor"}`, leftMargin, finalY);
    finalY += 40;

    // Session Notes Section
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor(0, 0, 0)
       .text("Session Notes:", leftMargin, finalY);
    finalY += 20;
    
    const notesText = record.notes || "No notes available.";
    doc.fontSize(12)
       .font('Helvetica')
       .fillColor(0, 0, 0)
       .text(notesText, leftMargin, finalY, { 
         width: contentWidth,
         align: 'left',
         lineGap: 5
       });
    
    // Calculate height used by notes
    const notesHeight = doc.heightOfString(notesText, {
      width: contentWidth,
      lineGap: 5
    });
    finalY += notesHeight + 30;

    // Outcomes Section
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor(0, 0, 0)
       .text("Outcomes:", leftMargin, finalY);
    finalY += 20;
    
    const outcomeText = record.outcomes || record.outcome || "No outcome recorded.";
    doc.fontSize(12)
       .font('Helvetica')
       .fillColor(0, 0, 0)
       .text(outcomeText, leftMargin, finalY, { 
         width: contentWidth,
         align: 'left',
         lineGap: 5
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
      console.error("⚠️ Admin notification creation failed (non-critical):", notificationError);
    }

    // ✅ Create notification for counselor about successful Drive upload
    try {
      if (req.user?._id || req.user?.id) {
        await createCounselorNotification({
          counselorId: req.user._id || req.user.id,
          counselorEmail: req.user.email,
          title: "Record Uploaded to Google Drive",
          description: `Your record for ${record.clientName} (Session ${record.sessionNumber}) has been successfully uploaded to Google Drive.`,
          category: "New Record",
          priority: "low",
          metadata: {
            clientName: record.clientName,
            recordId: record._id.toString(),
            sessionNumber: record.sessionNumber,
            driveLink: driveLink,
            fileName: fileName,
          },
          relatedId: record._id,
          relatedType: "record",
        });
      }
    } catch (notificationError) {
      console.error("⚠️ Counselor notification creation failed (non-critical):", notificationError);
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
      console.error("⚠️ Admin notification creation failed (non-critical):", notificationError);
    }

    // ✅ Create notification for the counselor who created the record
    try {
      if (req.user?._id || req.user?.id) {
        await createCounselorNotification({
          counselorId: req.user._id || req.user.id,
          counselorEmail: req.user.email,
          title: "Record Created Successfully",
          description: `Your record for ${record.clientName} (Session ${record.sessionNumber}) has been created and uploaded to Google Drive.`,
          category: "New Record",
          priority: "medium",
          metadata: {
            clientName: record.clientName,
            recordId: record._id.toString(),
            sessionNumber: record.sessionNumber,
            driveLink: record.driveLink || null,
          },
          relatedId: record._id,
          relatedType: "record",
        });
      }
    } catch (notificationError) {
      console.error("⚠️ Counselor notification creation failed (non-critical):", notificationError);
    }
    
    // ✅ Automatically upload to drive after saving
    const driveLink = await uploadRecordToDrive(record, req);
    if (driveLink) {
      console.log("✅ Record automatically uploaded to Google Drive");
      
      // ✅ Update counselor notification with drive link (if notification was created)
      try {
        if (req.user?._id || req.user?.id) {
          // Find the most recent notification for this counselor about this record
          const CounselorNotification = (await import("../models/CounselorNotification.js")).default;
          const notification = await CounselorNotification.findOne({
            counselorId: req.user._id || req.user.id,
            relatedId: record._id,
            relatedType: "record",
            category: "New Record",
          }).sort({ createdAt: -1 });

          if (notification) {
            notification.metadata.driveLink = driveLink;
            await notification.save();
          }
        }
      } catch (updateError) {
        console.error("⚠️ Failed to update notification with drive link (non-critical):", updateError);
      }
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

    // Generate tracking number
    const trackingNumber = generateTrackingNumber();

    // ✅ Generate PDF file locally with simple single-page format
    const tempDir = path.join(process.cwd(), "temp");
    fs.mkdirSync(tempDir, { recursive: true });
    const pdfPath = path.join(tempDir, `${sanitizedCounselorName}_${record.clientName.replace(/\s+/g, '_')}_${trackingNumber}.pdf`);

    const doc = new PDFDocument({ 
      margin: 72, // 1 inch margins on all sides
      size: 'LETTER'
    });
    const writeStream = fs.createWriteStream(pdfPath);
    doc.pipe(writeStream);

    // Get page dimensions
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const leftMargin = 72;
    const rightMargin = 72;
    const contentWidth = pageWidth - leftMargin - rightMargin;
    
    // Start from top with some spacing
    let finalY = 100;

    // Set black color for all text
    doc.fillColor(0, 0, 0);

    // Main Title - "Counseling Record" (centered, large, bold)
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .fillColor(0, 0, 0)
       .text("Counseling Record", pageWidth / 2, finalY, { align: 'center' });
    finalY += 50;

    // Client Details Section (left-aligned)
    doc.fontSize(12)
       .font('Helvetica')
       .fillColor(0, 0, 0);
    
    doc.text(`Client Name: ${record.clientName || "N/A"}`, leftMargin, finalY);
    finalY += 20;
    
    doc.text(`Date: ${record.date ? new Date(record.date).toLocaleDateString() : "N/A"}`, leftMargin, finalY);
    finalY += 20;
    
    doc.text(`Session Type: ${record.sessionType || "N/A"}`, leftMargin, finalY);
    finalY += 20;
    
    doc.text(`Status: ${record.status || "N/A"}`, leftMargin, finalY);
    finalY += 20;
    
    doc.text(`Counselor: ${record.counselor || "Unknown Counselor"}`, leftMargin, finalY);
    finalY += 40;

    // Session Notes Section
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor(0, 0, 0)
       .text("Session Notes:", leftMargin, finalY);
    finalY += 20;
    
    const notesText = record.notes || "No notes available.";
    doc.fontSize(12)
       .font('Helvetica')
       .fillColor(0, 0, 0)
       .text(notesText, leftMargin, finalY, { 
         width: contentWidth,
         align: 'left',
         lineGap: 5
       });
    
    // Calculate height used by notes
    const notesHeight = doc.heightOfString(notesText, {
      width: contentWidth,
      lineGap: 5
    });
    finalY += notesHeight + 30;

    // Outcomes Section
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor(0, 0, 0)
       .text("Outcomes:", leftMargin, finalY);
    finalY += 20;
    
    const outcomeText = record.outcomes || record.outcome || "No outcome recorded.";
    doc.fontSize(12)
       .font('Helvetica')
       .fillColor(0, 0, 0)
       .text(outcomeText, leftMargin, finalY, { 
         width: contentWidth,
         align: 'left',
         lineGap: 5
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

// 🗑️ Delete a record (for counselors)
export const deleteRecord = async (req, res) => {
  try {
    const userInfo = getUserInfo(req);
    const record = await Record.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    // Check if the record belongs to the counselor
    const counselorName = userInfo.userName;
    const counselorEmail = req.user?.email;
    
    // Allow deletion if the record's counselor matches the authenticated user
    const isOwner = record.counselor === counselorName || 
                   record.counselor === counselorEmail ||
                   (req.user?.email && record.counselor === req.user.email) ||
                   (req.user?.name && record.counselor === req.user.name);

    if (!isOwner && req.user?.role !== "admin") {
      return res.status(403).json({ 
        message: "You don't have permission to delete this record. Only the record owner can delete it." 
      });
    }

    // Update audit trail before deletion (soft delete approach)
    if (record.auditTrail) {
      record.auditTrail.deletedBy = userInfo;
      record.auditTrail.deletedAt = new Date();
      await record.save();
    }

    // Delete the record
    await Record.findByIdAndDelete(req.params.id);

    // ✅ Create notification for admins
    try {
      await createNotification({
        title: "Record Deleted",
        description: `${userInfo.userName} (${userInfo.userRole}) deleted record for client: ${record.clientName} - Session ${record.sessionNumber}`,
        category: "User Activity",
        priority: "high",
        metadata: {
          clientName: record.clientName,
          recordId: req.params.id,
          deletedBy: userInfo.userName,
          deletedByRole: userInfo.userRole,
          sessionNumber: record.sessionNumber,
        },
        relatedId: req.params.id,
        relatedType: "record",
      });
    } catch (notificationError) {
      console.error("⚠️ Admin notification creation failed (non-critical):", notificationError);
    }

    // ✅ Create notification for the counselor who deleted the record
    try {
      if (req.user?._id || req.user?.id) {
        await createCounselorNotification({
          counselorId: req.user._id || req.user.id,
          counselorEmail: req.user.email,
          title: "Record Deleted",
          description: `You have successfully deleted the record for ${record.clientName} (Session ${record.sessionNumber}).`,
          category: "System Alert",
          priority: "medium",
          metadata: {
            clientName: record.clientName,
            recordId: req.params.id,
            sessionNumber: record.sessionNumber,
            deletedAt: new Date().toISOString(),
          },
          relatedId: req.params.id,
          relatedType: "record",
        });
      }
    } catch (notificationError) {
      console.error("⚠️ Counselor notification creation failed (non-critical):", notificationError);
    }

    res.status(200).json({ 
      message: "Record deleted successfully",
      deletedRecordId: req.params.id,
    });
  } catch (err) {
    console.error("❌ Error deleting record:", err);
    res.status(500).json({ message: "Failed to delete record", error: err.message });
  }
};