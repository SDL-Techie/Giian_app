import { getGridFSFileMetadata, streamGridFSFile } from "../utils/gridfs.js";

export const getFile = async (req, res, next) => {
  try {
    const file = await getGridFSFileMetadata(req.params.id);
    if (!file) return res.status(404).json({ success: false, message: "File not found" });

    const moduleName = file.metadata?.module;
    const permissionMap = { customer: "customers", purchase: "purchase" };
    const permissionModule = permissionMap[moduleName];

    if (!req.user.isAdmin && permissionModule) {
      const role = req.user.role;
      if (!role || role.status !== "Active" || !role.permissions?.[permissionModule]?.view) {
        return res.status(403).json({ success: false, message: "You do not have permission to view this file" });
      }
    }

    const ok = await streamGridFSFile(req.params.id, res);
    if (!ok && !res.headersSent) res.status(404).json({ success: false, message: "File not found" });
  } catch (e) { next(e); }
};
