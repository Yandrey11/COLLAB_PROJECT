// controllers/reportController.js
import Record from "../models/Record.js";
import { createNotification } from "./admin/notificationController.js";

// ✅ Get all reports (optionally filter by client or date)
export const getReports = async (req, res) => {
  try {
    const { clientName, startDate, endDate } = req.query;
    const query = {};

    if (clientName) query.clientName = new RegExp(clientName, "i");
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const reports = await Record.find(query).sort({ date: -1 });
    res.status(200).json(reports);
  } catch (err) {
    console.error("❌ Error fetching reports:", err);
    res.status(500).json({ message: "Failed to fetch reports" });
  }
};

// ✅ Generate a comprehensive report for a client
export const generateReport = async (req, res) => {
  console.log("📥 Incoming report request body:", req.body);

  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ message: "Request body missing or not JSON" });
  }

  const { clientName, startDate, endDate } = req.body;

  if (!clientName) {
    return res.status(400).json({ message: "Client name is required" });
  }

  try {
    const query = { clientName: new RegExp(clientName, "i") };

    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const sessions = await Record.find(query);

    if (!sessions.length) {
      return res.status(404).json({ message: "No sessions found for this client" });
    }

    const summary = {
      clientName,
      totalSessions: sessions.length,
      completed: sessions.filter(s => s.status === "Completed").length,
      ongoing: sessions.filter(s => s.status === "Ongoing").length,
      referred: sessions.filter(s => s.status === "Referred").length,
      notesSummary: sessions.map(s => s.notes).filter(Boolean),
      outcomes: sessions.map(s => s.outcomes).filter(Boolean),
    };

    // ✅ Create notification for admin about report generation
    try {
      const userRole = req.user?.role || "user";
      const userName = req.user?.name || req.user?.email || "Unknown User";
      
      await createNotification({
        title: "Report Generated",
        description: `${userName} (${userRole}) has generated a report for client: ${clientName}. Total sessions: ${sessions.length}`,
        category: "User Activity",
        priority: "medium",
        metadata: {
          clientName,
          totalSessions: sessions.length,
          generatedBy: userName,
          generatedByRole: userRole,
          startDate: startDate || null,
          endDate: endDate || null,
        },
        relatedId: clientName,
        relatedType: "report",
      });
    } catch (notificationError) {
      console.error("⚠️ Notification creation failed (non-critical):", notificationError);
      // Continue with report generation even if notification creation fails
    }

    res.status(200).json({
      message: "✅ Report generated successfully",
      report: summary,
      sessions,
    });
  } catch (err) {
    console.error("❌ Error generating report:", err);
    res.status(500).json({ message: "Error generating report" });
  }
};

// ✅ Get single client report
export const getClientReport = async (req, res) => {
  try {
    const { clientName } = req.params;
    const records = await Record.find({ clientName: new RegExp(clientName, "i") });

    if (!records.length) {
      return res.status(404).json({ message: "No report found for this client" });
    }

    res.status(200).json(records);
  } catch (err) {
    console.error("❌ Error fetching client report:", err);
    res.status(500).json({ message: "Failed to get client report" });
  }
};
