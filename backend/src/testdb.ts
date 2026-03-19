import db from './config/database';
import bcrypt from 'bcryptjs';

const hash = bcrypt.hashSync('password123', 12);
db.prepare("UPDATE users SET role = 'admin', admin_level = 'national', password_hash = ? WHERE phone = '0780000000'").run(hash);
const user = db.prepare("SELECT * FROM users WHERE phone = '0780000000'").get();
console.log(JSON.stringify(user, null, 2));
