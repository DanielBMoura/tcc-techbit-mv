const db = require('../config/db')

const ItensOrcamento = db.sequelize.define('itensorcamento', {
    id_itemOrcamento: {
        type: db.Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    quantidade_itemOrcamento: {
        type: db.Sequelize.INTEGER,
        allowNull: true
    }
})

module.exports = ItensOrcamento