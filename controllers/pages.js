const express = require("express");
const router = express.Router();
const { dbService } = require("../config/db-config");
const checkUserCookie = require("../middleware/auth");
const checkAdminRole = require("../middleware/admin");

router.get("/my-controls", checkUserCookie, async (req, res) => {
  try {
    const userId = req.user.id;

    const dbS = dbService.getDbServiceInstance();
    const data = await dbS.getControls(userId);
    console.log(data);
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, case: "server-error" });
  }
});

router.post("/control-click", checkUserCookie, async (req, res) => {
  try {
    const userId = req.user.id;
    const { control_id } = req.body;

    if (!control_id) {
      return res
        .status(400)
        .json({ success: false, message: "Missing control_id" });
    }

    const details = JSON.stringify({ pressed_at: new Date().toISOString() });

    const dbS = dbService.getDbServiceInstance();
    const result = await dbS.postControlClickEvent(userId, control_id, details);
    console.log(result);

    return res.json({ success: true, event_id: result });
  } catch (err) {
    return res.status(500).json({ success: false, message: "server error" });
  }
});

router.get(
  "/admin/users",
  checkUserCookie,
  checkAdminRole,
  async (req, res) => {
    try {
      const dbS = dbService.getDbServiceInstance();
      const users = await dbS.getAllUsers();
      res.json({ success: true, data: users });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

router.get(
  "/admin/controls",
  checkUserCookie,
  checkAdminRole,
  async (req, res) => {
    try {
      const dbS = dbService.getDbServiceInstance();
      const controls = await dbS.getAllControls();
      res.json({ success: true, data: controls });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);



router.post(
  "/admin/create",
  checkUserCookie,
  checkAdminRole,
  async (req, res) => {
    const { type, name, parent_id } = req.body;
    const dbS = dbService.getDbServiceInstance();

    try {
      if (type === "region") {
        await dbS.createRegion(name);
      } else if (type === "section") {
        await dbS.createSection(name, parent_id); // parent_id = region_id
      } else if (type === "control") {
        await dbS.createControl(name, parent_id); // parent_id = section_id
      } else {
        return res
          .status(400)
          .json({ success: false, message: "Invalid type" });
      }

      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

router.put(
  "/admin/users/:id",
  checkUserCookie,
  checkAdminRole,
  async (req, res) => {
    const { id } = req.params;
    const { role, password, active, controls } = req.body;

    try {
      const dbS = dbService.getDbServiceInstance();

      const targetUser = await dbS.getUserById(id);

      if (req.user.role === "admin" && targetUser.role === "power_admin") {
        return res.status(403).json({
          success: false,
          message: "Admins cannot modify power_admin accounts",
        });
      }

      if (req.user.role === "admin" && role === "admin") {
        return res.status(403).json({
          success: false,
          message: "Only power_admin can assign admin role",
        });
      }

      if (
        req.user.role === "admin" &&
        ["admin", "power_admin"].includes(targetUser.role) &&
        typeof active === "boolean"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Admins cannot change active status of admin or power_admin accounts",
        });
      }

      await dbS.updateUser(id, { role, password, active, controls });
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

router.get(
  "/admin/users/:id",
  checkUserCookie,
  checkAdminRole,
  async (req, res) => {
    const { id } = req.params;
    try {
      const dbS = dbService.getDbServiceInstance();
      const user = await dbS.getUserWithControls(id);
      res.json({ success: true, user });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

router.get(
  "/admin/events",
  checkUserCookie,
  checkAdminRole,
  async (req, res) => {
    try {
      const dbS = dbService.getDbServiceInstance();
      const events = await dbS.getAllEvents();
      res.json({ success: true, data: events });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

router.get(
  "/admin/regions",
  checkUserCookie,
  checkAdminRole,
  async (req, res) => {
    try {
      const dbS = dbService.getDbServiceInstance();
      const regions = await dbS.getAllRegions();
      res.json({ success: true, data: regions });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

router.get(
  "/admin/sections",
  checkUserCookie,
  checkAdminRole,
  async (req, res) => {
    try {
      const dbS = dbService.getDbServiceInstance();
      const sections = await dbS.getAllSections();
      res.json({ success: true, data: sections });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// for cookie check (to prevent xss attacks)
router.get("/auth/check", checkUserCookie, (req, res) => {
  res.json({ loggedIn: true, user: req.user });
});

module.exports = router;
