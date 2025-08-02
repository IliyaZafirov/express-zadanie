const { Client } = require("pg");
const bcrypt = require("bcryptjs");
const util = require("util");

const client = new Client({
  connectionLimit: 10,
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE,
  port: parseInt(process.env.DATABASE_PORT, 10),
  ssl: {
    rejectUnauthorized: false,
  },
});

const queryUtil = util.promisify(client.query).bind(client);

let instance = null;

class dbService {
  static getDbServiceInstance() {
    return instance ? instance : new dbService();
  }

  async getControls(userId) {
    try {
      const response = await queryUtil(
        `
  SELECT 
      r.name AS region_name,
      s.name AS section_name,
      c.id AS control_id,
      c.name AS control_name
  FROM user_controls uc
  JOIN controls c ON uc.control_id = c.id
  JOIN sections s ON c.section_id = s.id
  JOIN regions r ON s.region_id = r.id
  WHERE uc.user_id = $1
  ORDER BY r.name, s.name, c.name;`,
        [userId]
      );

      return response.rows;
    } catch (err) {
      console.log(err);
    }
  }

  async postControlClickEvent(userId, control_id, details) {
    try {
      const response = await queryUtil(
        `
        INSERT INTO events (user_id, type, control_id, details)
      VALUES ($1, 'control_press', $2, $3)
      RETURNING id;
        `,
        [userId, control_id, details]
      );

      return response.rows[0].id;
    } catch (err) {
      console.log(err);
    }
  }

  async getAllUsers() {
    try {
      const response = await queryUtil(`
        SELECT 
          id,
          username,
          email,
          role,
          active,
          created_at
        FROM users
        ORDER BY id ASC;
      `);
      return response.rows;
    } catch (err) {
      console.log(err);
    }
  }

  async getAllControls() {
    try {
      const response = await queryUtil(`
        SELECT
          c.id AS control_id,
          c.name AS control_name,
          s.id AS section_id,
          s.name AS section_name,
          r.id AS region_id,
          r.name AS region_name
        FROM controls c
        JOIN sections s ON c.section_id = s.id
        JOIN regions r ON s.region_id = r.id
        ORDER BY r.name, s.name, c.name;
      `);
      return response.rows;
    } catch (err) {
      console.log(err);
    }
  }

  async getControlById(id) {
    try {
      const result = await queryUtil(`
        SELECT c.id AS control_id, c.name AS control_name, 
               s.id AS section_id, s.name AS section_name,
               r.id AS region_id, r.name AS region_name
        FROM controls c
        JOIN sections s ON c.section_id = s.id
        JOIN regions r ON s.region_id = r.id
        WHERE c.id = $1
      `, [id]);
      return result.rows[0] || null;
    } catch (err) {
      console.log(err);
      return null;
    }
  }
  
  async getUsersWithControlAccess(controlId) {
    try {
      const result = await queryUtil(`
        SELECT u.id, u.username, u.email, u.role
        FROM user_controls uc
        JOIN users u ON uc.user_id = u.id
        WHERE uc.control_id = $1
      `, [controlId]);
      return result.rows;
    } catch (err) {
      console.log(err);
      return [];
    }
  }

  async createRegion(name) {
    try {
      await queryUtil(`INSERT INTO regions (name) VALUES ($1)`, [name.trim()]);
      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  }

  async getAllRegions() {
    try {
      const result = await queryUtil(`SELECT id, name FROM regions`);
      return result.rows;
    } catch (err) {
      console.log(err);
      return [];
    }
  }

  async createSection(name, parent_id) {
    try {
      await queryUtil(
        `INSERT INTO sections (name, region_id) VALUES ($1, $2)`,
        [name.trim(), parent_id]
      );
      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  }

  async getAllSections() {
    try {
      const result = await queryUtil(`SELECT id, name FROM sections`);
      return result.rows;
    } catch (err) {
      return [];
    }
  }

  async createControl(name, parent_id) {
    try {
      await queryUtil(
        `INSERT INTO controls (name, section_id) VALUES ($1, $2)`,
        [name.trim(), parent_id]
      );
      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  }

  async updateUser(id, { role, password, active, controls }) {
    try {
      if (role) {
        await queryUtil(`UPDATE users SET role = $1 WHERE id = $2`, [role, id]);
      }

      if (typeof active === "boolean") {
        await queryUtil(`UPDATE users SET active = $1 WHERE id = $2`, [
          active,
          id,
        ]);
      }

      if (password) {
        const hashed = await bcrypt.hash(password, 8);
        await queryUtil(`UPDATE users SET password = $1 WHERE id = $2`, [
          hashed,
          id,
        ]);
      }

      if (Array.isArray(controls)) {
        await queryUtil(`DELETE FROM user_controls WHERE user_id = $1`, [id]);

        for (let ctrl of controls) {
          await queryUtil(
            `INSERT INTO user_controls (user_id, control_id) VALUES ($1, $2)`,
            [id, ctrl]
          );
        }
      }

      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  }

  async getUserById(userId) {
    try {
      const result = await queryUtil(
        `SELECT id, username, email, role, active FROM users WHERE id = $1`,
        [userId]
      );
      return result.rows[0] || null;
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  async getUserWithControls(userId) {
    try {
      const userRes = await queryUtil(
        `SELECT id, username, email, role, active FROM users WHERE id = $1`,
        [userId]
      );
      if (userRes.rows.length === 0) return null;
      const user = userRes.rows[0];

      const controlsRes = await queryUtil(
        `SELECT control_id FROM user_controls WHERE user_id = $1`,
        [userId]
      );

      user.controls = controlsRes.rows.map((row) => row.control_id);
      return user;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async getAllEvents() {
    try {
      const result = await queryUtil(`
        SELECT
          e.id,
          u.username,
          e.type,
          e.details,
          e.created_at
        FROM events e
        LEFT JOIN users u ON e.user_id = u.id
        ORDER BY e.created_at DESC
        LIMIT 200;
      `);
      return result.rows;
    } catch (err) {
      console.log(err);
      return [];
    }
  }
}

module.exports = { client, dbService };
