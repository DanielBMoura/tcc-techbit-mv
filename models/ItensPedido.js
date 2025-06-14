const db = require('../config/db')

const ItensPedido = db.sequelize.define('itenspedidos', {
    id_itemPedido: {
        type: db.Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    quantidade_itemPedido: {
        type: db.Sequelize.INTEGER,
        allowNull: true
    }
})

module.exports = ItensPedido