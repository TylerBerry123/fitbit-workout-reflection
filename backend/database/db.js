const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS reflections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            workout_log_id TEXT UNIQUE,
            mood INTEGER,
            hydration INTEGER,
            effort INTEGER,
            satisfaction INTEGER,
            sleep INTEGER,
            fatigue INTEGER,
            motivation INTEGER,
            pain INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP        
        )
    `, (err) => {
        if (err) console.error('Error creating reflections table: ', err);
    });

        db.run(`
        CREATE TABLE IF NOT EXISTS insights (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            workout_log_id TEXT,
            rule_name TEXT,
            message TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) console.error('Error creating insights table: ', err);
    });
});

module.exports = db;