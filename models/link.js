const mongoose = require('mongoose');

const linkSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  status: {
    type: String,
    enum: ['AKTIF', 'TERPAKAI', 'KEDALUWARSA'],
    default: 'AKTIF'
  },
  jumlah_akses: {
    type: Number,
    default: 0
  },
  jenis_konten: {
    type: String,
    enum: ['text', 'url', 'password'],
    required: true
  },
  isi_konten: {
    type: String,
    required: true
  },
  judul: {
    type: String,
    default: 'Secret Message'
  },
  email_pengirim: {
    type: String,
    required: true
  },
  email_penerima: {
    type: String,
    default: null
  },
  waktu_dibuat: {
    type: Date,
    default: Date.now
  },
  waktu_diakses: {
    type: Date,
    default: null
  },
  waktu_kedaluwarsa: {
    type: Date,
    default: function() {
      const hours = parseInt(process.env.LINK_EXPIRY_HOURS) || 24;
      return new Date(Date.now() + hours * 60 * 60 * 1000);
    }
  },
  metadata_akses: {
    ip_address: String,
    user_agent: String,
    timestamp: Date
  },
  burn_after_reading: {
    type: Boolean,
    default: true
  }
});

// Index untuk performa query
linkSchema.index({ waktu_kedaluwarsa: 1 });
linkSchema.index({ status: 1 });

// Method untuk atomic access
linkSchema.statics.atomicAccess = async function(token, metadata) {
  const now = new Date();
  
  // Atomic operation: find and update in one query
  const link = await this.findOneAndUpdate(
    {
      token: token,
      status: 'AKTIF',
      jumlah_akses: 0,
      waktu_kedaluwarsa: { $gt: now }
    },
    {
      $set: {
        status: 'TERPAKAI',
        jumlah_akses: 1,
        waktu_diakses: now,
        metadata_akses: metadata
      }
    },
    {
      new: false // Return original document before update
    }
  );

  return link;
};

// Method untuk check status
linkSchema.statics.checkStatus = async function(token) {
  const link = await this.findOne({ token });
  
  if (!link) {
    return { valid: false, reason: 'TOKEN_NOT_FOUND' };
  }
  
  if (link.status !== 'AKTIF') {
    return { valid: false, reason: 'ALREADY_ACCESSED' };
  }
  
  if (link.jumlah_akses > 0) {
    return { valid: false, reason: 'ALREADY_ACCESSED' };
  }
  
  if (link.waktu_kedaluwarsa < new Date()) {
    await link.updateOne({ status: 'KEDALUWARSA' });
    return { valid: false, reason: 'EXPIRED' };
  }
  
  return { valid: true, link };
};

module.exports = mongoose.model('Link', linkSchema);