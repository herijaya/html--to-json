import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';

axios.get('https://trxku.com/harga.js.php?type=js&id=a8a5c92ac136d0425572565f86af3eb9c35400d2a0124a1a646a4aa2eea0acc3e641272fc1acc2e366de498e1d340a59-204')
    .then(response => {
        let html = response.data;

        // Hapus seluruh potongan 'document.write' dari HTML dan ambil teks yang ada di dalamnya
        html = html.replace(/document\.write\(['"]?([^'"]+)['"]?\);/g, '$1');
        html = html.replace(/\\n/g, ''); // Hapus newline escape sequences
        html = html.replace(/\\t/g, ''); // Hapus tab escape sequences
        html = html.replace(/^\);/g, ''); // Hapus karakter ');' di awal
        html = html.replace(/['"]\);/g, ''); // Hapus karakter '");' atau ');' di akhir

        const $ = cheerio.load(html);

        // Ambil data dari HTML yang telah dibersihkan
        let data = [];
        let currentCategory = ''; // Untuk melacak kategori saat ini

        $('tr').each((i, element) => {
            let row = {};

            // Periksa apakah baris tersebut adalah kategori (hanya satu kolom yang menempati seluruh baris)
            if ($(element).find('td').length === 1) {
                currentCategory = $(element).find('td').text().trim();
            } else {
                // Jika bukan kategori, ini adalah baris data yang sebenarnya
                $(element).find('td').each((j, td) => {
                    if (j === 0) row['Kode'] = $(td).text().trim();
                    if (j === 1) row['Keterangan'] = $(td).text().trim();
                    if (j === 2) row['Harga'] = $(td).text().trim();
                    if (j === 3) {
                        let statusText = $(td).text().trim();
                        // Bersihkan newline, tab, dan karakter 'document.write' serta ');'
                        statusText = statusText.replace(/document\.write\(['"]/g, '').replace(/['"]\);/g, '').trim();
                        row['Status'] = statusText;
                    }
                });
                if (Object.keys(row).length > 0) {
                    row['Kategori'] = currentCategory; // Tambahkan kategori ke setiap baris data
                    data.push(row);
                }
            }
        });

        // Simpan sebagai file JSON
        fs.writeFileSync('public/harga.json', JSON.stringify(data, null, 2));
        console.log('Data berhasil disimpan ke harga.json');
    })
    .catch(error => {
        console.error('Terjadi kesalahan saat memuat data:', error);
    });
