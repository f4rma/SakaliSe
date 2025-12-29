// Hapus file dari Supabase Storage
exports.hapusFiles = async files => {
  if (!files || files.length === 0) return;
  const paths = files.map(f => f.path);
  const { error } = await supabase.storage
    .from('sakalise-files')
    .remove(paths);
  if (error) throw error;
};
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
exports.buatSignedUrls = async files => {
  const hasil = [];

  for (const file of files || []) {
    const { data } = await supabase.storage
      .from('sakalise-files')
      .createSignedUrl(file.path);

    hasil.push({
      ...file,
      signedUrl: data.signedUrl
    });
  }

  return hasil;
};
