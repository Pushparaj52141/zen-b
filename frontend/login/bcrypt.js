const bcrypt = require('bcrypt');
const password = 'admin';
bcrypt.hash(password, 10, (err, hash) => {
    if (err) throw err;
    console.log('Hashed Password:', hash);
});
