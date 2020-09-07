const config = require("./config.json");
var mysql = require('mysql');

var mod = {};

var createPool = (conf) => {
    var pool  = mysql.createPool({
        host: conf.host,
        user: conf.user,
        password: conf.password,
        database: conf.database,
        connectionLimit: conf.connectionLimit
    });
    return pool;
};

mod.getConnectionAmrs = async () => {
    return new Promise((success, error)=>{
        mod.amrsPool.getConnection((err,conn)=>{
            if (err) { 
                error(err); 
                return; // not connected!
            }
            success(conn);
        })
    });
};

mod.getConnectionKenyaemr = async () => {
    return new Promise((success, error)=>{
        mod.kenyaemrPool.getConnection((err,conn)=>{
            if (err) { 
                error(err); 
                return; // not connected!
            }
            success(conn);
        })
    });
};

mod.createConnectionPool = () => {
    mod.amrsPool = createPool(config.amrsConnection);
    mod.kenyaemrPool = createPool(config.kenyaemrConnection);
};

var queryPool = (pool, query) => {
    return new Promise((success, error)=>{
        pool.query(query, function (err, results, fields) {
            if (err) error(error);
            success(results);
        });
    });
};

mod.queryAmrs = async (query) => {
    return await queryPool(mod.amrsPool, query);
};

mod.queryKenyaemr = async (query) => {
    return await queryPool(mod.kenyaemrPool, query);
};

mod.closeAmrsPool = async () => {
    return new Promise((success, error)=>{
        mod.amrsPool.end(function (err) {
                // all connections in the pool have ended
            if(err) {
                error(err)
            } else {
                success();
            }
        });
    });
};

mod.closeKenyaemrPool = async () => {
    return new Promise((success, error)=>{
        mod.kenyaemrPool.end(function (err) {
                // all connections in the pool have ended
            if(err) {
                error(err)
            } else {
                success();
            }
        });
    });
};

mod.closeAllConnections = async () => {
    await mod.closeAmrsPool();
    await mod.closeKenyaemrPool();
};

module.exports = mod;