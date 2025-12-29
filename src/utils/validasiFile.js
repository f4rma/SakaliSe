// mengizikan hanya tipe file tertentu
const daftarMimeDiizinkan = ['image/', 'video/', 'audio/'];

// Mengecek apakah tipe file diperbolehkan
function cekFileDiizinkan(tipeMime) {
  return daftarMimeDiizinkan.some(tipe =>
    tipeMime.startsWith(tipe)
  );
}

module.exports = { cekFileDiizinkan };
