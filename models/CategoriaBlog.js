const db = require('../config/db')

const CategoriaBlog = db.sequelize.define('categoriasBlog', {
    id_categoriaBlog: {
        type: db.Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    nome_categoriaBlog: {
        type: db.Sequelize.STRING(150),
        allowNull: false
    },
    slug_categoriaBlog: {
        type: db.Sequelize.STRING(255),
        allowNull: false
    },
    data_categoriaBlog: {
        type: db.Sequelize.DATE,
        allowNull: false,
        defaultValue: db.Sequelize.NOW
    }
})

module.exports = CategoriaBlog