const db = require('../config/db')

const Endereco = db.sequelize.define('enderecos', {
    id_endereco: {
        type: db.Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    rua: {
        type: db.Sequelize.STRING(150),
        allowNull: false
    },
    bairro: {
        type: db.Sequelize.STRING(100),
        allowNull: false
    }, 
    cidade: {
        type: db.Sequelize.STRING(100),
        allowNull: false
    },
    uf: {
        type: db.Sequelize.STRING(2),
        allowNull: false
    },
    cep: {
        type: db.Sequelize.STRING(9),
        allowNull: false
    }
})

module.exports = Endereco