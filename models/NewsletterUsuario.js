const db = require('../config/db')

const NewsletterUsuario = db.sequelize.define('newsletterUsuarios', {
    id_usuario_newsletter: {
        type: db.Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    nome_usuario_newsletter: {
        type: db.Sequelize.STRING(100),
        allowNull: false
    },
    email_usuario_newsletter: {
        type: db.Sequelize.STRING(255),
        allowNull: false,
        unique: true
    },
    data_inscricao: {
        type: db.Sequelize.DATE,
        allowNull: false,
        defaultValue: db.Sequelize.NOW
    }
})

module.exports = NewsletterUsuario