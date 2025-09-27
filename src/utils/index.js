// src/utils/index.js
function formatResponse(data, status = 'ok') {
  return {
    ...data,
    status,
    timestamp: new Date().toISOString()
  };
}

function logRequest(req) {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
}

module.exports = {
  formatResponse,
  logRequest
};