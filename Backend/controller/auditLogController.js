import AuditLog from "../model/auditLogModel.js";

export const getAuditLogs = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const filter = {};
    if (req.query.method) filter.method = String(req.query.method).toUpperCase();
    if (req.query.actor) filter.actor = req.query.actor;
    if (req.query.from || req.query.to) {
      filter.createdAt = {};
      if (req.query.from) filter.createdAt.$gte = new Date(req.query.from);
      if (req.query.to) filter.createdAt.$lte = new Date(req.query.to);
    }

    const [data, total] = await Promise.all([
      AuditLog.find(filter)
        .populate("actor", "name email")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      AuditLog.countDocuments(filter),
    ]);

    res.json({ success: true, message: "Audit logs fetched", data, pagination: { page, limit, total } });
  } catch (error) {
    next(error);
  }
};
