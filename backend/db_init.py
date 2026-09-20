import os
import sqlite3
import json
import uuid
from datetime import datetime

DB_PATH = os.environ.get('SEATRELAY_DB_PATH', 'backend/seatrelay.db')

def get_db():
    parent = os.path.dirname(os.path.abspath(DB_PATH))
    os.makedirs(parent, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()
    
    # Enable WAL mode for high performance concurrent reading
    c.execute("PRAGMA journal_mode=WAL")
    
    c.executescript("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT NOT NULL,
        role TEXT NOT NULL,
        passwordHash TEXT,
        salt TEXT,
        createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS operators (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT UNIQUE NOT NULL,
        contactEmail TEXT NOT NULL,
        supportsResale INTEGER NOT NULL DEFAULT 1,
        supportsPassengerReissue INTEGER NOT NULL DEFAULT 1,
        minimumResaleWindowMinutes INTEGER NOT NULL DEFAULT 60,
        maximumResalePrice TEXT NOT NULL DEFAULT 'FACE_VALUE',
        createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS buses (
        id TEXT PRIMARY KEY,
        operatorId TEXT NOT NULL,
        busNumber TEXT NOT NULL,
        busType TEXT NOT NULL DEFAULT 'AC Sleeper (2+1)',
        routeFrom TEXT NOT NULL,
        routeTo TEXT NOT NULL,
        departureTime TEXT NOT NULL,
        arrivalTime TEXT NOT NULL,
        travelDate TEXT NOT NULL,
        baseFare REAL NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (operatorId) REFERENCES operators(id)
    );

    CREATE TABLE IF NOT EXISTS seats (
        id TEXT PRIMARY KEY,
        busId TEXT NOT NULL,
        seatNumber TEXT NOT NULL,
        seatType TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'AVAILABLE',
        FOREIGN KEY (busId) REFERENCES buses(id)
    );

    CREATE TABLE IF NOT EXISTS tickets (
        id TEXT PRIMARY KEY,
        ticketNumber TEXT UNIQUE NOT NULL,
        userId TEXT NOT NULL,
        busId TEXT NOT NULL,
        seatId TEXT NOT NULL,
        passengerName TEXT NOT NULL,
        passengerAge INTEGER NOT NULL,
        passengerGender TEXT NOT NULL,
        passengerPhone TEXT,
        govIdType TEXT,
        govIdNumber TEXT,
        fare REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'CONFIRMED',
        qrCode TEXT,
        reissuedFromId TEXT,
        digilockerVerified INTEGER NOT NULL DEFAULT 0,
        digilockerTxnId TEXT,
        issuedAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users(id),
        FOREIGN KEY (busId) REFERENCES buses(id),
        FOREIGN KEY (seatId) REFERENCES seats(id)
    );

    CREATE TABLE IF NOT EXISTS resale_listings (
        id TEXT PRIMARY KEY,
        listingNumber TEXT UNIQUE NOT NULL,
        ticketId TEXT NOT NULL,
        sellerId TEXT NOT NULL,
        originalPrice REAL NOT NULL,
        resalePrice REAL NOT NULL,
        platformFee REAL NOT NULL DEFAULT 0.0,
        status TEXT NOT NULL DEFAULT 'LISTED',
        createdAt TEXT NOT NULL,
        expiresAt TEXT,
        FOREIGN KEY (ticketId) REFERENCES tickets(id),
        FOREIGN KEY (sellerId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS resale_transactions (
        id TEXT PRIMARY KEY,
        transactionNumber TEXT UNIQUE NOT NULL,
        listingId TEXT NOT NULL,
        buyerId TEXT NOT NULL,
        newTicketId TEXT,
        buyerPassengerName TEXT NOT NULL,
        buyerPassengerAge INTEGER NOT NULL,
        buyerPassengerGender TEXT NOT NULL,
        buyerPhone TEXT NOT NULL,
        buyerGovIdType TEXT NOT NULL,
        buyerGovIdNumber TEXT NOT NULL,
        digilockerVerified INTEGER NOT NULL DEFAULT 0,
        digilockerTxnId TEXT,
        digilockerName TEXT,
        status TEXT NOT NULL DEFAULT 'PURCHASED',
        sellerRefundAmount REAL NOT NULL,
        platformFee REAL NOT NULL DEFAULT 0.0,
        createdAt TEXT NOT NULL,
        completedAt TEXT,
        FOREIGN KEY (listingId) REFERENCES resale_listings(id),
        FOREIGN KEY (buyerId) REFERENCES users(id),
        FOREIGN KEY (newTicketId) REFERENCES tickets(id)
    );

    CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        transactionId TEXT NOT NULL,
        amount REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'COMPLETED',
        paymentMethod TEXT NOT NULL DEFAULT 'UPI/Card',
        referenceId TEXT UNIQUE NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (transactionId) REFERENCES resale_transactions(id)
    );

    CREATE TABLE IF NOT EXISTS refunds (
        id TEXT PRIMARY KEY,
        transactionId TEXT NOT NULL,
        sellerId TEXT NOT NULL,
        amount REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'COMPLETED',
        referenceId TEXT UNIQUE NOT NULL,
        createdAt TEXT NOT NULL,
        completedAt TEXT,
        FOREIGN KEY (transactionId) REFERENCES resale_transactions(id),
        FOREIGN KEY (sellerId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL,
        isRead INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users(id)
    );
    """)
    conn.commit()
    conn.close()
    print("✅ Database schema initialized successfully.")

if __name__ == '__main__':
    init_db()
