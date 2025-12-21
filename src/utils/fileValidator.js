const allowedMimeTypes = ['image/', 'video/', 'audio/'];

function isAllowedFile(mimetype) {
  return allowedMimeTypes.some(type => mimetype.startsWith(type));
}

module.exports = { isAllowedFile };
