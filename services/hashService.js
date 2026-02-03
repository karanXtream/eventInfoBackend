const crypto = require('crypto');

/**
 * Generate a hash for an event to detect changes
 * @param {Object} event - Event object
 * @returns {String} - SHA256 hash
 */
function generateHash(event) {
  // Select only the fields that matter for change detection
  const relevantData = {
    title: event.title,
    description: event.description,
    dateTime: event.dateTime,
    venue: event.venue,
    address: event.address,
    imageUrl: event.imageUrl
  };

  // Convert to JSON string and create hash
  const dataString = JSON.stringify(relevantData);
  return crypto.createHash('sha256').update(dataString).digest('hex');
}

module.exports = generateHash;