const supabase = require('../config/supabase');

// unggah file ke supabase
exports.uploadFiles = async (token, files) => {
  const hasilUnggah = [];

  for (const file of files) {
    const path = `links/${token}/${Date.now()}-${file.originalname}`;

    const { error } = await supabase.storage
      .from('sakalise-files')
      .upload(path, file.buffer, {
        contentType: file.mimetype
      });

    if (error) throw error;

    hasilUnggah.push({
      path,
      name: file.originalname,
      mime: file.mimetype
    });
  }

  return hasilUnggah;
};

// Buat signed URL untuk file

exports.createSignedUrls = async files => {
  const hasil = [];

  for (const file of files || []) {
    const { data } = await supabase.storage
      .from('sakalise-files')
      .createSignedUrl(file.path, 60); // 60 detik

    hasil.push({
      ...file,
      signedUrl: data.signedUrl
    });
  }

  return hasil;
};
