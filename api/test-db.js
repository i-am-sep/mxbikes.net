const { Sequelize } = require('sequelize');
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const config = {
    host: 'dbaas-db-4409310-do-user-18540873-0.f.db.ondigitalocean.com', // Using non-private hostname
    port: 25060,
    database: 'defaultdb',
    username: 'doadmin',
    password: process.env.DB_PASSWORD
};

// Read the CA certificate
const caCert = fs.readFileSync(path.join(__dirname, '..', 'ca-certificate.crt')).toString();

async function testSequelizeConnection() {
    console.log('Testing Sequelize connection...');
    const sequelize = new Sequelize(config.database, config.username, config.password, {
        host: config.host,
        port: config.port,
        dialect: 'postgres',
        dialectOptions: {
            ssl: {
                require: true,
                ca: caCert
            },
            connectTimeout: 10000 // 10 second timeout
        },
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
        logging: console.log
    });

    try {
        await sequelize.authenticate();
        console.log('Sequelize connection successful!');
        
        // Try a simple query
        const result = await sequelize.query('SELECT NOW()');
        console.log('Query result:', result[0][0]);
        
        await sequelize.close();
    } catch (error) {
        console.error('Sequelize connection error:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.parent?.code,
            syscall: error.parent?.syscall,
            address: error.parent?.address,
            port: error.parent?.port
        });
    }
}

async function testPgConnection() {
    console.log('\nTesting pg connection...');
    const client = new Client({
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.username,
        password: config.password,
        ssl: {
            require: true,
            ca: caCert
        },
        connectionTimeoutMillis: 10000 // 10 second timeout
    });

    try {
        await client.connect();
        console.log('pg connection successful!');
        
        // Try a simple query
        const result = await client.query('SELECT NOW()');
        console.log('Query result:', result.rows[0]);
        
        await client.end();
    } catch (error) {
        console.error('pg connection error:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            syscall: error.syscall,
            address: error.address,
            port: error.port
        });
    }
}

// Run both tests
async function runTests() {
    console.log('Database connection test starting...');
    console.log('Configuration:', {
        ...config,
        password: '***hidden***'
    });
    
    await testSequelizeConnection();
    await testPgConnection();
}

runTests().catch(error => {
    console.error('Top level error:', error);
    process.exit(1);
});
