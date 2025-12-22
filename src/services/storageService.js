const supabase = require('../config/supabase');

exports.uploadFiles = async (token, files) => {
  const uploaded = [];

  for (const file of files) {
    const path = `links/${token}/${Date.now()}-${file.originalname}`;

    const { error } = await supabase.storage
      .from('sakalise-files')
      .upload(path, file.buffer, { contentType: file.mimetype });

    if (error) throw error;

    uploaded.push({
      path,
      name: file.originalname,
      mime: file.mimetype
    });
  }

  return uploaded;
};

exports.createSignedUrls = async files => {
  const result = [];

  for (const file of files || []) {
    const { data } = await supabase.storage
      .from('sakalise-files')
      .createSignedUrl(file.path, 60);

    result.push({ ...file, signedUrl: data.signedUrl });
  }

  return result;
};
