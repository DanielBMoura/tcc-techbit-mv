const db = require('../config/db')

const Produto = db.sequelize.define('produtos', {
    id_produto: {
        type: db.Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    nome_produto: {
        type: db.Sequelize.STRING(150),
        allowNull: false
    },
    slug_produto: {
        type: db.Sequelize.STRING(255),
        allowNull: false
    },
    imagens_produto: {
        type: db.Sequelize.JSON,
        allowNull: false
    },
    estoque_produto: {
        type: db.Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0
    },
    info_produto: {
        type: db.Sequelize.TEXT,
        allowNull: false
    }
})

module.exports = Produto