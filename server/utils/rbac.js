const Campsite = require('../models/Campsite');

/**
 * Validates if a user has a specific permission in a given campsite
 * @param {String} username - The user's username
 * @param {String} campsiteId - The ID of the campsite
 * @param {String} permissionName - The permission flag to check (e.g., 'canDeleteMessages', 'canManageAI')
 * @returns {Boolean} - True if permitted, false otherwise
 */
async function checkScoutPermission(username, campsiteId, permissionName) {
  try {
    if (!username || !campsiteId) return false;

    const camp = await Campsite.findById(campsiteId);
    if (!camp) return false;

    // The creator/admin always has all permissions
    if (camp.adminEmail) {
      // Unfortunately we don't have user email here, but assuming creator role handling if needed later
      // For now, let's rely on the role mapping
    }

    const roleName = camp.memberRoles?.get(username);
    if (!roleName) return false; // No role assigned

    const role = camp.roles.find(r => r.name === roleName);
    if (!role) return false; // Role doesn't exist

    return !!role[permissionName]; // Check if permission is true
  } catch (error) {
    console.error("RBAC Check Error:", error);
    return false;
  }
}

module.exports = {
  checkScoutPermission
};
