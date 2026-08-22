const db = require("../config/db");
const { logActivity } = require("../utils/activityLogger");

const deleteResident = (req, res) => {
  const { id } = req.params;
  const performed_by = req.user.id;
  
  if (!id) return res.status(400).json({ message: 'Missing id' });

  // Fetch resident details first to log the name
  db.query("SELECT f_name, l_name FROM residents WHERE resident_id = ?", [id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (results.length === 0) return res.status(404).json({ message: 'Resident not found' });
    
    const residentName = `${results[0].f_name || ""} ${results[0].l_name || ""}`.trim();

    const sql = `DELETE FROM residents WHERE resident_id = ?`;
    db.query(sql, [id], (err, result) => {
      if (err) {
        console.error('Delete resident error:', err);
        return res.status(500).json({ message: 'Failed to delete resident', error: err.message });
      }
      
      logActivity({
        entity_type: "Resident",
        entity_id: id,
        entity_name: residentName,
        action_type: "deleted",
        performed_by
      });
      
      res.json({ message: 'Resident deleted' });
    });
  });
};

module.exports = { deleteResident };
