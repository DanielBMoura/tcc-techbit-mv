const db = require('../config/db')

const Usuario = db.sequelize.define('usuarios', {
    id_usuario: {
        type: db.Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    nome_usuario: {
        type: db.Sequelize.STRING(100),
        allowNull: false
    },
    email_usuario: {
        type: db.Sequelize.STRING(255),
        allowNull: false,
        unique: true
    },
    senha_usuario: {
        type: db.Sequelize.STRING(150),
        allowNull: false
    },
    telefone_usuario: {
        type: db.Sequelize.STRING(20),
        allowNull: false,
        unique: true
    },
    data_nascimento_usuario: {
        type: db.Sequelize.DATE,
        allowNull: false
    },
    eAdmin: {
        type: db.Sequelize.INTEGER,
        allowNull: false
    },
    numero: {
        type: db.Sequelize.STRING(10),
        allowNull: false
    },
    complemento: {
        type: db.Sequelize.STRING(150),
        allowNull: true
    }
})

module.exports = Usuario